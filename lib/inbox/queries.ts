import {
  formatInboxSourceLabel,
  formatInboxStatusLabel,
  type InboxSource,
  type InboxStatus,
} from "@/lib/inbox/constants";
import { getLeadAssigneeName } from "@/lib/leads/assignment";
import type { createClient } from "@/utils/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type InboxConversationRow = {
  id: string;
  organization_id: string;
  lead_id: string | null;
  assigned_to: string | null;
  campaign_id: string | null;
  source: InboxSource;
  contact_name: string;
  contact_handle: string | null;
  last_message: string | null;
  last_message_at: string | null;
  status: InboxStatus;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string | null } | { full_name: string | null }[] | null;
  campaigns?: { name: string } | { name: string }[] | null;
  leads?: { id: string; full_name: string } | { id: string; full_name: string }[] | null;
};

export type InboxConversationListItem = {
  id: string;
  source: InboxSource;
  sourceLabel: string;
  contactName: string;
  contactHandle: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  status: InboxStatus;
  statusLabel: string;
  assignedTo: string | null;
  assignedToName: string | null;
  campaignId: string | null;
  campaignName: string | null;
  leadId: string | null;
  leadName: string | null;
  updatedAt: string;
};

export type InboxListFilters = {
  status?: InboxStatus;
  source?: InboxSource;
  assigned?: "me" | "unassigned" | string;
};

function getRelationName<T extends { name?: string; full_name?: string }>(
  relation: T | T[] | null | undefined,
  field: "name" | "full_name",
) {
  const record = Array.isArray(relation) ? relation[0] : relation;
  if (!record) {
    return null;
  }

  const value = record[field];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function mapInboxConversationRow(
  row: InboxConversationRow,
): InboxConversationListItem {
  return {
    id: row.id,
    source: row.source,
    sourceLabel: formatInboxSourceLabel(row.source),
    contactName: row.contact_name,
    contactHandle: row.contact_handle,
    lastMessage: row.last_message,
    lastMessageAt: row.last_message_at,
    status: row.status,
    statusLabel: formatInboxStatusLabel(row.status),
    assignedTo: row.assigned_to,
    assignedToName: getLeadAssigneeName(row.profiles),
    campaignId: row.campaign_id,
    campaignName: getRelationName(row.campaigns, "name"),
    leadId: row.lead_id,
    leadName: getRelationName(row.leads, "full_name"),
    updatedAt: row.updated_at,
  };
}

export async function loadInboxConversations(
  supabase: SupabaseServerClient,
  organizationId: string,
  filters: InboxListFilters = {},
) {
  let query = supabase
    .from("inbox_conversations")
    .select(
      `
      id,
      organization_id,
      lead_id,
      assigned_to,
      campaign_id,
      source,
      contact_name,
      contact_handle,
      last_message,
      last_message_at,
      status,
      metadata,
      created_by,
      created_at,
      updated_at,
      profiles:assigned_to ( full_name ),
      campaigns:campaign_id ( name ),
      leads:lead_id ( id, full_name )
    `,
    )
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.source) {
    query = query.eq("source", filters.source);
  }

  if (filters.assigned === "unassigned") {
    query = query.is("assigned_to", null);
  } else if (filters.assigned === "me") {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      query = query.eq("assigned_to", user.id);
    }
  } else if (filters.assigned) {
    query = query.eq("assigned_to", filters.assigned);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Load inbox conversations error:", error);
    throw new Error(error.message);
  }

  return ((data ?? []) as InboxConversationRow[]).map(mapInboxConversationRow);
}

export async function loadInboxConversationById(
  supabase: SupabaseServerClient,
  organizationId: string,
  conversationId: string,
) {
  const { data, error } = await supabase
    .from("inbox_conversations")
    .select(
      `
      id,
      organization_id,
      lead_id,
      assigned_to,
      campaign_id,
      source,
      contact_name,
      contact_handle,
      last_message,
      last_message_at,
      status,
      metadata,
      created_by,
      created_at,
      updated_at,
      profiles:assigned_to ( full_name ),
      campaigns:campaign_id ( name ),
      leads:lead_id ( id, full_name )
    `,
    )
    .eq("organization_id", organizationId)
    .eq("id", conversationId)
    .maybeSingle();

  if (error) {
    console.error("Load inbox conversation error:", error);
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapInboxConversationRow(data as InboxConversationRow);
}

export async function loadInboxConversationRawById(
  supabase: SupabaseServerClient,
  organizationId: string,
  conversationId: string,
) {
  const { data, error } = await supabase
    .from("inbox_conversations")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", conversationId)
    .maybeSingle();

  if (error) {
    console.error("Load inbox conversation raw error:", error);
    throw new Error(error.message);
  }

  return (data as InboxConversationRow | null) ?? null;
}
