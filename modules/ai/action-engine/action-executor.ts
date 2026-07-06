import type {
  ActionEngineContext,
  ActionExecutionResult,
  AIAction,
} from "@/modules/ai/action-engine/types";
import { normalizeActionConfidence } from "@/modules/ai/action-engine/types";
import { isConversationMemoryKey } from "@/modules/ai/types/memory";
import {
  QUALIFICATION_HANDOFF_MESSAGE,
  QUALIFICATION_HANDOFF_REASON,
} from "@/modules/ai/types/lead-qualification";
import { memoryService } from "@/modules/ai/services/memory-service";
import { leadQualificationService } from "@/modules/ai/services/lead-qualification-service";
import { sendAiWhatsappMessage } from "@/lib/whatsapp-inbox/ai/message-sender";
import { sendManualWhatsappDocument } from "@/lib/whatsapp-inbox/ai/document-send-service";
import { aiHandoffService } from "@/lib/whatsapp-inbox/ai/handoff-service";
import { insertWhatsappConversationNote } from "@/lib/whatsapp-inbox/repository";

async function executeSendDocument(
  action: AIAction,
  context: ActionEngineContext,
): Promise<ActionExecutionResult> {
  const documentId =
    typeof action.payload.documentId === "string"
      ? action.payload.documentId.trim()
      : "";

  try {
    const sent = await sendManualWhatsappDocument(context.supabase, {
      workspaceId: context.workspaceId,
      conversation: context.conversation,
      documentId,
      sentByUserId: "action_engine",
      senderType: "ai",
      source: "action_engine",
    });

    return {
      success: true,
      metadata: {
        documentId,
        outgoingMessageId: sent.id,
      },
    };
  } catch (error) {
    return {
      success: false,
      reason: error instanceof Error ? error.message : String(error),
      code: "document_send_failed",
    };
  }
}

async function executeHandover(
  action: AIAction,
  context: ActionEngineContext,
): Promise<ActionExecutionResult> {
  const reason =
    (typeof action.payload.handoffReason === "string" &&
      action.payload.handoffReason.trim()) ||
    action.reason ||
    "Handed over to human";

  const isQualification =
    reason === QUALIFICATION_HANDOFF_REASON ||
    action.payload.handoffType === "qualification";

  try {
    if (isQualification && context.leadQualification) {
      const sent = await aiHandoffService.triggerQualificationHandoff(
        context.supabase,
        {
          workspaceId: context.workspaceId,
          conversation: context.conversation,
          incomingMessageId: context.incomingMessageId ?? "",
          leadQualification: context.leadQualification,
        },
      );

      return {
        success: true,
        metadata: {
          handoffType: "qualification",
          outgoingMessageId: sent?.id ?? null,
        },
      };
    }

    const handoffText =
      context.handoffText ??
      (isQualification ? QUALIFICATION_HANDOFF_MESSAGE : undefined);

    const sent = await aiHandoffService.triggerHandoff(context.supabase, {
      workspaceId: context.workspaceId,
      conversation: context.conversation,
      incomingMessageId: context.incomingMessageId ?? "",
      intent: "action_engine_handover",
      confidence: normalizeActionConfidence(action.confidence),
      reason,
      handoffText,
    });

    return {
      success: true,
      metadata: {
        handoffType: "standard",
        outgoingMessageId: sent.id,
      },
    };
  } catch (error) {
    return {
      success: false,
      reason: error instanceof Error ? error.message : String(error),
      code: "handover_failed",
    };
  }
}

async function executeCreateLeadNote(
  action: AIAction,
  context: ActionEngineContext,
): Promise<ActionExecutionResult> {
  const note =
    typeof action.payload.note === "string" ? action.payload.note.trim() : "";
  const createdBy =
    typeof action.payload.createdBy === "string"
      ? action.payload.createdBy
      : context.conversation.assigned_user_id;

  // Notes system exists (whatsapp_conversation_notes). Without an author we
  // approve but skip — never claim a note was created.
  if (!createdBy) {
    return {
      success: true,
      metadata: {
        skipped: true,
        skipReason: "notes_not_available",
      },
    };
  }

  try {
    const created = await insertWhatsappConversationNote(context.supabase, {
      conversation_id: context.conversation.id,
      note,
      created_by: createdBy,
    });

    return {
      success: true,
      metadata: { noteId: created.id },
    };
  } catch (error) {
    return {
      success: false,
      reason: error instanceof Error ? error.message : String(error),
      code: "note_create_failed",
    };
  }
}

async function executeUpdateMemory(
  action: AIAction,
  context: ActionEngineContext,
): Promise<ActionExecutionResult> {
  const memoryKey =
    typeof action.payload.memoryKey === "string"
      ? action.payload.memoryKey.trim()
      : "";
  const memoryValue =
    typeof action.payload.memoryValue === "string"
      ? action.payload.memoryValue.trim()
      : "";

  if (!isConversationMemoryKey(memoryKey)) {
    return {
      success: false,
      reason: "Invalid memory key",
      code: "invalid_memory_key",
    };
  }

  const saved = await memoryService.saveMemory(context.supabase, {
    workspaceId: context.workspaceId,
    conversationId: context.conversation.id,
    customerId: context.conversation.customer_id,
    memoryKey,
    memoryValue,
    confidence: normalizeActionConfidence(action.confidence),
    source: "ai_reply",
    messageId: context.incomingMessageId,
  });

  if (!saved) {
    return {
      success: false,
      reason: "Failed to save memory",
      code: "memory_save_failed",
    };
  }

  return {
    success: true,
    metadata: {
      memoryKey,
      memoryValue,
    },
  };
}

