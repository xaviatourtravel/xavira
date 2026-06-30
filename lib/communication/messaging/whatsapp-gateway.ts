import {
  mapProviderDeliveryStatus,
  MESSAGE_STATUS,
} from "@/lib/communication/messaging/delivery";
import type { MessageDeliveryStatus } from "@/lib/communication/messaging/delivery";
import type {
  ConversationGateway,
  GatewayConversation,
  SupabaseServerClient,
} from "@/lib/communication/messaging/conversation-gateway";
import {
  MessagingError,
  type EngineMessage,
} from "@/lib/communication/messaging/types";
import { canReplyToOmnichannelConversation } from "@/lib/omnichannel-inbox/permissions";
import {
  findWhatsappConversationById,
  insertWhatsappMessage,
  updateWhatsappConversationById,
} from "@/lib/whatsapp-inbox/repository";
import type { Profile } from "@/types/app-types";
import type { WhatsappMessageRow } from "@/types/whatsapp-inbox";

const MESSAGE_SELECT =
  "id, conversation_id, direction, message_type, text, media_url, status, timestamp, raw_payload, external_message_id, created_at";

function mapMessage(row: WhatsappMessageRow): EngineMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    channel: "whatsapp",
    direction: row.direction,
    text: row.text,
    status: mapProviderDeliveryStatus(row.status) ?? "pending",
    externalMessageId: row.external_message_id ?? null,
    timestamp: row.timestamp,
    createdAt: row.created_at,
  };
}

export const whatsAppConversationGateway: ConversationGateway = {
  channel: "whatsapp",

  async loadConversation(
    supabase: SupabaseServerClient,
    organizationId: string,
    conversationId: string,
  ): Promise<GatewayConversation | null> {
    const conversation = await findWhatsappConversationById(
      supabase,
      organizationId,
      conversationId,
    );

    if (!conversation) {
      return null;
    }

    return {
      id: conversation.id,
      channel: "whatsapp",
      recipient: conversation.phone_number,
      instance: conversation.instance_name ?? null,
      assignedUserId: conversation.assigned_user_id ?? null,
    };
  },

  canReply(profile: Profile, conversation: GatewayConversation): boolean {
    return canReplyToOmnichannelConversation(profile, {
      assigned_user_id: conversation.assignedUserId,
    });
  },

  async insertPendingMessage(
    supabase: SupabaseServerClient,
    conversation: GatewayConversation,
    text: string,
  ): Promise<EngineMessage> {
    const row = await insertWhatsappMessage(supabase, {
      conversation_id: conversation.id,
      direction: "outgoing",
      message_type: "text",
      text,
      status: MESSAGE_STATUS.sending,
      timestamp: new Date().toISOString(),
      raw_payload: {},
    });

    return mapMessage(row as WhatsappMessageRow);
  },

  async loadMessage(
    supabase: SupabaseServerClient,
    messageId: string,
  ): Promise<EngineMessage | null> {
    const { data, error } = await supabase
      .from("whatsapp_messages")
      .select(MESSAGE_SELECT)
      .eq("id", messageId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapMessage(data as WhatsappMessageRow);
  },

  async updateMessageStatus(
    supabase: SupabaseServerClient,
    messageId: string,
    status: MessageDeliveryStatus,
    providerMessageId?: string | null,
  ): Promise<EngineMessage> {
    // UI status "pending" disimpan sebagai "sending" di basis data.
    const storedStatus = status === "pending" ? MESSAGE_STATUS.sending : status;
    const patch: Record<string, unknown> = { status: storedStatus };

    if (status === "sent") {
      patch.timestamp = new Date().toISOString();
      if (providerMessageId !== undefined) {
        patch.external_message_id = providerMessageId;
      }
    }

    const { data, error } = await supabase
      .from("whatsapp_messages")
      .update(patch)
      .eq("id", messageId)
      .select(MESSAGE_SELECT)
      .single();

    if (error || !data) {
      throw new MessagingError(
        "send_failed",
        error?.message ?? "Gagal memperbarui status pesan.",
      );
    }

    return mapMessage(data as WhatsappMessageRow);
  },

  async updateConversationSummary(
    supabase: SupabaseServerClient,
    organizationId: string,
    conversationId: string,
    text: string,
    at: string,
  ): Promise<void> {
    await updateWhatsappConversationById(
      supabase,
      organizationId,
      conversationId,
      {
        last_message: text,
        last_message_at: at,
      },
    );
  },
};
