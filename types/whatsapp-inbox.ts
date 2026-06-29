import type { Json } from "@/types/database";

export type WhatsappMessageDirection = "incoming" | "outgoing";

export type WhatsappConversationRow = {
  id: string;
  workspace_id: string;
  instance_name: string;
  phone_number: string;
  customer_id: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
};

export type WhatsappConversationInsert = {
  id?: string;
  workspace_id: string;
  instance_name: string;
  phone_number: string;
  customer_id?: string | null;
  last_message?: string | null;
  last_message_at?: string | null;
  unread_count?: number;
};

export type WhatsappConversationUpdate = {
  customer_id?: string | null;
  last_message?: string | null;
  last_message_at?: string | null;
  unread_count?: number;
};

export type WhatsappMessageRow = {
  id: string;
  conversation_id: string;
  direction: WhatsappMessageDirection;
  message_type: string;
  text: string | null;
  media_url: string | null;
  status: string | null;
  timestamp: string;
  raw_payload: Json;
  external_message_id: string | null;
  created_at: string;
};

export type WhatsappMessageInsert = {
  id?: string;
  conversation_id: string;
  direction: WhatsappMessageDirection;
  message_type?: string;
  text?: string | null;
  media_url?: string | null;
  status?: string | null;
  timestamp: string;
  raw_payload?: Json;
  external_message_id?: string | null;
};

/** Domain aliases requested in product spec */
export type WhatsappConversation = {
  id: string;
  workspaceId: string;
  instanceName: string;
  phoneNumber: string;
  customerId: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
};

export type WhatsappMessage = {
  id: string;
  conversationId: string;
  direction: WhatsappMessageDirection;
  messageType: string;
  text: string | null;
  mediaUrl: string | null;
  status: string | null;
  timestamp: string;
  rawPayload: Json;
};

export function mapWhatsappConversationRow(
  row: WhatsappConversationRow,
): WhatsappConversation {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    instanceName: row.instance_name,
    phoneNumber: row.phone_number,
    customerId: row.customer_id,
    lastMessage: row.last_message,
    lastMessageAt: row.last_message_at,
    unreadCount: row.unread_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapWhatsappMessageRow(row: WhatsappMessageRow): WhatsappMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    direction: row.direction,
    messageType: row.message_type,
    text: row.text,
    mediaUrl: row.media_url,
    status: row.status,
    timestamp: row.timestamp,
    rawPayload: row.raw_payload,
  };
}
