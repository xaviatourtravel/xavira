import { sendWhatsAppTextMessage } from "@/lib/integrations/whatsapp/evolution-client";
import {
  insertWhatsappMessage,
  updateWhatsappMessageById,
  type WhatsappSupabaseClient,
} from "@/lib/whatsapp-inbox/repository";
import type { WhatsappConversationRow } from "@/types/whatsapp-inbox";
import type { Json } from "@/types/database";

export type SendAiWhatsappMessageInput = {
  workspaceId: string;
  conversation: WhatsappConversationRow;
  text: string;
  incomingMessageId?: string;
  rawPayload?: Record<string, unknown>;
};

/**
 * Persists and sends an AI-authored WhatsApp message via Evolution API.
 */
export async function sendAiWhatsappMessage(
  supabase: WhatsappSupabaseClient,
  input: SendAiWhatsappMessageInput,
) {
  const pending = await insertWhatsappMessage(supabase, {
    conversation_id: input.conversation.id,
    direction: "outgoing",
    message_type: "text",
    text: input.text,
    status: "sending",
    sender_type: "ai",
    timestamp: new Date().toISOString(),
    raw_payload: (input.rawPayload ?? {}) as Json,
  });

  try {
    const result = await sendWhatsAppTextMessage(
      input.conversation.phone_number,
      input.text,
      input.conversation.instance_name,
    );

    const updated = await updateWhatsappMessageById(supabase, pending.id, {
      status: "sent",
      external_message_id: result.messageId,
      timestamp: new Date().toISOString(),
    });

    return updated;
  } catch (error) {
    await updateWhatsappMessageById(supabase, pending.id, {
      status: "failed",
    }).catch(() => undefined);

    throw error;
  }
}
