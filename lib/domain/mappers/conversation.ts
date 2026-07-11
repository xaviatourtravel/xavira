import type { Json } from "@/types/database";
import type {
  ConversationRow,
  MessageRow,
} from "@/types/omnichannel-inbox";

import type {
  Conversation,
  ConversationLabel,
  ConversationMessage,
} from "../conversation";

function countAttachments(attachmentsJson: Json): number {
  if (Array.isArray(attachmentsJson)) {
    return attachmentsJson.length;
  }

  return 0;
}

export function mapConversationFromRow(
  row: ConversationRow,
  relations?: {
    assignedUserName?: string | null;
    labels?: ConversationLabel[];
    tags?: string[];
  },
): Conversation {
  return {
    id: row.id,
    organizationId: row.organization_id,
    channel: row.channel,
    externalConversationId: row.external_conversation_id,
    externalUserId: row.external_user_id,
    customerName: row.customer_name,
    customerUsername: row.customer_username,
    customerAvatar: row.customer_avatar,
    assignedUserId: row.assigned_user_id,
    assignedUserName: relations?.assignedUserName ?? null,
    leadId: row.lead_id,
    status: row.status,
    unreadCount: row.unread_count,
    lastMessageAt: row.last_message_at,
    labels: relations?.labels ?? [],
    tags: relations?.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapConversationMessageFromRow(row: MessageRow): ConversationMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    direction: row.direction,
    externalMessageId: row.external_message_id,
    body: row.message_text,
    attachmentsCount: countAttachments(row.attachments_json),
    sentByUserId: row.sent_by_user_id,
    createdAt: row.created_at,
    deliveryStatus: row.deliveryStatus ?? null,
    senderType: row.senderType ?? null,
  };
}

export function mapConversationMessagesFromRows(rows: MessageRow[]): ConversationMessage[] {
  return rows.map(mapConversationMessageFromRow);
}
