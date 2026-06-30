import { mapProviderDeliveryStatus } from "@/lib/communication/messaging/delivery";
import {
  getMessagingErrorMessage,
  MessagingError,
  retryMessage,
  sendMessage,
  type EngineMessage,
} from "@/lib/communication/messaging";
import type { Profile } from "@/types/app-types";
import type { WhatsappMessageRow } from "@/types/whatsapp-inbox";
import type { createClient } from "@/utils/supabase/server";

// Backwards-compatible WhatsApp facade over the channel-agnostic Messaging
// Engine. Existing inbox actions/queries keep importing from here while the
// real work happens in lib/communication/*.

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export { MessagingError as WhatsappSendReplyError };

export const getWhatsappSendReplyErrorMessage = getMessagingErrorMessage;

export function getWhatsappMessageDeliveryStatus(message: WhatsappMessageRow) {
  return mapProviderDeliveryStatus(message.status);
}

export async function sendWhatsappConversationReply(
  supabase: SupabaseClient,
  organizationId: string,
  profile: Profile,
  conversationId: string,
  messageText: string,
): Promise<EngineMessage> {
  return sendMessage({
    supabase,
    organizationId,
    profile,
    channel: "whatsapp",
    conversationId,
    text: messageText,
  });
}

export async function retryWhatsappConversationReply(
  supabase: SupabaseClient,
  organizationId: string,
  profile: Profile,
  messageId: string,
): Promise<EngineMessage> {
  return retryMessage({
    supabase,
    organizationId,
    profile,
    channel: "whatsapp",
    messageId,
  });
}
