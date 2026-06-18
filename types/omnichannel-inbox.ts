import type { Json } from "@/types/database";

export type OmnichannelChannel = "instagram" | "facebook" | "whatsapp";

export type OmnichannelConversationStatus =
  | "new"
  | "interested"
  | "hot_lead"
  | "booking_process"
  | "paid"
  | "lost";

export type OmnichannelMessageDirection = "incoming" | "outgoing";

export type ConversationRow = {
  id: string;
  organization_id: string;
  channel: OmnichannelChannel;
  external_conversation_id: string;
  external_user_id: string | null;
  customer_name: string | null;
  customer_username: string | null;
  customer_avatar: string | null;
  assigned_user_id: string | null;
  status: OmnichannelConversationStatus;
  unread_count: number;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ConversationInsert = {
  id?: string;
  organization_id: string;
  channel: OmnichannelChannel;
  external_conversation_id: string;
  external_user_id?: string | null;
  customer_name?: string | null;
  customer_username?: string | null;
  customer_avatar?: string | null;
  assigned_user_id?: string | null;
  status?: OmnichannelConversationStatus;
  unread_count?: number;
  last_message_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ConversationUpdate = {
  external_user_id?: string | null;
  customer_name?: string | null;
  customer_username?: string | null;
  customer_avatar?: string | null;
  assigned_user_id?: string | null;
  status?: OmnichannelConversationStatus;
  unread_count?: number;
  last_message_at?: string | null;
  updated_at?: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  direction: OmnichannelMessageDirection;
  external_message_id: string | null;
  message_text: string | null;
  attachments_json: Json;
  sent_by_user_id: string | null;
  created_at: string;
};

export type MessageInsert = {
  id?: string;
  conversation_id: string;
  direction: OmnichannelMessageDirection;
  external_message_id?: string | null;
  message_text?: string | null;
  attachments_json?: Json;
  sent_by_user_id?: string | null;
  created_at?: string;
};

export type ConversationNoteRow = {
  id: string;
  conversation_id: string;
  note: string;
  created_by: string;
  created_at: string;
};

export type ConversationNoteInsert = {
  id?: string;
  conversation_id: string;
  note: string;
  created_by: string;
  created_at?: string;
};

export type ConversationTagRow = {
  id: string;
  conversation_id: string;
  tag: string;
};

export type OmnichannelInboxTables = {
  conversations: {
    Row: ConversationRow;
    Insert: ConversationInsert;
    Update: ConversationUpdate;
  };
  messages: {
    Row: MessageRow;
    Insert: MessageInsert;
    Update: Partial<MessageInsert>;
  };
  conversation_notes: {
    Row: ConversationNoteRow;
    Insert: ConversationNoteInsert;
    Update: Partial<ConversationNoteInsert>;
  };
  conversation_tags: {
    Row: ConversationTagRow;
    Insert: Omit<ConversationTagRow, "id"> & { id?: string };
    Update: Partial<ConversationTagRow>;
  };
};
