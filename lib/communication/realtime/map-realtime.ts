import { mapProviderDeliveryStatus } from "@/lib/communication/messaging/delivery";
import type { MessageRow } from "@/types/omnichannel-inbox";

// Bentuk mentah baris whatsapp_messages yang diterima dari payload realtime.
type WhatsappMessageRecord = {
  id?: unknown;
  conversation_id?: unknown;
  direction?: unknown;
  text?: unknown;
  media_url?: unknown;
  status?: unknown;
  timestamp?: unknown;
  created_at?: unknown;
  external_message_id?: unknown;
};

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

// Menerjemahkan baris realtime whatsapp_messages menjadi MessageRow yang
// dipakai UI, mengikuti pemetaan yang sama dengan query inbox di server.
export function mapWhatsappRecordToMessageRow(
  record: unknown,
): MessageRow | null {
  if (!record || typeof record !== "object") {
    return null;
  }

  const row = record as WhatsappMessageRecord;
  const id = asString(row.id);
  const conversationId = asString(row.conversation_id);

  if (!id || !conversationId) {
    return null;
  }

  const mediaUrl = asString(row.media_url);
  const timestamp =
    asString(row.timestamp) ??
    asString(row.created_at) ??
    new Date().toISOString();

  return {
    id,
    conversation_id: conversationId,
    direction: row.direction === "outgoing" ? "outgoing" : "incoming",
    external_message_id: asString(row.external_message_id),
    message_text: asString(row.text),
    attachments_json: mediaUrl ? [{ url: mediaUrl }] : [],
    sent_by_user_id: null,
    created_at: timestamp,
    deliveryStatus: mapProviderDeliveryStatus(asString(row.status)),
  };
}

// Patch yang diterapkan ke item daftar percakapan saat realtime melaporkan
// perubahan pada whatsapp_conversations.
export type ConversationListPatch = {
  id: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number | null;
  customerAvatar?: string | null;
};

type WhatsappConversationRecord = {
  id?: unknown;
  last_message?: unknown;
  last_message_at?: unknown;
  unread_count?: unknown;
  profile_picture_url?: unknown;
};

export function mapWhatsappConversationRecord(
  record: unknown,
): ConversationListPatch | null {
  if (!record || typeof record !== "object") {
    return null;
  }

  const row = record as WhatsappConversationRecord;
  const id = asString(row.id);

  if (!id) {
    return null;
  }

  const patch: ConversationListPatch = {
    id,
    lastMessage: asString(row.last_message),
    lastMessageAt: asString(row.last_message_at),
    unreadCount:
      typeof row.unread_count === "number" ? row.unread_count : null,
  };

  if ("profile_picture_url" in row) {
    patch.customerAvatar = asString(row.profile_picture_url);
  }

  return patch;
}
