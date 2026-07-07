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
import type { WhatsappAiAuditEvent } from "@/lib/whatsapp-inbox/ai/activity-events";
import { loadWorkspaceAssignmentHistory } from "@/lib/workspace/assignment-events";
import type { InboxLeadPanelContext } from "@/lib/omnichannel-inbox/lead-context";
import type { LeadQualificationSnapshot } from "@/modules/ai/types/lead-qualification";
import type { ConversationMemoryMap } from "@/modules/ai/types/memory";
import type { RecommendedDocumentItem } from "@/modules/inbox/lib/build-ai-command-center";
import type { InboxAiActionItem } from "@/modules/inbox/lib/load-ai-actions";
import type {
  ConversationNoteRow,
  ConversationLabel,
  AssignmentHistoryEntry,
  MessageRow,
  OmnichannelChannel,
  OmnichannelConversationStatus,
} from "@/types/omnichannel-inbox";

export type OmnichannelInboxFilter =
  | "all"
  | "unread"
  | "instagram"
  | "facebook"
  | "whatsapp"
  | "unassigned"
  | "mine"
  | "hot_leads"
  | "ready_for_human"
  | "ai_active"
  | "human_assisted"
  | "human_only";

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
  labels: ConversationLabel[];
  createdAt: string;
  updatedAt: string;
  /** WhatsApp-only AI ownership state */
  aiState?: string | null;
  aiStateLabel?: string | null;
  aiHandoffReason?: string | null;
  aiLastActionAt?: string | null;
};

export type OmnichannelConversationNote = ConversationNoteRow & {
  authorName: string | null;
};

export type OmnichannelConversationDetail = OmnichannelConversationListItem & {
  externalUserId: string | null;
  tags: string[];
  labels: ConversationLabel[];
  messages: MessageRow[];
  notes: OmnichannelConversationNote[];
  assignmentHistory: AssignmentHistoryEntry[];
  leadContext: InboxLeadPanelContext | null;
  aiActivityEvents?: WhatsappAiAuditEvent[];
  leadQualification?: LeadQualificationSnapshot | null;
  conversationMemory?: ConversationMemoryMap | null;
  recommendedDocuments?: RecommendedDocumentItem[];
  aiActions?: InboxAiActionItem[];
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
    case "unread":
    case "instagram":
    case "facebook":
    case "whatsapp":
    case "unassigned":
    case "mine":
    case "hot_leads":
      return value;
    case "ready_for_human":
    case "ai_active":
    case "human_assisted":
    case "human_only":
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
      return { status: "following_up" };
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
    labels: row.labels ?? [],
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
  const [conversation, messages, notes, assignmentHistory] = await Promise.all([
    findConversationById(supabase, organizationId, conversationId),
    findMessagesByConversationId(supabase, organizationId, conversationId),
    loadConversationNotesWithAuthors(supabase, organizationId, conversationId),
    loadWorkspaceAssignmentHistory(supabase, organizationId, conversationId),
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
    labels: conversation.labels ?? [],
    messages,
    notes,
    assignmentHistory,
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
