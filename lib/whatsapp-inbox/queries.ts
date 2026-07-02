import {
  formatOmnichannelConversationStatusLabel,
  isOmnichannelConversationStatus,
  pickWorkspaceLabelColor,
} from "@/lib/omnichannel-inbox/constants";
import { loadInboxLeadPanelContext } from "@/lib/omnichannel-inbox/lead-context";
import { loadWorkspaceAssignmentHistory } from "@/lib/workspace/assignment-events";
import { getWhatsappMessageDeliveryStatus } from "@/lib/whatsapp-inbox/send-reply";
import type {
  OmnichannelConversationDetail,
  OmnichannelConversationListItem,
} from "@/lib/omnichannel-inbox/queries";
import {
  findWhatsappConversationById,
  findWhatsappConversationNotesByConversationId,
  findWhatsappConversations,
  findWhatsappConversationTagsByConversationId,
  findWhatsappMessagesByConversationId,
  type WhatsappSupabaseClient,
} from "@/lib/whatsapp-inbox/repository";
import { resolveWhatsappContactDisplay } from "@/lib/whatsapp-inbox/display";
import {
  scheduleStaleWhatsappProfilePictureSyncs,
  shouldRefreshWhatsappProfilePicture,
  syncWhatsappConversationProfilePicture,
} from "@/lib/whatsapp-inbox/profile-picture";
import type { ConversationLabel, MessageRow } from "@/types/omnichannel-inbox";
import type { WhatsappConversationRow, WhatsappMessageRow } from "@/types/whatsapp-inbox";

type WhatsappConversationWithAssignee = WhatsappConversationRow & {
  assignedUserName?: string | null;
};

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
    deliveryStatus: getWhatsappMessageDeliveryStatus(message),
  };
}

function mapWhatsappConversationToListItem(
  conversation: WhatsappConversationWithAssignee,
): OmnichannelConversationListItem {
  const contact = resolveWhatsappContactDisplay(conversation);
  const status = isOmnichannelConversationStatus(conversation.status)
    ? conversation.status
    : "new";

  return {
    id: conversation.id,
    channel: "whatsapp",
    channelLabel: "WhatsApp",
    customerName: contact.primaryName,
    customerUsername: contact.secondaryLabel,
    customerAvatar: conversation.profile_picture_url ?? null,
    assignedUserId: conversation.assigned_user_id,
    assignedUserName: conversation.assignedUserName ?? null,
    leadId: conversation.customer_id,
    status,
    statusLabel: formatOmnichannelConversationStatusLabel(status),
    unreadCount: conversation.unread_count,
    lastMessageAt: conversation.last_message_at,
    lastMessagePreview: conversation.last_message,
    labels: [],
    createdAt: conversation.created_at,
    updatedAt: conversation.updated_at,
  };
}

async function loadWhatsappConversationNotesWithAuthors(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
  conversationId: string,
) {
  const notes = await findWhatsappConversationNotesByConversationId(
    supabase,
    conversationId,
  );

  if (notes.length === 0) {
    return [];
  }

  const authorIds = [...new Set(notes.map((note) => note.created_by))];
  const authorNames = new Map<string, string>();

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("organization_id", workspaceId)
    .in("id", authorIds);

  for (const profile of data ?? []) {
    authorNames.set(profile.id, profile.full_name?.trim() || "Team member");
  }

  return notes.map((note) => ({
    ...note,
    authorName: authorNames.get(note.created_by) ?? "Team member",
  }));
}

export async function loadWhatsappConversationList(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
  filter?: {
    assignedUserId?: string;
    unassignedOnly?: boolean;
  },
): Promise<OmnichannelConversationListItem[]> {
  const conversations = await findWhatsappConversations(
    supabase,
    workspaceId,
    filter ?? {},
  );

  scheduleStaleWhatsappProfilePictureSyncs(
    supabase,
    workspaceId,
    conversations,
  );

  return conversations.map(mapWhatsappConversationToListItem);
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

  let activeConversation = conversation;

  if (shouldRefreshWhatsappProfilePicture(conversation)) {
    const syncResult = await syncWhatsappConversationProfilePicture(
      supabase,
      workspaceId,
      conversationId,
    );

    if (syncResult.refreshed) {
      activeConversation = {
        ...conversation,
        profile_picture_url: syncResult.profilePictureUrl,
        profile_picture_updated_at: new Date().toISOString(),
      };
    }
  }

  const [messages, notes, tags, assignmentHistory] = await Promise.all([
    findWhatsappMessagesByConversationId(supabase, conversationId),
    loadWhatsappConversationNotesWithAuthors(
      supabase,
      workspaceId,
      conversationId,
    ),
    findWhatsappConversationTagsByConversationId(supabase, conversationId),
    loadWorkspaceAssignmentHistory(supabase, workspaceId, conversationId),
  ]);

  const labels: ConversationLabel[] = tags.map((tag) => ({
    tag: tag.tag,
    color: tag.color?.trim() || pickWorkspaceLabelColor(tag.tag),
  }));

  const listItem = {
    ...mapWhatsappConversationToListItem(activeConversation),
    labels,
  };

  const detailBase = {
    ...listItem,
    externalUserId: conversation.phone_number,
    tags: labels.map((label) => label.tag),
    labels,
    messages: messages.map((message) =>
      mapWhatsappMessageToOmnichannelMessage(message, activeConversation.id),
    ),
    notes,
    assignmentHistory,
    leadContext: null as OmnichannelConversationDetail["leadContext"],
  };

  const leadContext = detailBase.leadId
    ? await loadInboxLeadPanelContext(supabase, workspaceId, detailBase)
    : null;

  return {
    ...detailBase,
    leadContext,
  };
}
