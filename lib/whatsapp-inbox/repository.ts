import type { createClient } from "@/utils/supabase/server";
import type {
  WhatsappConversationInsert,
  WhatsappConversationRow,
  WhatsappConversationUpdate,
  WhatsappMessageInsert,
  WhatsappMessageRow,
} from "@/types/whatsapp-inbox";

export type WhatsappSupabaseClient = Awaited<ReturnType<typeof createClient>>;

const CONVERSATION_COLUMNS = `
  id,
  workspace_id,
  instance_name,
  phone_number,
  customer_id,
  last_message,
  last_message_at,
  unread_count,
  created_at,
  updated_at
`;

const MESSAGE_COLUMNS = `
  id,
  conversation_id,
  direction,
  message_type,
  text,
  media_url,
  status,
  timestamp,
  raw_payload,
  external_message_id,
  created_at
`;

export async function findWhatsappConversations(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
) {
  const { data, error } = await supabase
    .from("whatsapp_conversations")
    .select(CONVERSATION_COLUMNS)
    .eq("workspace_id", workspaceId)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as WhatsappConversationRow[];
}

export async function findWhatsappConversationById(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
  conversationId: string,
) {
  const { data, error } = await supabase
    .from("whatsapp_conversations")
    .select(CONVERSATION_COLUMNS)
    .eq("workspace_id", workspaceId)
    .eq("id", conversationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as WhatsappConversationRow | null) ?? null;
}

export async function findWhatsappConversationByPhone(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
  instanceName: string,
  phoneNumber: string,
) {
  const { data, error } = await supabase
    .from("whatsapp_conversations")
    .select(CONVERSATION_COLUMNS)
    .eq("workspace_id", workspaceId)
    .eq("instance_name", instanceName)
    .eq("phone_number", phoneNumber)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as WhatsappConversationRow | null) ?? null;
}

export async function insertWhatsappConversation(
  supabase: WhatsappSupabaseClient,
  input: WhatsappConversationInsert,
) {
  const { data, error } = await supabase
    .from("whatsapp_conversations")
    .insert(input)
    .select(CONVERSATION_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as WhatsappConversationRow;
}

export async function updateWhatsappConversationById(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
  conversationId: string,
  input: WhatsappConversationUpdate,
) {
  const { data, error } = await supabase
    .from("whatsapp_conversations")
    .update(input)
    .eq("workspace_id", workspaceId)
    .eq("id", conversationId)
    .select(CONVERSATION_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as WhatsappConversationRow;
}

export async function findWhatsappMessagesByConversationId(
  supabase: WhatsappSupabaseClient,
  conversationId: string,
) {
  const { data, error } = await supabase
    .from("whatsapp_messages")
    .select(MESSAGE_COLUMNS)
    .eq("conversation_id", conversationId)
    .order("timestamp", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as WhatsappMessageRow[];
}

export async function findWhatsappMessageByExternalId(
  supabase: WhatsappSupabaseClient,
  conversationId: string,
  externalMessageId: string,
) {
  const { data, error } = await supabase
    .from("whatsapp_messages")
    .select(MESSAGE_COLUMNS)
    .eq("conversation_id", conversationId)
    .eq("external_message_id", externalMessageId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as WhatsappMessageRow | null) ?? null;
}

export async function insertWhatsappMessage(
  supabase: WhatsappSupabaseClient,
  input: WhatsappMessageInsert,
) {
  const { data, error } = await supabase
    .from("whatsapp_messages")
    .insert(input)
    .select(MESSAGE_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as WhatsappMessageRow;
}

export async function markWhatsappConversationAsRead(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
  conversationId: string,
) {
  return updateWhatsappConversationById(supabase, workspaceId, conversationId, {
    unread_count: 0,
  });
}
