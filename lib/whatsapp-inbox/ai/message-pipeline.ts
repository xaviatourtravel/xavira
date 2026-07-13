import { actionEngine } from "@/modules/ai/action-engine";
import { improveReplyQuality } from "@/modules/ai/services/ai-reply-quality-guard";
import { memoryService } from "@/modules/ai/services/memory-service";
import { leadQualificationService } from "@/modules/ai/services/lead-qualification-service";
import { retrieveRelevantContext } from "@/modules/ai/services/context-retrieval-engine";
import { assessBusinessBrainCompleteness } from "@/modules/ai/prompt-compiler";
import { isPromptCompilerV2Enabled } from "@/modules/ai/prompt-compiler/feature-flag";
import {
  buildLivePlanningInput,
  buildResponsePlan,
  buildPlanObservabilityMetadata,
  applyValidatedReply,
  executePlanDocumentDelivery,
  DOCUMENT_DELIVERY_FAILURE_REPLY_ID,
  isAnswerFirstV1Enabled,
} from "@/modules/ai/response-planner";
import type { ResponsePlan, PlanValidationResult } from "@/modules/ai/response-planner/types";
import {
  conversationStateService,
  applyGreetingGuard,
  isConversationStateV1Enabled,
} from "@/modules/ai/conversation-state";
import type { ConversationAiStateRecord } from "@/modules/ai/conversation-state";
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
    handoffText?: string;
    batchMessageIds?: string[];
    transparency?: {
      usedSources: string[];
      confidence: number;
      handoffRequired: boolean;
    };
    observability?: Record<string, unknown>;
  },
) {
  const handoffText = sanitizeAiReplyBranding(
    args.handoffText ?? aiReplyService.getHandoffReply(),
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
      ...args.observability,
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
    if (isConversationStateV1Enabled()) {
      const earlyState = await conversationStateService.loadOrInitialize(supabase, {
        workspaceId,
        conversationId,
        customerId: conversation.customer_id,
        customerName: conversation.contact_name,
        aiState: conversation.ai_state,
        historyMessages,
      });
      await conversationStateService.updateAfterHandoff(supabase, {
        state: earlyState,
        handoffReason: classification.reason ?? "Intent requires human",
        succeeded: false,
      });
    }

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

  const hasPriorBusinessReplies = historyMessages.some(
    (message) =>
      message.direction === "outgoing" &&
      (message.sender_type === "ai" || message.sender_type === "human"),
  );
  const isNewConversation = conversationHistory.length === 0;

  let conversationAiState: ConversationAiStateRecord | null = null;
  let conversationStatePromptContext = null;

  if (isConversationStateV1Enabled()) {
    conversationAiState = await conversationStateService.loadOrInitialize(supabase, {
      workspaceId,
      conversationId,
      customerId: conversation.customer_id,
      customerName: conversation.contact_name,
      aiState: conversation.ai_state,
      historyMessages,
    });

    conversationAiState = await conversationStateService.touchInboundMessage(
      supabase,
      conversationAiState,
    );

    conversationAiState = conversationStateService.mergeMemoryIntoState(
      conversationAiState,
      conversationMemory,
      incomingMessageId,
    );

    conversationStatePromptContext = conversationStateService.buildPromptContext({
      state: conversationAiState,
      hasPriorBusinessReplies,
      incomingMessage: messageText,
      aiState: conversation.ai_state,
      qualification: leadQualification,
    });
  }

  const greetingObservability = conversationStatePromptContext
    ? conversationStateService.buildObservabilityMetadata({
        state: conversationAiState!,
        promptContext: conversationStatePromptContext,
      })
    : {};

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
      hasPriorBusinessReplies,
      isNewConversation,
      promptCompilerV2: isPromptCompilerV2Enabled(),
      conversationStateV1: isConversationStateV1Enabled(),
      ...greetingObservability,
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

  const businessBrainCompleteness = assessBusinessBrainCompleteness(fullBusinessBrainContext);

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
      publishedVersionId: businessBrainMeta.publishedVersionId,
      publishedVersionNumber: businessBrainMeta.publishedVersionNumber,
      businessBrainSource: businessBrainMeta.source,
      includeDraft: false,
      businessBrainCompleteness,
      retrievedProductIds: retrievedContext.relevantProducts.map((item) => item.id),
      retrievedKnowledgeIds: retrievedContext.relevantArticles.map((item) => item.id),
      retrievedDocumentIds: retrievedContext.relevantDocuments.map((item) => item.id),
      appliedBehaviorIds: retrievedContext.relevantBehaviors.map((item) => item.id),
      conversationHistoryCount: conversationHistory.length,
      batchMessageIds,
      debounced: incomingMessages.length > 1,
      promptCompilerV2: isPromptCompilerV2Enabled(),
      conversationStateV1: isConversationStateV1Enabled(),
      ...greetingObservability,
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

  let responsePlan: ResponsePlan | null = null;
  let planObservability: Record<string, unknown> = {};

  if (isAnswerFirstV1Enabled()) {
    const planningInput = buildLivePlanningInput({
      workspaceId,
      latestMessage: messageText,
      recentHistory: conversationHistory,
      intent: classification.intent,
      conversationState: conversationAiState,
      conversationStateContext: conversationStatePromptContext,
      selectedEntity: conversationAiState?.selectedEntity ?? null,
      publishedBusinessBrain: fullBusinessBrainContext,
      retrievedContext,
      memory: conversationMemory,
      qualification: leadQualification,
      timezone: workspaceProfile?.timezone,
    });
    responsePlan = buildResponsePlan(planningInput);
    planObservability = buildPlanObservabilityMetadata(responsePlan);
  }

  const llmResult = await aiLLMReplyService.generateWhatsAppReply({
    workspaceId,
    workspaceName: companyName,
    customerMessage: messageText,
    conversationHistory,
    retrievedContext,
    fullBusinessBrainContext,
    businessBrainMeta,
    conversationMemory,
    leadQualification,
    intent: classification.intent,
    hasPriorBusinessReplies,
    isNewConversation,
    conversationStateContext: conversationStatePromptContext,
    responsePlan,
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

  const promptObservability = llmResult.promptMetadata
    ? {
        baseBrainVersion: llmResult.promptMetadata.baseBrainVersion,
        promptCompilerVersion: llmResult.promptMetadata.promptCompilerVersion,
        publishedVersionId: llmResult.promptMetadata.publishedVersionId,
        publishedVersionNumber: llmResult.promptMetadata.publishedVersionNumber,
        businessBrainSource: llmResult.promptMetadata.businessBrainSource,
        includeDraft: llmResult.promptMetadata.includeDraft,
        tenantRuleIds: llmResult.promptMetadata.tenantRuleIds,
        businessBrainCompleteness: llmResult.promptMetadata.businessBrainCompleteness,
        fallbackStrategy: llmResult.promptMetadata.fallbackStrategy,
        conversationHistoryCount: llmResult.promptMetadata.conversationHistoryCount,
        systemPromptLength: llmResult.promptMetadata.systemPromptLength,
        userPromptLength: llmResult.promptMetadata.userPromptLength,
      }
    : {
        promptCompilerV2: llmResult.promptCompilerV2,
        businessBrainCompleteness,
      };

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

  if (llmResult.handoffRequired || (isAnswerFirstV1Enabled() && responsePlan?.handoffRequired)) {
    let handoffReplyText = sanitizeAiReplyBranding(
      isAnswerFirstV1Enabled() && responsePlan?.directAnswerTemplate
        ? responsePlan.directAnswerTemplate
        : llmResult.reply.trim() || aiReplyService.getHandoffReply(),
      messageText,
      companyName,
    );

    if (isAnswerFirstV1Enabled() && responsePlan) {
      const validatedHandoff = applyValidatedReply({
        rawReply: handoffReplyText,
        plan: responsePlan,
        answerFirstEnabled: true,
      });
      handoffReplyText = validatedHandoff.finalReply;
      if (validatedHandoff.finalValidation) {
        planObservability = {
          ...planObservability,
          ...buildPlanObservabilityMetadata(responsePlan, {
            answerFirstPassed: validatedHandoff.finalValidation.answerFirstPassed,
            unsupportedClaimDetected: validatedHandoff.finalValidation.unsupportedClaimDetected,
            unsupportedClaimType: validatedHandoff.finalValidation.unsupportedClaimType,
            deterministicFallbackUsed: validatedHandoff.finalValidation.usedDeterministicFallback,
          }),
          handoffPath: "plan_validated",
        };
      }
    }

    if (isConversationStateV1Enabled() && conversationAiState) {
      conversationAiState = await conversationStateService.updateAfterHandoff(supabase, {
        state: conversationAiState,
        handoffReason: llmResult.handoffReason ?? "LLM handoff",
        succeeded: false,
      });
    }

    await triggerLlmHandoff(supabase, {
      workspaceId,
      conversation,
      incomingMessageId,
      intent: classification.intent,
      confidence: classification.confidence,
      reason:
        responsePlan?.handoffReason ??
        llmResult.handoffReason ??
        "LLM menandai percakapan perlu bantuan tim",
      messageText,
      companyName,
      handoffText: handoffReplyText,
      batchMessageIds,
      transparency: {
        usedSources: llmResult.sourceLabels,
        confidence: normalizeAiConfidenceScore(llmResult.confidence),
        handoffRequired: true,
      },
      observability: {
        ...promptObservability,
        ...greetingObservability,
        handoffReason: llmResult.handoffReason,
        llmIntent: llmResult.llmIntent,
        missingInformation: llmResult.missingInformation,
        suggestedNextStep: llmResult.suggestedNextStep,
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
        ...promptObservability,
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

  let finalReplyText = qualityResult.reply;
  let planValidation: PlanValidationResult | null = null;
  let rawPlanValidation: PlanValidationResult | null = null;

  if (isAnswerFirstV1Enabled() && responsePlan) {
    const validated = applyValidatedReply({
      rawReply: finalReplyText,
      plan: responsePlan,
      answerFirstEnabled: true,
      products: (llmResult.businessBrainContext ?? EMPTY_BUSINESS_BRAIN_CONTEXT).products,
    });
    rawPlanValidation = validated.rawValidation;
    planValidation = validated.finalValidation;
    finalReplyText = validated.finalReply;
    if (validated.finalValidation) {
      planObservability = {
        ...planObservability,
        ...buildPlanObservabilityMetadata(responsePlan, {
          answerFirstPassed: validated.finalValidation.answerFirstPassed,
          unsupportedClaimDetected:
            validated.rawValidation?.unsupportedClaimDetected ??
            validated.finalValidation.unsupportedClaimDetected,
          unsupportedClaimType:
            validated.rawValidation?.unsupportedClaimType ??
            validated.finalValidation.unsupportedClaimType,
          deterministicFallbackUsed: validated.finalValidation.usedDeterministicFallback,
        }),
        rawModelValidationFailed: Boolean(rawPlanValidation && !rawPlanValidation.passed),
        finalValidationPassed: planValidation?.passed ?? false,
      };
    }
  }

  let greetingGuardObservability: Record<string, unknown> = {};

  if (isConversationStateV1Enabled() && conversationStatePromptContext) {
    const greetingGuardResult = applyGreetingGuard({
      reply: finalReplyText,
      greetingAllowed: conversationStatePromptContext.greetingAllowed,
      fallbackReply: sanitizeAiReplyBranding(
        WHATSAPP_AI_LLM_FALLBACK_REPLY,
        messageText,
        companyName,
      ),
    });

    finalReplyText = greetingGuardResult.reply;
    greetingGuardObservability = {
      greetingDetectedInGeneratedReply: greetingGuardResult.greetingDetected,
      greetingRemoved: greetingGuardResult.greetingRemoved,
      greetingGuardUsedFallback: greetingGuardResult.usedFallback,
      greetingGuardChanges: greetingGuardResult.changes,
    };

    if (greetingGuardResult.greetingRemoved) {
      await insertAiEvent(supabase, {
        workspaceId,
        conversationId,
        messageId: incomingMessageId,
        eventType: "AI_RESPONSE_SANITIZED",
        intent: classification.intent,
        confidence: classification.confidence,
        metadata: {
          batchMessageIds,
          sanitizedReason: "greeting_guard",
          greetingAllowed: conversationStatePromptContext.greetingAllowed,
          greetingReason: conversationStatePromptContext.greetingReason,
          ...greetingGuardObservability,
        },
      });
    }
  }

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
      llmIntent: llmResult.llmIntent,
      missingInformation: llmResult.missingInformation,
      suggestedNextStep: llmResult.suggestedNextStep,
      ...promptObservability,
      ...planObservability,
      ...greetingGuardObservability,
    },
  });

  logPipeline("AI_LLM_REPLY_SENT", {
    conversationId,
    intent: classification.intent,
    messageId: sentMessage.id,
    batchSize: incomingMessages.length,
    generationTimeMs: llmResult.generationTimeMs,
  });

  let planDocumentDelivered = false;
  if (
    isAnswerFirstV1Enabled() &&
    responsePlan?.attachmentAction &&
    responsePlan.responseAction === "SEND_DOCUMENT_THEN_ASK"
  ) {
    const docResult = await executePlanDocumentDelivery({
      supabase,
      workspaceId,
      conversation,
      attachmentAction: responsePlan.attachmentAction,
      incomingMessageId,
      productId: responsePlan.selectedEntity?.entityId ?? null,
    });

    planDocumentDelivered = docResult.success;
    planObservability = {
      ...planObservability,
      planDocumentDelivered,
      documentDeliveryError: docResult.errorCategory,
    };

    if (!docResult.success) {
      const failureText = sanitizeAiReplyBranding(
        DOCUMENT_DELIVERY_FAILURE_REPLY_ID,
        messageText,
        companyName,
      );

      await sendAiWhatsappMessage(supabase, {
        workspaceId,
        conversation,
        text: failureText,
        incomingMessageId,
        rawPayload: {
          source: "ai_auto_reply",
          aiAction: "document_delivery_failed",
          documentId: responsePlan.attachmentAction.documentId,
        },
      });

      if (isConversationStateV1Enabled() && conversationAiState) {
        conversationAiState = await conversationStateService.updateAfterHandoff(supabase, {
          state: conversationAiState,
          handoffReason: "Document delivery failed",
          succeeded: false,
        });
      }

      await triggerLlmHandoff(supabase, {
        workspaceId,
        conversation,
        incomingMessageId,
        intent: classification.intent,
        confidence: classification.confidence,
        reason: "Document delivery failed",
        messageText,
        companyName,
        handoffText: failureText,
        batchMessageIds,
        observability: {
          ...planObservability,
          documentDeliveryFailed: true,
        },
      });
      return;
    }
  }

  let stateUpdateObservability: Record<string, unknown> = {};
  if (isConversationStateV1Enabled() && conversationAiState && conversationStatePromptContext) {
    const stateUpdate = await conversationStateService.updateAfterSuccessfulReply(supabase, {
      state: conversationAiState,
      intent: classification.intent,
      replyText: finalReplyText,
      greetingAllowed: conversationStatePromptContext.greetingAllowed,
      greetingWasSent: conversationStatePromptContext.greetingAllowed,
      collectedInformation: conversationAiState.collectedInformation,
      selectedEntity: responsePlan?.selectedEntity ?? conversationAiState.selectedEntity,
      responsePlan,
      usePlanQuestionKeys: isAnswerFirstV1Enabled(),
      messageId: sentMessage.id,
    });

    conversationAiState = stateUpdate.state;
    stateUpdateObservability = conversationStateService.buildObservabilityMetadata({
      state: stateUpdate.state,
      promptContext: conversationStatePromptContext,
      greetingDetectedInGeneratedReply:
        typeof greetingGuardObservability.greetingDetectedInGeneratedReply === "boolean"
          ? greetingGuardObservability.greetingDetectedInGeneratedReply
          : false,
      greetingRemoved:
        typeof greetingGuardObservability.greetingRemoved === "boolean"
          ? greetingGuardObservability.greetingRemoved
          : false,
      transitionFrom: stateUpdate.transitionFrom,
      transitionTo: stateUpdate.transitionTo,
    });
  }

  if (Object.keys(stateUpdateObservability).length > 0) {
    logPipeline("AI_STATE_UPDATED", {
      conversationId,
      incomingMessageId,
      ...stateUpdateObservability,
    });
  }

  const filteredActions = planDocumentDelivered && responsePlan?.attachmentAction
    ? llmResult.actions.filter(
        (action) =>
          !(
            action.type === "SEND_DOCUMENT" &&
            action.payload.documentId === responsePlan.attachmentAction?.documentId
          ),
      )
    : llmResult.actions;

  const filteredDocumentActions = planDocumentDelivered && responsePlan?.attachmentAction
    ? llmResult.documentActions.filter(
        (item) => item.documentId !== responsePlan.attachmentAction?.documentId,
      )
    : llmResult.documentActions;

  // Text reply is already sent. Action Engine validates and executes side effects.
  await actionEngine.processActions(
    actionEngine.recommendActionsFromLlm({
      actions: filteredActions,
      documentActions: filteredDocumentActions,
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
