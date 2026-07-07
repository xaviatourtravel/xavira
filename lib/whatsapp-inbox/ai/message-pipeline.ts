import { actionEngine } from "@/modules/ai/action-engine";
import { improveReplyQuality } from "@/modules/ai/services/ai-reply-quality-guard";
import { memoryService } from "@/modules/ai/services/memory-service";
import { leadQualificationService } from "@/modules/ai/services/lead-qualification-service";
import { retrieveRelevantContext } from "@/modules/ai/services/context-retrieval-engine";
import { validateAIResponse } from "@/modules/ai/services/ai-safety-validator";
import { normalizeAiConfidenceScore } from "@/modules/business-brain/lib/resolve-ai-source-labels";
import { buildBusinessBrainContext } from "@/modules/business-brain/services/context-builder";
import { EMPTY_BUSINESS_BRAIN_CONTEXT } from "@/modules/business-brain/types/context";
import { WHATSAPP_AI_DEBOUNCE_MS } from "@/lib/whatsapp-inbox/ai/constants";
import { insertAiEvent } from "@/lib/whatsapp-inbox/ai/event-log";
import { aiHandoffService } from "@/lib/whatsapp-inbox/ai/handoff-service";
import { intentClassifierService } from "@/lib/whatsapp-inbox/ai/intent-classifier-service";
import {
  loadWhatsappConversationHistoryForAi,
  mapWhatsappMessagesToConversationTurns,
} from "@/lib/whatsapp-inbox/ai/conversation-history";
import {
  aiLLMReplyService,
  WHATSAPP_AI_LLM_FALLBACK_REPLY,
} from "@/lib/whatsapp-inbox/ai/llm-reply-service";
import { sendAiWhatsappMessage } from "@/lib/whatsapp-inbox/ai/message-sender";
import { aiOwnershipService } from "@/lib/whatsapp-inbox/ai/ownership-service";
import { aiReplyService } from "@/lib/whatsapp-inbox/ai/reply-service";
import type { AiPipelineInput } from "@/lib/whatsapp-inbox/ai/types";
import type { WhatsappConversationRow, WhatsappMessageRow } from "@/types/whatsapp-inbox";
import {
  getWorkspaceDisplayName,
  loadAiWorkspaceProfile,
  sanitizeAiReplyBranding,
} from "@/lib/whatsapp-inbox/ai/workspace-profile";
import { resolveWhatsappContactDisplay } from "@/lib/whatsapp-inbox/display";
import {
  findWhatsappMessageById,
  type WhatsappSupabaseClient,
} from "@/lib/whatsapp-inbox/repository";

const WA_AI_LOG = "[WA_AI]";

function logPipeline(message: string, data?: Record<string, unknown>) {
  if (data) {
    console.log(`${WA_AI_LOG} ${message}`, data);
  } else {
    console.log(`${WA_AI_LOG} ${message}`);
  }
}

type ConversationDebounceState = {
  workspaceId: string;
  supabase: WhatsappSupabaseClient;
  pendingMessageIds: string[];
  queuedDuringProcessing: string[];
  debounceTimer: ReturnType<typeof setTimeout> | null;
  processing: boolean;
};

const debounceByConversation = new Map<string, ConversationDebounceState>();

function getOrCreateDebounceState(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
  conversationId: string,
) {
  let state = debounceByConversation.get(conversationId);

  if (!state) {
    state = {
      workspaceId,
      supabase,
      pendingMessageIds: [],
      queuedDuringProcessing: [],
      debounceTimer: null,
      processing: false,
    };
    debounceByConversation.set(conversationId, state);
  }

  state.workspaceId = workspaceId;
  state.supabase = supabase;
  return state;
}

function appendUniqueMessageId(target: string[], messageId: string) {
  if (!target.includes(messageId)) {
    target.push(messageId);
  }
}

