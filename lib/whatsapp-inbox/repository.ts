import type { createClient } from "@/utils/supabase/server";
import type {
  WhatsappConversationInsert,
  WhatsappConversationRow,
  WhatsappConversationNoteRow,
  WhatsappConversationTagRow,
  WhatsappConversationUpdate,
  WhatsappMessageInsert,
  WhatsappMessageRow,
} from "@/types/whatsapp-inbox";

export type WhatsappSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type WhatsappConversationWithRelations = WhatsappConversationRow & {
  assigned_profile?:
    | { full_name: string | null }
    | { full_name: string | null }[]
    | null;
};

const CONVERSATION_COLUMNS = `
  id,
  workspace_id,
  instance_name,
  phone_number,
  contact_name,
  profile_picture_url,
  profile_picture_updated_at,
  customer_id,
  status,
  assigned_user_id,
  last_message,
  last_message_at,
  unread_count,
  created_at,
  updated_at
`;

function getAssigneeName(
  relation:
    | { full_name: string | null }
    | { full_name: string | null }[]
    | null
    | undefined,
) {
  const record = Array.isArray(relation) ? relation[0] : relation;
  const name = record?.full_name?.trim();
  return name || null;
}

function mapWhatsappConversationRow(
  row: WhatsappConversationWithRelations,
): WhatsappConversationRow & { assignedUserName: string | null } {
  return {
    ...row,
    assignedUserName: getAssigneeName(row.assigned_profile),
  };
}

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
  filters: {
    assignedUserId?: string;
    unassignedOnly?: boolean;
  } = {},
) {
  let query = supabase
    .from("whatsapp_conversations")
    .select(
      `
      ${CONVERSATION_COLUMNS},
      assigned_profile:assigned_user_id ( full_name )
    `,
    )
    .eq("workspace_id", workspaceId)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });

  if (filters.unassignedOnly) {
    query = query.is("assigned_user_id", null);
  } else if (filters.assignedUserId) {
    query = query.eq("assigned_user_id", filters.assignedUserId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as WhatsappConversationWithRelations[]).map(
    mapWhatsappConversationRow,
  );
}

export async function findWhatsappConversationById(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
  conversationId: string,
) {
  const { data, error } = await supabase
    .from("whatsapp_conversations")
    .select(
      `
      ${CONVERSATION_COLUMNS},
      assigned_profile:assigned_user_id ( full_name )
    `,
    )
    .eq("workspace_id", workspaceId)
    .eq("id", conversationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapWhatsappConversationRow(data as WhatsappConversationWithRelations);
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

/**
 * Mencari balasan keluar yang dikirim dari Desklabs tetapi belum memiliki
 * provider message id (masih "sending"/baru). Dipakai untuk merekonsiliasi
 * echo webhook fromMe=true agar tidak membuat duplikat saat terjadi balapan
 * antara penyelesaian pengiriman dan webhook.
 */
export async function findReconcilableOutgoingWhatsappMessage(
  supabase: WhatsappSupabaseClient,
  conversationId: string,
  text: string | null,
) {
  let query = supabase
    .from("whatsapp_messages")
    .select(MESSAGE_COLUMNS)
    .eq("conversation_id", conversationId)
    .eq("direction", "outgoing")
    .is("external_message_id", null)
    .order("created_at", { ascending: false })
    .limit(1);

  query = text === null ? query.is("text", null) : query.eq("text", text);

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as WhatsappMessageRow | null) ?? null;
}

export async function attachWhatsappProviderMessageId(
  supabase: WhatsappSupabaseClient,
  messageId: string,
  externalMessageId: string,
) {
  const { error } = await supabase
    .from("whatsapp_messages")
    .update({ external_message_id: externalMessageId, status: "sent" })
    .eq("id", messageId);

  if (error) {
    throw new Error(error.message);
  }
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

export async function findWhatsappConversationTagsByConversationId(
  supabase: WhatsappSupabaseClient,
  conversationId: string,
) {
  const { data, error } = await supabase
    .from("whatsapp_conversation_tags")
    .select("id, conversation_id, tag, color")
    .eq("conversation_id", conversationId)
    .order("tag", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as WhatsappConversationTagRow[];
}

export async function findWhatsappConversationNotesByConversationId(
  supabase: WhatsappSupabaseClient,
  conversationId: string,
) {
  const { data, error } = await supabase
    .from("whatsapp_conversation_notes")
    .select("id, conversation_id, note, created_by, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as WhatsappConversationNoteRow[];
}

export async function insertWhatsappConversationNote(
  supabase: WhatsappSupabaseClient,
  input: {
    conversation_id: string;
    note: string;
    created_by: string;
  },
) {
  const { data, error } = await supabase
    .from("whatsapp_conversation_notes")
    .insert(input)
    .select("id, conversation_id, note, created_by, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as WhatsappConversationNoteRow;
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
