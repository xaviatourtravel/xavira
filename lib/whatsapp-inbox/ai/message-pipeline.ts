import { WHATSAPP_AI_DEBOUNCE_MS } from "@/lib/whatsapp-inbox/ai/constants";
import { insertAiEvent } from "@/lib/whatsapp-inbox/ai/event-log";
import { aiHandoffService } from "@/lib/whatsapp-inbox/ai/handoff-service";
import { intentClassifierService } from "@/lib/whatsapp-inbox/ai/intent-classifier-service";
import {
  formatWhatsappConversationHistoryForAi,
  loadWhatsappConversationHistoryForAi,
  loadWhatsappConversationMessagesForGreeting,
  shouldUseGreeting,
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
    eventType: "AI_SKIPPED",
    reason,
    metadata: { code, ...metadata },
  });

  logPipeline("skipped", { conversationId, code, reason });
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
  },
) {
  const handoffText = sanitizeAiReplyBranding(
    aiReplyService.getHandoffReply(),
    args.messageText,
    args.companyName,
  );

  await aiHandoffService.triggerHandoff(supabase, {
    workspaceId: args.workspaceId,
    conversation: args.conversation,
    incomingMessageId: args.incomingMessageId,
    intent: args.intent,
    confidence: args.confidence,
    reason: args.reason,
    handoffText,
  });
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

function classifyBatchIntent(messages: WhatsappMessageRow[]) {
  for (const message of messages) {
    const classification = intentClassifierService.classifyIntent(
      message.text?.trim() ?? "",
    );

    if (classification.requiresHuman) {
      return classification;
    }
  }

  return intentClassifierService.classifyIntent(
    mergeIncomingMessageText(messages),
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
  const classification = classifyBatchIntent(incomingMessages);

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
      requiresHuman: classification.requiresHuman,
      batchMessageIds: incomingMessages.map((message) => message.id),
      debounced: incomingMessages.length > 1,
    },
  });

  logPipeline("intent classified", {
    conversationId,
    incomingMessageId,
    batchSize: incomingMessages.length,
    intent: classification.intent,
    requiresHuman: classification.requiresHuman,
    confidence: classification.confidence,
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

  const customer = resolveWhatsappContactDisplay(conversation);
  const historyMessages = await loadWhatsappConversationHistoryForAi(
    supabase,
    conversationId,
  );
  const greetingMessages = await loadWhatsappConversationMessagesForGreeting(
    supabase,
    conversationId,
  );
  const useGreeting = shouldUseGreeting(greetingMessages, messageText);
  const conversationHistory =
    formatWhatsappConversationHistoryForAi(historyMessages);

  const llmResult = await aiLLMReplyService.generateWhatsAppReply({
    workspaceName: companyName,
    customerName: customer.primaryName,
    messageText,
    conversationHistory,
    intent: classification.intent,
    shouldUseGreeting: useGreeting,
  });

  logPipeline("llm reply generated", {
    conversationId,
    incomingMessageId,
    batchSize: incomingMessages.length,
    shouldUseGreeting: useGreeting,
    generationTimeMs: llmResult.generationTimeMs,
    handoffRequired: llmResult.handoffRequired,
    usedFallback: llmResult.usedFallback,
    inputTokens: llmResult.inputTokens,
    outputTokens: llmResult.outputTokens,
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
      batchMessageIds: incomingMessages.map((message) => message.id),
    });
    return;
  }

  const replyText = sanitizeAiReplyBranding(
    llmResult.reply || WHATSAPP_AI_LLM_FALLBACK_REPLY,
    messageText,
    companyName,
  );

  const sentMessage = await sendAiWhatsappMessage(supabase, {
    workspaceId,
    conversation,
    text: replyText,
    incomingMessageId,
    rawPayload: {
      source: "ai_auto_reply",
      aiAction: "auto_reply",
      intent: classification.intent,
      confidence: classification.confidence,
      llm: true,
      usedFallback: llmResult.usedFallback,
      shouldUseGreeting: useGreeting,
      generationTimeMs: llmResult.generationTimeMs,
      batchMessageIds: incomingMessages.map((message) => message.id),
      debounced: incomingMessages.length > 1,
    },
  });

  await aiOwnershipService.markAIAction(
    supabase,
    workspaceId,
    conversationId,
  );

  await insertAiEvent(supabase, {
    workspaceId,
    conversationId,
    messageId: sentMessage.id,
    eventType: "AI_REPLY_SENT",
    intent: classification.intent,
    confidence: classification.confidence,
    metadata: {
      incomingMessageId,
      batchMessageIds: incomingMessages.map((message) => message.id),
      debounced: incomingMessages.length > 1,
      replyPreview: replyText.slice(0, 120),
      llm: true,
      usedFallback: llmResult.usedFallback,
      shouldUseGreeting: useGreeting,
      generationTimeMs: llmResult.generationTimeMs,
      inputTokens: llmResult.inputTokens,
      outputTokens: llmResult.outputTokens,
      llmError: llmResult.error ?? null,
    },
  });

  logPipeline("auto-reply sent", {
    conversationId,
    intent: classification.intent,
    messageId: sentMessage.id,
    batchSize: incomingMessages.length,
    generationTimeMs: llmResult.generationTimeMs,
    usedFallback: llmResult.usedFallback,
  });
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
