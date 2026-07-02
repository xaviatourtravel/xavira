import { sendWhatsAppTextMessage } from "@/lib/integrations/whatsapp/evolution-client";
import { aiReplyService } from "@/lib/whatsapp-inbox/ai/reply-service";
import { insertAiEvent } from "@/lib/whatsapp-inbox/ai/event-log";
import { aiOwnershipService } from "@/lib/whatsapp-inbox/ai/ownership-service";
import { sendAiWhatsappMessage } from "@/lib/whatsapp-inbox/ai/message-sender";
import type { AiHandoffInput } from "@/lib/whatsapp-inbox/ai/types";
import type { WhatsappSupabaseClient } from "@/lib/whatsapp-inbox/repository";

const WA_AI_LOG = "[WA_AI]";

function logHandoff(message: string, data?: Record<string, unknown>) {
  if (data) {
    console.log(`${WA_AI_LOG} ${message}`, data);
  } else {
    console.log(`${WA_AI_LOG} ${message}`);
  }
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
};

export { aiReplyService, WHATSAPP_AI_HANDOFF_REPLY } from "@/lib/whatsapp-inbox/ai/reply-service";
export { sendWhatsAppTextMessage };
