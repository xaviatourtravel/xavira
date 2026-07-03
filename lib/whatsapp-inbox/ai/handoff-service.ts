import {
  getQualificationCollectedFields,
  QUALIFICATION_HANDOFF_MESSAGE,
  QUALIFICATION_HANDOFF_REASON,
  type LeadQualificationSnapshot,
} from "@/modules/ai/types/lead-qualification";
import { sendWhatsAppTextMessage } from "@/lib/integrations/whatsapp/evolution-client";
import { resolveWhatsappAiState } from "@/lib/whatsapp-inbox/ai/constants";
import { aiReplyService } from "@/lib/whatsapp-inbox/ai/reply-service";
import { insertAiEvent } from "@/lib/whatsapp-inbox/ai/event-log";
import { aiOwnershipService } from "@/lib/whatsapp-inbox/ai/ownership-service";
import { sendAiWhatsappMessage } from "@/lib/whatsapp-inbox/ai/message-sender";
import type { AiHandoffInput } from "@/lib/whatsapp-inbox/ai/types";
import type { WhatsappConversationRow } from "@/types/whatsapp-inbox";
import type { WhatsappSupabaseClient } from "@/lib/whatsapp-inbox/repository";

const WA_AI_LOG = "[WA_AI]";

function logHandoff(message: string, data?: Record<string, unknown>) {
  if (data) {
    console.log(`${WA_AI_LOG} ${message}`, data);
  } else {
    console.log(`${WA_AI_LOG} ${message}`);
  }
}

async function hasQualificationHandoffBeenTriggered(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
  conversationId: string,
) {
  const { data, error } = await supabase
    .from("ai_events")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("conversation_id", conversationId)
    .eq("event_type", "AI_HANDOFF_TRIGGERED")
    .eq("reason", QUALIFICATION_HANDOFF_REASON)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[WA_AI] failed to check qualification handoff events", {
      conversationId,
      error: error.message,
    });
    return false;
  }

  return Boolean(data);
}

export const aiHandoffService = {
  requiresHandoff(classification: {
    requiresHuman: boolean;
    intent: string;
    reason?: string;
  }) {
    return classification.requiresHuman;
  },

  async triggerHandoff(
    supabase: WhatsappSupabaseClient,
    input: AiHandoffInput,
  ) {
    await aiOwnershipService.updateConversationAIState(
      supabase,
      input.workspaceId,
      input.conversation.id,
      "READY_FOR_HUMAN",
      {
        handoffReason: input.reason,
        changedBy: "system",
        source: "handoff",
      },
    );

    const sentMessage = await sendAiWhatsappMessage(supabase, {
      workspaceId: input.workspaceId,
      conversation: input.conversation,
      text: input.handoffText ?? aiReplyService.getHandoffReply(),
      incomingMessageId: input.incomingMessageId,
      rawPayload: {
        source: "ai_auto_reply",
        aiAction: "handoff",
        intent: input.intent,
        handoffReason: input.reason,
      },
    });

    await aiOwnershipService.markAIAction(
      supabase,
      input.workspaceId,
      input.conversation.id,
    );

    await insertAiEvent(supabase, {
      workspaceId: input.workspaceId,
      conversationId: input.conversation.id,
      messageId: input.incomingMessageId,
      eventType: "AI_HANDOFF_TRIGGERED",
      intent: input.intent,
      confidence: input.confidence,
      previousState: input.conversation.ai_state,
      nextState: "READY_FOR_HUMAN",
      reason: input.reason,
      metadata: {
        notifySales: true,
        assignedUserId: input.conversation.assigned_user_id,
        phoneNumber: input.conversation.phone_number,
        outgoingMessageId: sentMessage.id,
      },
    });

    logHandoff("handoff sent", {
      conversationId: input.conversation.id,
      reason: input.reason,
      messageId: sentMessage.id,
    });

    return sentMessage;
  },

  async triggerQualificationHandoff(
    supabase: WhatsappSupabaseClient,
    input: {
      workspaceId: string;
      conversation: WhatsappConversationRow;
      incomingMessageId: string;
      leadQualification: LeadQualificationSnapshot;
    },
  ) {
    const state = resolveWhatsappAiState(input.conversation.ai_state);

    if (state !== "AI_ACTIVE") {
      logHandoff("qualification handoff skipped — ai state not active", {
        conversationId: input.conversation.id,
        aiState: state,
      });
      return null;
    }

    if (input.leadQualification.qualificationStatus !== "HANDOVER_READY") {
      return null;
    }

    if (
      await hasQualificationHandoffBeenTriggered(
        supabase,
        input.workspaceId,
        input.conversation.id,
      )
    ) {
      logHandoff("qualification handoff skipped — already triggered", {
        conversationId: input.conversation.id,
      });
      return null;
    }

    const collectedFields = getQualificationCollectedFields(input.leadQualification);

    await aiOwnershipService.updateConversationAIState(
      supabase,
      input.workspaceId,
      input.conversation.id,
      "READY_FOR_HUMAN",
      {
        handoffReason: QUALIFICATION_HANDOFF_REASON,
        changedBy: "system",
        source: "qualification_handoff",
      },
    );

    const sentMessage = await sendAiWhatsappMessage(supabase, {
      workspaceId: input.workspaceId,
      conversation: input.conversation,
      text: QUALIFICATION_HANDOFF_MESSAGE,
      incomingMessageId: input.incomingMessageId,
      rawPayload: {
        source: "ai_auto_reply",
        aiAction: "handoff",
        intent: "lead_qualification_complete",
        handoffReason: QUALIFICATION_HANDOFF_REASON,
      },
    });

    await aiOwnershipService.markAIAction(
      supabase,
      input.workspaceId,
      input.conversation.id,
    );

    await insertAiEvent(supabase, {
      workspaceId: input.workspaceId,
      conversationId: input.conversation.id,
      messageId: input.incomingMessageId,
      eventType: "AI_HANDOFF_TRIGGERED",
      intent: "lead_qualification_complete",
      previousState: input.conversation.ai_state,
      nextState: "READY_FOR_HUMAN",
      reason: QUALIFICATION_HANDOFF_REASON,
      metadata: {
        reason: QUALIFICATION_HANDOFF_REASON,
        completionScore: input.leadQualification.completionScore,
        qualificationStatus: input.leadQualification.qualificationStatus,
        collectedFields,
        notifySales: true,
        assignedUserId: input.conversation.assigned_user_id,
        phoneNumber: input.conversation.phone_number,
        outgoingMessageId: sentMessage.id,
        handoffType: "qualification",
      },
    });

    logHandoff("qualification handoff sent", {
      conversationId: input.conversation.id,
      completionScore: input.leadQualification.completionScore,
      messageId: sentMessage.id,
    });

    return sentMessage;
  },
};

export { aiReplyService, WHATSAPP_AI_HANDOFF_REPLY } from "@/lib/whatsapp-inbox/ai/reply-service";
export { sendWhatsAppTextMessage };