async function executeUpdateLeadProgress(
  action: AIAction,
  context: ActionEngineContext,
): Promise<ActionExecutionResult> {
  const fields = action.payload.fields;
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) {
    return {
      success: false,
      reason: "Invalid fields payload",
      code: "invalid_fields",
    };
  }

  const record = fields as Record<string, unknown>;
  const memoryItems = Object.entries(record)
    .filter(([, value]) => typeof value === "string" && value.trim())
    .map(([key, value]) => ({
      memory_key: key,
      memory_value: String(value).trim(),
      confidence: normalizeActionConfidence(action.confidence),
    }));

  const snapshot = await leadQualificationService.updateQualification(
    context.supabase,
    {
      workspaceId: context.workspaceId,
      conversationId: context.conversation.id,
      customerId: context.conversation.customer_id,
      messageId: context.incomingMessageId,
      memory:
        memoryItems.length === 0
          ? (context.conversationMemory ?? undefined)
          : undefined,
      memoryItems: memoryItems.length > 0 ? memoryItems : undefined,
      lastAiQuestion:
        typeof action.payload.lastAiQuestion === "string"
          ? action.payload.lastAiQuestion
          : undefined,
    },
  );

  return {
    success: true,
    metadata: {
      completionScore: snapshot.completionScore,
      qualificationStatus: snapshot.qualificationStatus,
    },
  };
}

async function executeSuggestPackage(
  action: AIAction,
  _context: ActionEngineContext,
): Promise<ActionExecutionResult> {
  const packageName =
    typeof action.payload.packageName === "string"
      ? action.payload.packageName.trim()
      : "";

  // Soft action: recommendation is recorded on ai_actions; no external side effects.
  return {
    success: true,
    metadata: {
      recorded: true,
      packageName: packageName || null,
      reason: action.reason,
    },
  };
}

async function executeAskQualification(
  action: AIAction,
  context: ActionEngineContext,
): Promise<ActionExecutionResult> {
  const fieldKey =
    typeof action.payload.fieldKey === "string"
      ? action.payload.fieldKey.trim()
      : null;
  const question =
    typeof action.payload.question === "string"
      ? action.payload.question.trim()
      : action.reason;

  if (context.conversationMemory || context.leadQualification) {
    await leadQualificationService.updateQualification(context.supabase, {
      workspaceId: context.workspaceId,
      conversationId: context.conversation.id,
      customerId: context.conversation.customer_id,
      messageId: context.incomingMessageId,
      memory: context.conversationMemory ?? undefined,
      lastAiQuestion: question,
    });
  }

  return {
    success: true,
    metadata: {
      fieldKey,
      question,
    },
  };
}

async function executeFollowUpMessage(
  action: AIAction,
  context: ActionEngineContext,
): Promise<ActionExecutionResult> {
  const message =
    typeof action.payload.message === "string"
      ? action.payload.message.trim()
      : "";

  if (!message) {
    return {
      success: false,
      reason: "Follow-up message is required",
      code: "missing_message",
    };
  }

  try {
    const sent = await sendAiWhatsappMessage(context.supabase, {
      workspaceId: context.workspaceId,
      conversation: context.conversation,
      text: message,
      incomingMessageId: context.incomingMessageId ?? undefined,
      rawPayload: {
        source: "follow_up_action",
        actionType: action.type,
        reason: action.reason,
      },
    });

    return {
      success: true,
      metadata: {
        outgoingMessageId: sent.id,
        messageLength: message.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      reason: error instanceof Error ? error.message : String(error),
      code: "follow_up_send_failed",
    };
  }
}

export async function executeAction(
  action: AIAction,
  context: ActionEngineContext,
): Promise<ActionExecutionResult> {
  switch (action.type) {
    case "SEND_DOCUMENT":
      return executeSendDocument(action, context);
    case "HANDOVER":
      return executeHandover(action, context);
    case "CREATE_LEAD_NOTE":
      return executeCreateLeadNote(action, context);
    case "UPDATE_MEMORY":
      return executeUpdateMemory(action, context);
    case "UPDATE_LEAD_PROGRESS":
      return executeUpdateLeadProgress(action, context);
    case "SUGGEST_PACKAGE":
      return executeSuggestPackage(action, context);
    case "ASK_QUALIFICATION":
      return executeAskQualification(action, context);
    case "FOLLOW_UP_MESSAGE":
      return executeFollowUpMessage(action, context);
    case "NO_ACTION":
      return { success: true, metadata: { noop: true } };
    default:
      return {
        success: false,
        reason: `Unsupported action type: ${(action as AIAction).type}`,
        code: "unsupported_action",
      };
  }
}
