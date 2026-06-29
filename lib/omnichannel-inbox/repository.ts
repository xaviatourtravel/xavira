import type { Json } from "@/types/database";
import type {
  ConversationInsert,
  ConversationNoteInsert,
  ConversationNoteRow,
  ConversationRow,
  ConversationUpdate,
  MessageInsert,
  MessageRow,
  OmnichannelChannel,
  OmnichannelConversationStatus,
} from "@/types/omnichannel-inbox";
import { pickWorkspaceLabelColor } from "@/lib/omnichannel-inbox/constants";
import type { createClient } from "@/utils/supabase/server";

export type OmnichannelSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type ConversationListFilters = {
  channel?: OmnichannelChannel;
  status?: OmnichannelConversationStatus;
  assignedUserId?: string | null;
  unassignedOnly?: boolean;
};

export type ConversationWithRelations = ConversationRow & {
  assigned_profile?:
    | { full_name: string | null }
    | { full_name: string | null }[]
    | null;
  tags?: { tag: string; color?: string | null }[] | null;
};

const CONVERSATION_COLUMNS = `
  id,
  organization_id,
  channel,
  external_conversation_id,
  external_user_id,
  customer_name,
  customer_username,
  customer_avatar,
  assigned_user_id,
  lead_id,
  status,
  unread_count,
  last_message_at,
  created_at,
  updated_at
`;

const MESSAGE_COLUMNS = `
  id,
  conversation_id,
  direction,
  external_message_id,
  message_text,
  attachments_json,
  sent_by_user_id,
  created_at
`;

