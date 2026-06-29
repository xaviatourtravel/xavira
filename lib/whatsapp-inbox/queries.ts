import {
  findWhatsappConversationById,
  findWhatsappConversations,
  findWhatsappMessagesByConversationId,
  type WhatsappSupabaseClient,
} from "@/lib/whatsapp-inbox/repository";
import type {
  OmnichannelConversationDetail,
  OmnichannelConversationListItem,
} from "@/lib/omnichannel-inbox/queries";
import type { MessageRow } from "@/types/omnichannel-inbox";
import type { WhatsappConversationRow, WhatsappMessageRow } from "@/types/whatsapp-inbox";

function formatPhoneDisplay(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, "");
  if (digits.startsWith("62") && digits.length >= 10) {
    return `+${digits}`;
  }

  return phoneNumber;
}

function mapWhatsappMessageToOmnichannelMessage(
  message: WhatsappMessageRow,
  conversationId: string,
): MessageRow {
  return {
    id: message.id,
    conversation_id: conversationId,
    direction: message.direction,
    external_message_id: message.external_message_id,
    message_text: message.text,
    attachments_json: message.media_url ? [{ url: message.media_url }] : [],
    sent_by_user_id: null,
    created_at: message.timestamp,
  };
}

function mapWhatsappConversationToListItem(
  conversation: WhatsappConversationRow,
  leadName?: string | null,
): OmnichannelConversationListItem {
  const phoneLabel = formatPhoneDisplay(conversation.phone_number);
  const displayName = leadName?.trim() || phoneLabel;

  return {
    id: conversation.id,
    channel: "whatsapp",
    channelLabel: "WhatsApp",
    customerName: displayName,
    customerUsername: leadName?.trim() ? phoneLabel : phoneLabel,
    customerAvatar: null,
    assignedUserId: null,
    assignedUserName: null,
    leadId: conversation.customer_id,
    status: "new",
    statusLabel: "Baru",
    unreadCount: conversation.unread_count,
    lastMessageAt: conversation.last_message_at,
    lastMessagePreview: conversation.last_message,
    createdAt: conversation.created_at,
    updatedAt: conversation.updated_at,
  };
}

export async function loadWhatsappConversationList(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
): Promise<OmnichannelConversationListItem[]> {
  const conversations = await findWhatsappConversations(supabase, workspaceId);
  const customerIds = conversations
    .map((conversation) => conversation.customer_id)
    .filter((value): value is string => Boolean(value));

  const leadNames = new Map<string, string>();

  if (customerIds.length > 0) {
    const { data: leads } = await supabase
      .from("leads")
      .select("id, full_name")
      .in("id", customerIds);

    for (const lead of leads ?? []) {
      if (lead.full_name?.trim()) {
        leadNames.set(lead.id, lead.full_name.trim());
      }
    }
  }

  return conversations.map((conversation) =>
    mapWhatsappConversationToListItem(
      conversation,
      conversation.customer_id
        ? leadNames.get(conversation.customer_id) ?? null
        : null,
    ),
  );
}

export async function loadWhatsappConversationDetail(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
  conversationId: string,
): Promise<OmnichannelConversationDetail | null> {
  const conversation = await findWhatsappConversationById(
    supabase,
    workspaceId,
    conversationId,
  );

  if (!conversation) {
    return null;
  }

  const messages = await findWhatsappMessagesByConversationId(
    supabase,
    conversationId,
  );

  let leadName: string | null = null;
  if (conversation.customer_id) {
    const { data: lead } = await supabase
      .from("leads")
      .select("full_name")
      .eq("id", conversation.customer_id)
      .maybeSingle();

    leadName = lead?.full_name?.trim() || null;
  }

  const listItem = mapWhatsappConversationToListItem(conversation, leadName);

  return {
    ...listItem,
    externalUserId: conversation.phone_number,
    tags: [],
    messages: messages.map((message) =>
      mapWhatsappMessageToOmnichannelMessage(message, conversation.id),
    ),
    notes: [],
    leadContext: null,
  };
}