function scheduleDebounceFlush(conversationId: string, state: ConversationDebounceState) {
  if (state.debounceTimer) {
    clearTimeout(state.debounceTimer);
  }

  state.debounceTimer = setTimeout(() => {
    state.debounceTimer = null;
    void flushDebounce(conversationId);
  }, WHATSAPP_AI_DEBOUNCE_MS);
}

async function flushDebounce(conversationId: string) {
  const state = debounceByConversation.get(conversationId);
  if (!state || state.processing) {
    return;
  }

  if (state.pendingMessageIds.length === 0) {
    if (!state.debounceTimer) {
      debounceByConversation.delete(conversationId);
    }
    return;
  }

  const incomingMessageIds = [...state.pendingMessageIds];
  state.pendingMessageIds = [];
  state.processing = true;

  try {
    await processWhatsappAiMessagePipeline(state.supabase, {
      workspaceId: state.workspaceId,
      conversationId,
      incomingMessageIds,
    });
  } catch (error) {
    logPipeline("pipeline failed", {
      conversationId,
      incomingMessageIds,
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    state.processing = false;

    if (state.queuedDuringProcessing.length > 0) {
      for (const messageId of state.queuedDuringProcessing) {
        appendUniqueMessageId(state.pendingMessageIds, messageId);
      }
      state.queuedDuringProcessing = [];
    }

    if (state.pendingMessageIds.length > 0) {
      scheduleDebounceFlush(conversationId, state);
    } else if (!state.debounceTimer) {
      debounceByConversation.delete(conversationId);
    }
  }
}

async function logSkipped(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
  conversationId: string,
  messageId: string | null,
  reason: string,
  code: string,
  metadata?: Record<string, unknown>,
) {
  await insertAiEvent(supabase, {
    workspaceId,
    conversationId,
    messageId,
    eventType: "AI_LLM_SKIPPED",
    reason,
    metadata: { code, ...metadata },
  });

  logPipeline("AI_LLM_SKIPPED", { conversationId, code, reason });
}

async function triggerLlmHandoff(
  supabase: WhatsappSupabaseClient,
  args: {
    workspaceId: string;
    conversation: WhatsappConversationRow;
    incomingMessageId: string;
    intent: string;
    confidence: number;
    reason: string;
    messageText: string;
    companyName: string;
    batchMessageIds?: string[];
    transparency?: {
      usedSources: string[];
      confidence: number;
      handoffRequired: boolean;
    };
  },
) {
  const handoffText = sanitizeAiReplyBranding(
    aiReplyService.getHandoffReply(),
    args.messageText,
    args.companyName,
  );

  await insertAiEvent(supabase, {
    workspaceId: args.workspaceId,
    conversationId: args.conversation.id,
    messageId: args.incomingMessageId,
    eventType: "AI_LLM_HANDOFF",
    intent: args.intent,
    confidence: args.confidence,
    reason: args.reason,
    metadata: {
      batchMessageIds: args.batchMessageIds ?? [],
      handoffSource: "pipeline",
      usedSources: args.transparency?.usedSources ?? [],
      confidence: args.transparency?.confidence ?? normalizeAiConfidenceScore(args.confidence),
      handoffRequired: args.transparency?.handoffRequired ?? true,
    },
  });

  logPipeline("AI_LLM_HANDOFF", {
    conversationId: args.conversation.id,
    reason: args.reason,
    intent: args.intent,
  });

  // LLM only recommends; Action Engine owns side effects.
  await actionEngine.processActions(
    actionEngine.recommendActionsFromLlm({
      handoffRequired: true,
      handoffReason: args.reason,
      confidence: args.confidence,
    }),
    {
      supabase,
      workspaceId: args.workspaceId,
      conversation: args.conversation,
      incomingMessageId: args.incomingMessageId,
      messageText: args.messageText,
      handoffText,
    },
  );
}

async function loadIncomingBatchMessages(
  supabase: WhatsappSupabaseClient,
  messageIds: string[],
) {
  const messages = await Promise.all(
    messageIds.map((messageId) => findWhatsappMessageById(supabase, messageId)),
  );

  return messages
    .filter(
      (message): message is WhatsappMessageRow =>
        message !== null &&
        message.direction === "incoming" &&
        Boolean(message.text?.trim()),
    )
    .sort(
      (left, right) =>
        Date.parse(left.timestamp) - Date.parse(right.timestamp),
    );
}

function mergeIncomingMessageText(messages: WhatsappMessageRow[]) {
  return messages.map((message) => message.text?.trim() ?? "").join("\n");
}

function classifyBatchIntent(
  messages: WhatsappMessageRow[],
  conversationHistory: ReturnType<typeof mapWhatsappMessagesToConversationTurns>,
) {
  for (const message of messages) {
    const classification = intentClassifierService.classifyIntent(
      message.text?.trim() ?? "",
      conversationHistory,
    );

    if (classification.requiresHuman) {
      return classification;
    }
  }

  return intentClassifierService.classifyIntent(
    mergeIncomingMessageText(messages),
    conversationHistory,
  );
}

export async function processWhatsappAiMessagePipeline(
  supabase: WhatsappSupabaseClient,
  input: AiPipelineInput,
) {
  const { workspaceId, conversationId, incomingMessageIds } = input;
  const primaryIncomingMessageId =
    incomingMessageIds[incomingMessageIds.length - 1] ?? null;

  const autoReplyCheck = await aiOwnershipService.shouldAutoReply(
    supabase,
    workspaceId,
    conversationId,
  );

  if (!autoReplyCheck.allowed) {
    await logSkipped(
      supabase,
      workspaceId,
      conversationId,
      primaryIncomingMessageId,
      autoReplyCheck.reason,
      autoReplyCheck.code,
      autoReplyCheck.conversation
        ? {
            aiState: autoReplyCheck.conversation.ai_state,
            batchMessageIds: incomingMessageIds,
          }
        : { batchMessageIds: incomingMessageIds },
    );
    return;
  }

  const conversation = autoReplyCheck.conversation;
  const incomingMessages = await loadIncomingBatchMessages(
    supabase,
    incomingMessageIds,
  );

  if (incomingMessages.length === 0) {
    await logSkipped(
      supabase,
      workspaceId,
      conversationId,
      primaryIncomingMessageId,
      "No valid incoming messages in batch",
      "invalid_incoming_message",
      { batchMessageIds: incomingMessageIds },
    );
    return;
  }

  const latestIncomingMessage =
    incomingMessages[incomingMessages.length - 1] ?? incomingMessages[0];
  const incomingMessageId = latestIncomingMessage.id;
  const messageText = mergeIncomingMessageText(incomingMessages);
  const batchMessageIds = incomingMessages.map((message) => message.id);

  const conversationMemory = await memoryService.extractAndSaveFromMessage(supabase, {
    workspaceId,
    conversationId,
    customerId: conversation.customer_id,
    messageText,
    messageId: incomingMessageId,
  });

  const leadQualification = await leadQualificationService.updateQualification(supabase, {
    workspaceId,
    conversationId,
    customerId: conversation.customer_id,
    messageId: incomingMessageId,
    memory: conversationMemory,
  });

  if (
    leadQualificationService.shouldTriggerQualificationHandoff(
      conversation,
      leadQualification,
    )
  ) {
    await actionEngine.processActions(
      [actionEngine.recommendQualificationHandoverAction(leadQualification)],
      {
        supabase,
        workspaceId,
        conversation,
        incomingMessageId,
        messageText,
        leadQualification,
        conversationMemory,
      },
    );
    return;
  }

  const historyMessages = await loadWhatsappConversationHistoryForAi(
    supabase,
    conversationId,
  );
  const conversationHistory = mapWhatsappMessagesToConversationTurns(
    historyMessages,
    { excludeMessageIds: batchMessageIds },
  );

  const classification = classifyBatchIntent(
    incomingMessages,
    conversationHistory,
  );

  const workspaceProfile = await loadAiWorkspaceProfile(supabase, workspaceId);
  const companyName = workspaceProfile
    ? getWorkspaceDisplayName(workspaceProfile)
    : "tim kami";

  await insertAiEvent(supabase, {
    workspaceId,
    conversationId,
    messageId: incomingMessageId,
    eventType: "AI_INTENT_CLASSIFIED",
    intent: classification.intent,
    confidence: classification.confidence,
    reason: classification.reason ?? null,
    metadata: {
      intent: classification.intent,
      confidence: classification.confidence,
      requiresHuman: classification.requiresHuman,
      category: classification.category,
      batchMessageIds,
      debounced: incomingMessages.length > 1,
    },
  });

  logPipeline("INTENT_CLASSIFIED", {
    conversationId,
    incomingMessageId,
    batchSize: incomingMessages.length,
    intent: classification.intent,
    requiresHuman: classification.requiresHuman,
    confidence: classification.confidence,
    category: classification.category,
  });

  if (aiHandoffService.requiresHandoff(classification)) {
    await triggerLlmHandoff(supabase, {
      workspaceId,
      conversation,
      incomingMessageId,
      intent: classification.intent,
      confidence: classification.confidence,
      reason: classification.reason ?? "Percakapan memerlukan bantuan tim",
      messageText,
      companyName,
      batchMessageIds: incomingMessages.map((message) => message.id),
    });
    return;
  }

  await insertAiEvent(supabase, {
    workspaceId,
    conversationId,
    messageId: incomingMessageId,
    eventType: "AI_LLM_REPLY_STARTED",
    intent: classification.intent,
    confidence: classification.confidence,
    metadata: {
      batchMessageIds,
      debounced: incomingMessages.length > 1,
      historyTurns: conversationHistory.length,
    },
  });

  logPipeline("AI_LLM_REPLY_STARTED", {
    conversationId,
    incomingMessageId,
    batchSize: incomingMessages.length,
    historyTurns: conversationHistory.length,
  });

  const businessBrainContextResult = await buildBusinessBrainContext(workspaceId, {
    customerMessage: messageText,
    includeDraft: false,
  });
  const { meta: businessBrainMeta, ...fullBusinessBrainContext } =
    businessBrainContextResult;

  const retrievedContext = retrieveRelevantContext({
    workspaceId,
    customerMessage: messageText,
    intent: classification.intent,
    businessBrainContext: fullBusinessBrainContext,
  });

  await insertAiEvent(supabase, {
    workspaceId,
    conversationId,
    messageId: incomingMessageId,
    eventType: "CONTEXT_RETRIEVED",
    intent: classification.intent,
    confidence: classification.confidence,
    metadata: {
      intent: retrievedContext.retrievalSummary.intent,
      matchedKeywords: retrievedContext.retrievalSummary.matchedKeywords,
      productCount: retrievedContext.retrievalSummary.productCount,
      articleCount: retrievedContext.retrievalSummary.articleCount,
      documentCount: retrievedContext.retrievalSummary.documentCount,
      behaviorCount: retrievedContext.retrievalSummary.behaviorCount,
      batchMessageIds,
      debounced: incomingMessages.length > 1,
    },
  });

  logPipeline("CONTEXT_RETRIEVED", {
    conversationId,
    incomingMessageId,
    intent: retrievedContext.retrievalSummary.intent,
    matchedKeywords: retrievedContext.retrievalSummary.matchedKeywords,
    productCount: retrievedContext.retrievalSummary.productCount,
    articleCount: retrievedContext.retrievalSummary.articleCount,
    documentCount: retrievedContext.retrievalSummary.documentCount,
  });

  await memoryService.logMemoryUsed(supabase, {
    workspaceId,
    conversationId,
    messageId: incomingMessageId,
    memory: conversationMemory,
  });

  const llmResult = await aiLLMReplyService.generateWhatsAppReply({
    workspaceId,
    workspaceName: companyName,
    customerMessage: messageText,
    conversationHistory,
    retrievedContext,
    conversationMemory,
    leadQualification,
    contextSource: businessBrainMeta.source,
    runtimeContext: {
      timezone: workspaceProfile?.timezone,
      workspaceId,
      workspaceName: companyName,
      businessName:
        workspaceProfile?.companyName ??
        workspaceProfile?.businessName ??
        companyName,
      currentUser: "AI Assistant",
    },
  });

  logPipeline("llm reply generated", {
    conversationId,
    incomingMessageId,
    batchSize: incomingMessages.length,
    generationTimeMs: llmResult.generationTimeMs,
    handoffRequired: llmResult.handoffRequired,
    usedFallback: llmResult.usedFallback,
    contextSource: llmResult.contextSource,
    error: llmResult.error,
  });

  if (llmResult.handoffRequired) {
    await triggerLlmHandoff(supabase, {
      workspaceId,
      conversation,
      incomingMessageId,
      intent: classification.intent,
      confidence: classification.confidence,
      reason:
        llmResult.handoffReason ?? "LLM menandai percakapan perlu bantuan tim",
      messageText,
      companyName,
      batchMessageIds,
      transparency: {
        usedSources: llmResult.sourceLabels,
        confidence: normalizeAiConfidenceScore(llmResult.confidence),
        handoffRequired: true,
      },
    });
    return;
  }

  if (!llmResult.success || llmResult.usedFallback) {
    const stillActive = await aiOwnershipService.shouldAutoReply(
      supabase,
      workspaceId,
      conversationId,
    );

    if (!stillActive.allowed) {
      await insertAiEvent(supabase, {
        workspaceId,
        conversationId,
        messageId: incomingMessageId,
        eventType: "AI_LLM_FAILED",
        intent: classification.intent,
        confidence: classification.confidence,
        reason: llmResult.error ?? "LLM failed",
        metadata: {
          batchMessageIds,
          skippedFallback: true,
          aiState: stillActive.conversation?.ai_state ?? null,
        },
      });

      logPipeline("AI_LLM_FAILED", {
        conversationId,
        error: llmResult.error,
        skippedFallback: true,
      });
      return;
    }

    const fallbackText = sanitizeAiReplyBranding(
      WHATSAPP_AI_LLM_FALLBACK_REPLY,
      messageText,
      companyName,
    );

    const sentMessage = await sendAiWhatsappMessage(supabase, {
      workspaceId,
      conversation,
      text: fallbackText,
      incomingMessageId,
      rawPayload: {
        source: "ai_auto_reply",
        aiAction: "llm_fallback",
        intent: classification.intent,
        confidence: classification.confidence,
        llm: true,
        usedFallback: true,
        generationTimeMs: llmResult.generationTimeMs,
        batchMessageIds,
        debounced: incomingMessages.length > 1,
        llmError: llmResult.error ?? null,
        contextSource: llmResult.contextSource ?? null,
      },
    });

    await aiOwnershipService.markAIAction(supabase, workspaceId, conversationId);

    await insertAiEvent(supabase, {
      workspaceId,
      conversationId,
      messageId: sentMessage.id,
      eventType: "AI_LLM_FAILED",
      intent: classification.intent,
      confidence: classification.confidence,
      reason: llmResult.error ?? "LLM failed",
      metadata: {
        incomingMessageId,
        batchMessageIds,
        debounced: incomingMessages.length > 1,
        replyPreview: fallbackText.slice(0, 120),
        outgoingMessageId: sentMessage.id,
        usedFallback: true,
        generationTimeMs: llmResult.generationTimeMs,
        contextSource: llmResult.contextSource ?? null,
      },
    });

    logPipeline("AI_LLM_FAILED", {
      conversationId,
      messageId: sentMessage.id,
      error: llmResult.error,
      usedFallback: true,
    });
    return;
  }

  const customer = resolveWhatsappContactDisplay(conversation);
  const hasPriorBusinessReplies = historyMessages.some(
    (message) =>
      message.direction === "outgoing" &&
      (message.sender_type === "ai" || message.sender_type === "human"),
  );

  const safetyValidation = validateAIResponse({
    reply: llmResult.reply,
    handoffRequired: llmResult.handoffRequired,
    handoffReason: llmResult.handoffReason,
    documentActions: llmResult.documentActions,
    actions: llmResult.actions,
    businessBrainContext:
      llmResult.businessBrainContext ?? EMPTY_BUSINESS_BRAIN_CONTEXT,
    customerMessage: messageText,
    hasPriorBusinessReplies,
    customerName: customer.primaryName,
    companyName,
  });

  if (safetyValidation.forceHandoff || !safetyValidation.allowed) {
    await insertAiEvent(supabase, {
      workspaceId,
      conversationId,
      messageId: incomingMessageId,
      eventType: "AI_VALIDATION_FAILED",
      intent: classification.intent,
      confidence: classification.confidence,
      reason: safetyValidation.reason ?? "AI response failed safety validation",
      metadata: {
        batchMessageIds,
        replyPreview: llmResult.reply.slice(0, 120),
        validationReason: safetyValidation.reason ?? null,
      },
    });

    logPipeline("AI_VALIDATION_FAILED", {
      conversationId,
      reason: safetyValidation.reason,
    });

    await triggerLlmHandoff(supabase, {
      workspaceId,
      conversation,
      incomingMessageId,
      intent: classification.intent,
      confidence: classification.confidence,
      reason:
        safetyValidation.reason ?? "Balasan AI tidak lolos validasi keamanan",
      messageText,
      companyName,
      batchMessageIds,
      transparency: {
        usedSources: llmResult.sourceLabels,
        confidence: normalizeAiConfidenceScore(llmResult.confidence),
        handoffRequired: true,
      },
    });
    return;
  }

  const validatedReplyText =
    safetyValidation.sanitizedReply ??
    sanitizeAiReplyBranding(llmResult.reply, messageText, companyName);

  if (safetyValidation.sanitized) {
    await insertAiEvent(supabase, {
      workspaceId,
      conversationId,
      messageId: incomingMessageId,
      eventType: "AI_RESPONSE_SANITIZED",
      intent: classification.intent,
      confidence: classification.confidence,
      metadata: {
        batchMessageIds,
        originalPreview: llmResult.reply.slice(0, 120),
        sanitizedPreview: validatedReplyText.slice(0, 120),
      },
    });

    logPipeline("AI_RESPONSE_SANITIZED", {
      conversationId,
      incomingMessageId,
    });
  } else {
    await insertAiEvent(supabase, {
      workspaceId,
      conversationId,
      messageId: incomingMessageId,
      eventType: "AI_VALIDATION_PASSED",
      intent: classification.intent,
      confidence: classification.confidence,
      metadata: {
        batchMessageIds,
        replyPreview: validatedReplyText.slice(0, 120),
      },
    });

    logPipeline("AI_VALIDATION_PASSED", {
      conversationId,
      incomingMessageId,
    });
  }

  const qualityResult = improveReplyQuality({
    reply: validatedReplyText,
    conversationHistory,
    customerMessage: messageText,
    businessBrainContext:
      llmResult.businessBrainContext ?? EMPTY_BUSINESS_BRAIN_CONTEXT,
  });

  const finalReplyText = qualityResult.reply;

  if (qualityResult.changed) {
    await insertAiEvent(supabase, {
      workspaceId,
      conversationId,
      messageId: incomingMessageId,
      eventType: "AI_REPLY_QUALITY_CHANGED",
      intent: classification.intent,
      confidence: classification.confidence,
      metadata: {
        batchMessageIds,
        originalPreview: validatedReplyText.slice(0, 120),
        improvedPreview: finalReplyText.slice(0, 120),
        changes: qualityResult.changes,
      },
    });

    logPipeline("AI_REPLY_QUALITY_CHANGED", {
      conversationId,
      incomingMessageId,
      changes: qualityResult.changes,
    });
  } else {
    await insertAiEvent(supabase, {
      workspaceId,
      conversationId,
      messageId: incomingMessageId,
      eventType: "AI_REPLY_QUALITY_PASSED",
      intent: classification.intent,
      confidence: classification.confidence,
      metadata: {
        batchMessageIds,
        replyPreview: finalReplyText.slice(0, 120),
      },
    });

    logPipeline("AI_REPLY_QUALITY_PASSED", {
      conversationId,
      incomingMessageId,
    });
  }

  const sentMessage = await sendAiWhatsappMessage(supabase, {
    workspaceId,
    conversation,
    text: finalReplyText,
    incomingMessageId,
    rawPayload: {
      source: "ai_auto_reply",
      aiAction: "auto_reply",
      intent: classification.intent,
      confidence: classification.confidence,
      llm: true,
      usedFallback: false,
      generationTimeMs: llmResult.generationTimeMs,
      batchMessageIds,
      debounced: incomingMessages.length > 1,
      contextSource: llmResult.contextSource ?? null,
      llmConfidence: normalizeAiConfidenceScore(llmResult.confidence),
      suggestedActions: llmResult.suggestedActions,
    },
  });

  await aiOwnershipService.markAIAction(supabase, workspaceId, conversationId);

  await insertAiEvent(supabase, {
    workspaceId,
    conversationId,
    messageId: sentMessage.id,
    eventType: "AI_LLM_REPLY_SENT",
    intent: classification.intent,
    confidence: classification.confidence,
    metadata: {
      incomingMessageId,
      batchMessageIds,
      debounced: incomingMessages.length > 1,
      replyPreview: finalReplyText.slice(0, 120),
      qualityChanged: qualityResult.changed,
      qualityChanges: qualityResult.changes,
      llm: true,
      usedFallback: false,
      generationTimeMs: llmResult.generationTimeMs,
      usedSources: llmResult.sourceLabels,
      confidence: normalizeAiConfidenceScore(llmResult.confidence),
      handoffRequired: false,
      suggestedActions: llmResult.suggestedActions,
      documentActions: llmResult.documentActions,
      actions: llmResult.actions,
      contextSource: llmResult.contextSource ?? null,
    },
  });

  logPipeline("AI_LLM_REPLY_SENT", {
    conversationId,
    intent: classification.intent,
    messageId: sentMessage.id,
    batchSize: incomingMessages.length,
    generationTimeMs: llmResult.generationTimeMs,
  });

  // Text reply is already sent. Action Engine validates and executes side effects.
  await actionEngine.processActions(
    actionEngine.recommendActionsFromLlm({
      actions: llmResult.actions,
      documentActions: llmResult.documentActions,
      suggestedActions: llmResult.suggestedActions,
      confidence: llmResult.confidence,
      handoffRequired: false,
    }),
    {
      supabase,
      workspaceId,
      conversation,
      incomingMessageId,
      messageText,
      leadQualification,
      conversationMemory,
    },
  );
}

export function scheduleWhatsappAiMessagePipeline(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
  conversationId: string,
  incomingMessageId: string,
) {
  const state = getOrCreateDebounceState(supabase, workspaceId, conversationId);

  if (state.processing) {
    appendUniqueMessageId(state.queuedDuringProcessing, incomingMessageId);
    logPipeline("message queued during processing", {
      conversationId,
      incomingMessageId,
      queuedCount: state.queuedDuringProcessing.length,
    });
    return;
  }

  appendUniqueMessageId(state.pendingMessageIds, incomingMessageId);
  scheduleDebounceFlush(conversationId, state);

  logPipeline("message debounced", {
    conversationId,
    incomingMessageId,
    pendingCount: state.pendingMessageIds.length,
    debounceMs: WHATSAPP_AI_DEBOUNCE_MS,
  });
}

/** @deprecated Use scheduleWhatsappAiMessagePipeline */
export const scheduleWhatsappAiAutoReply = scheduleWhatsappAiMessagePipeline;