const NOTE_COLUMNS = `
  id,
  conversation_id,
  note,
  created_by,
  created_at
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

export function mapConversationRow(
  row: ConversationWithRelations,
): ConversationRow & {
  assignedUserName: string | null;
  tags: string[];
  labels: { tag: string; color: string }[];
} {
  const labels = (row.tags ?? []).map((item) => ({
    tag: item.tag,
    color: item.color?.trim() || pickWorkspaceLabelColor(item.tag),
  }));

  return {
    ...row,
    assignedUserName: getAssigneeName(row.assigned_profile),
    tags: labels.map((item) => item.tag),
    labels,
  };
}

export async function findConversations(
  supabase: OmnichannelSupabaseClient,
  organizationId: string,
  filters: ConversationListFilters = {},
) {
  let query = supabase
    .from("conversations")
    .select(
      `
      ${CONVERSATION_COLUMNS},
      assigned_profile:assigned_user_id ( full_name ),
      tags:conversation_tags ( tag, color )
    `,
    )
    .eq("organization_id", organizationId)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });

  if (filters.channel) {
    query = query.eq("channel", filters.channel);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.unassignedOnly) {
    query = query.is("assigned_user_id", null);
  } else if (filters.assignedUserId !== undefined) {
    if (filters.assignedUserId === null) {
      query = query.is("assigned_user_id", null);
    } else {
      query = query.eq("assigned_user_id", filters.assignedUserId);
    }
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as ConversationWithRelations[]).map(mapConversationRow);
}

export async function findConversationById(
  supabase: OmnichannelSupabaseClient,
  organizationId: string,
  conversationId: string,
) {
  const { data, error } = await supabase
    .from("conversations")
    .select(
      `
      ${CONVERSATION_COLUMNS},
      assigned_profile:assigned_user_id ( full_name ),
      tags:conversation_tags ( tag, color )
    `,
    )
    .eq("organization_id", organizationId)
    .eq("id", conversationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapConversationRow(data as ConversationWithRelations);
}

export async function findConversationByExternalId(
  supabase: OmnichannelSupabaseClient,
  organizationId: string,
  channel: OmnichannelChannel,
  externalConversationId: string,
) {
  const { data, error } = await supabase
    .from("conversations")
    .select(CONVERSATION_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("channel", channel)
    .eq("external_conversation_id", externalConversationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ConversationRow | null) ?? null;
}

export async function insertConversation(
  supabase: OmnichannelSupabaseClient,
  input: ConversationInsert,
) {
  const { data, error } = await supabase
    .from("conversations")
    .insert(input)
    .select(CONVERSATION_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ConversationRow;
}

export async function updateConversationById(
  supabase: OmnichannelSupabaseClient,
  organizationId: string,
  conversationId: string,
  patch: ConversationUpdate,
) {
  const { data, error } = await supabase
    .from("conversations")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", conversationId)
    .select(CONVERSATION_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ConversationRow | null) ?? null;
}

export async function markConversationAsRead(
  supabase: OmnichannelSupabaseClient,
  organizationId: string,
  conversationId: string,
) {
  return updateConversationById(supabase, organizationId, conversationId, {
    unread_count: 0,
  });
}

export async function findMessagesByConversationId(
  supabase: OmnichannelSupabaseClient,
  organizationId: string,
  conversationId: string,
) {
  const conversation = await findConversationById(
    supabase,
    organizationId,
    conversationId,
  );

  if (!conversation) {
    return null;
  }

  const { data, error } = await supabase
    .from("messages")
    .select(MESSAGE_COLUMNS)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as MessageRow[];
}

export async function findMessageByExternalId(
  supabase: OmnichannelSupabaseClient,
  conversationId: string,
  externalMessageId: string,
) {
  const { data, error } = await supabase
    .from("messages")
    .select(MESSAGE_COLUMNS)
    .eq("conversation_id", conversationId)
    .eq("external_message_id", externalMessageId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as MessageRow | null) ?? null;
}

export async function insertMessage(
  supabase: OmnichannelSupabaseClient,
  input: MessageInsert,
) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      ...input,
      attachments_json: (input.attachments_json ?? []) as Json,
    })
    .select(MESSAGE_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as MessageRow;
}

export async function upsertConversationFromWebhook(
  supabase: OmnichannelSupabaseClient,
  input: ConversationInsert,
) {
  const existing = await findConversationByExternalId(
    supabase,
    input.organization_id,
    input.channel,
    input.external_conversation_id,
  );

  if (existing) {
    const patch: ConversationUpdate = {};

    if (input.customer_name?.trim()) {
      patch.customer_name = input.customer_name.trim();
    }

    if (input.customer_username?.trim()) {
      patch.customer_username = input.customer_username.trim();
    }

    if (input.customer_avatar?.trim()) {
      patch.customer_avatar = input.customer_avatar.trim();
    }

    if (input.external_user_id?.trim()) {
      patch.external_user_id = input.external_user_id.trim();
    }

    if (Object.keys(patch).length === 0) {
      return { conversation: existing, created: false };
    }

    const updated = await updateConversationById(
      supabase,
      input.organization_id,
      existing.id,
      patch,
    );

    return {
      conversation: updated ?? existing,
      created: false,
    };
  }

  const inserted = await insertConversation(supabase, {
    organization_id: input.organization_id,
    channel: input.channel,
    external_conversation_id: input.external_conversation_id,
    external_user_id: input.external_user_id ?? null,
    customer_name: input.customer_name ?? null,
    customer_username: input.customer_username ?? null,
    customer_avatar: input.customer_avatar ?? null,
    assigned_user_id: input.assigned_user_id ?? null,
    status: input.status ?? "new",
    unread_count: 0,
    last_message_at: null,
  });

  return { conversation: inserted, created: true };
}

export async function findNotesByConversationId(
  supabase: OmnichannelSupabaseClient,
  organizationId: string,
  conversationId: string,
) {
  const conversation = await findConversationById(
    supabase,
    organizationId,
    conversationId,
  );

  if (!conversation) {
    return null;
  }

  const { data, error } = await supabase
    .from("conversation_notes")
    .select(NOTE_COLUMNS)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ConversationNoteRow[];
}

export async function insertConversationNote(
  supabase: OmnichannelSupabaseClient,
  input: ConversationNoteInsert,
) {
  const { data, error } = await supabase
    .from("conversation_notes")
    .insert(input)
    .select(NOTE_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ConversationNoteRow;
}

export async function resolveOrganizationProfileId(
  supabase: OmnichannelSupabaseClient,
  organizationId: string,
  profileId: string,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.id ?? null;
}
