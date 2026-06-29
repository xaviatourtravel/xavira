import {
  formatOmnichannelChannelLabel,
  formatOmnichannelConversationStatusLabel,
  isOmnichannelChannel,
  isOmnichannelConversationStatus,
} from "@/lib/omnichannel-inbox/constants";
import {
  findConversationById,
  findConversations,
  findMessagesByConversationId,
  findNotesByConversationId,
  type ConversationListFilters,
  type OmnichannelSupabaseClient,
} from "@/lib/omnichannel-inbox/repository";
import { loadInboxLeadPanelContext } from "@/lib/omnichannel-inbox/lead-context";
import type { InboxLeadPanelContext } from "@/lib/omnichannel-inbox/lead-context";
import type {
  ConversationNoteRow,
  MessageRow,
  OmnichannelChannel,
  OmnichannelConversationStatus,
} from "@/types/omnichannel-inbox";

export type OmnichannelInboxFilter =
  | "all"
  | "instagram"
  | "facebook"
  | "whatsapp"
  | "unassigned"
  | "mine"
  | "hot_leads";

export type OmnichannelConversationListItem = {
  id: string;
  channel: OmnichannelChannel;
  channelLabel: string;
  customerName: string;
  customerUsername: string | null;
  customerAvatar: string | null;
  assignedUserId: string | null;
  assignedUserName: string | null;
  leadId: string | null;
  status: OmnichannelConversationStatus;
  statusLabel: string;
  unreadCount: number;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OmnichannelConversationNote = ConversationNoteRow & {
  authorName: string | null;
};

export type OmnichannelConversationDetail = OmnichannelConversationListItem & {
  externalUserId: string | null;
  tags: string[];
  messages: MessageRow[];
  notes: OmnichannelConversationNote[];
  leadContext: InboxLeadPanelContext | null;
};

export type OmnichannelInboxSearchParams = {
  filter?: string;
  c?: string;
  error?: string;
  success?: string;
};

function getCustomerDisplayName(
  customerName: string | null,
  customerUsername: string | null,
  externalUserId: string | null,
) {
  if (customerName?.trim()) {
    return customerName.trim();
  }

  if (customerUsername?.trim()) {
    return `@${customerUsername.trim()}`;
  }

  if (externalUserId?.trim()) {
    return `Customer ${externalUserId.slice(-6)}`;
  }

  return "Unknown Customer";
}

function buildMessagePreview(messageText: string | null, attachmentsCount: number) {
  if (messageText?.trim()) {
    const text = messageText.trim();
    return text.length > 120 ? `${text.slice(0, 120)}…` : text;
  }

  if (attachmentsCount > 0) {
    return attachmentsCount === 1 ? "📎 Attachment" : `📎 ${attachmentsCount} attachments`;
  }

  return null;
}

export function parseOmnichannelInboxFilter(
  value: string | undefined,
): OmnichannelInboxFilter {
  switch (value) {
    case "instagram":
    case "facebook":
    case "whatsapp":
    case "unassigned":
    case "mine":
    case "hot_leads":
      return value;
    default:
      return "all";
  }
}

export function buildConversationListFilters(
  filter: OmnichannelInboxFilter,
  currentUserId: string,
): ConversationListFilters {
  switch (filter) {
    case "instagram":
      return { channel: "instagram" };
    case "facebook":
      return { channel: "facebook" };
    case "whatsapp":
      return { channel: "whatsapp" };
    case "unassigned":
      return { unassignedOnly: true };
    case "mine":
      return { assignedUserId: currentUserId };
    case "hot_leads":
      return { status: "hot_lead" };
    default:
      return {};
  }
}

async function loadLatestMessagesByConversationIds(
  supabase: OmnichannelSupabaseClient,
  conversationIds: string[],
) {
  const previews = new Map<
    string,
    { messageText: string | null; attachmentsCount: number }
  >();

  if (conversationIds.length === 0) {
    return previews;
  }

  const { data, error } = await supabase
    .from("messages")
    .select("conversation_id, message_text, attachments_json, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  for (const row of data ?? []) {
    if (previews.has(row.conversation_id)) {
      continue;
    }

    const attachments = Array.isArray(row.attachments_json)
      ? row.attachments_json
      : [];

    previews.set(row.conversation_id, {
      messageText: row.message_text,
      attachmentsCount: attachments.length,
    });
  }

  return previews;
}

function mapConversationListItem(
  row: Awaited<ReturnType<typeof findConversations>>[number],
  preview: { messageText: string | null; attachmentsCount: number } | undefined,
): OmnichannelConversationListItem {
  const status = isOmnichannelConversationStatus(row.status)
    ? row.status
    : "new";
  const channel = isOmnichannelChannel(row.channel) ? row.channel : "instagram";

  return {
    id: row.id,
    channel,
    channelLabel: formatOmnichannelChannelLabel(channel),
    customerName: getCustomerDisplayName(
      row.customer_name,
      row.customer_username,
      row.external_user_id,
    ),
    customerUsername: row.customer_username,
    customerAvatar: row.customer_avatar,
    assignedUserId: row.assigned_user_id,
    assignedUserName: row.assignedUserName,
    leadId: row.lead_id ?? null,
    status,
    statusLabel: formatOmnichannelConversationStatusLabel(status),
    unreadCount: row.unread_count,
    lastMessageAt: row.last_message_at,
    lastMessagePreview: buildMessagePreview(
      preview?.messageText ?? null,
      preview?.attachmentsCount ?? 0,
    ),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadOmnichannelConversationList(
  supabase: OmnichannelSupabaseClient,
  organizationId: string,
  filter: OmnichannelInboxFilter,
  currentUserId: string,
) {
  const rows = await findConversations(
    supabase,
    organizationId,
    buildConversationListFilters(filter, currentUserId),
  );

  const previews = await loadLatestMessagesByConversationIds(
    supabase,
    rows.map((row) => row.id),
  );

  return rows.map((row) =>
    mapConversationListItem(row, previews.get(row.id)),
  );
}

async function loadConversationNotesWithAuthors(
  supabase: OmnichannelSupabaseClient,
  organizationId: string,
  conversationId: string,
) {
  const notes = await findNotesByConversationId(
    supabase,
    organizationId,
    conversationId,
  );

  if (!notes) {
    return [];
  }

  const authorIds = [...new Set(notes.map((note) => note.created_by))];
  const authorNames = new Map<string, string>();

  if (authorIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("organization_id", organizationId)
      .in("id", authorIds);

    for (const profile of data ?? []) {
      authorNames.set(profile.id, profile.full_name?.trim() || "Team member");
    }
  }

  return notes.map((note) => ({
    ...note,
    authorName: authorNames.get(note.created_by) ?? "Team member",
  }));
}

export async function loadOmnichannelConversationDetail(
  supabase: OmnichannelSupabaseClient,
  organizationId: string,
  conversationId: string,
) {
  const [conversation, messages, notes] = await Promise.all([
    findConversationById(supabase, organizationId, conversationId),
    findMessagesByConversationId(supabase, organizationId, conversationId),
    loadConversationNotesWithAuthors(supabase, organizationId, conversationId),
  ]);

  if (!conversation || !messages) {
    return null;
  }

  const latestMessage = messages.at(-1);
  const preview = latestMessage
    ? {
        messageText: latestMessage.message_text,
        attachmentsCount: Array.isArray(latestMessage.attachments_json)
          ? latestMessage.attachments_json.length
          : 0,
      }
    : undefined;

  const detailBase = {
    ...mapConversationListItem(conversation, preview),
    externalUserId: conversation.external_user_id,
    tags: conversation.tags ?? [],
    messages,
    notes,
    leadContext: null as OmnichannelConversationDetail["leadContext"],
  };

  const leadContext = detailBase.leadId
    ? await loadInboxLeadPanelContext(supabase, organizationId, {
        ...detailBase,
      })
    : null;

  return {
    ...detailBase,
    leadContext,
  } satisfies OmnichannelConversationDetail;
}
