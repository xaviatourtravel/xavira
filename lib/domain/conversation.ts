export type ConversationChannel = "instagram" | "facebook" | "whatsapp";

export type ConversationStatus =
  | "new"
  | "following_up"
  | "quotation_sent"
  | "waiting_dp"
  | "closed_won"
  | "closed_lost";

export type ConversationLabel = {
  tag: string;
  color: string;
};

export type ConversationMessageDirection = "incoming" | "outgoing";

export type ConversationMessageDeliveryStatus = "pending" | "sent" | "delivered" | "failed";

/** Canonical conversation entity — channel-agnostic inbox thread. */
export type Conversation = {
  id: string;
  organizationId: string;
  channel: ConversationChannel;
  externalConversationId: string;
  externalUserId: string | null;
  customerName: string | null;
  customerUsername: string | null;
  customerAvatar: string | null;
  assignedUserId: string | null;
  assignedUserName: string | null;
  leadId: string | null;
  status: ConversationStatus;
  unreadCount: number;
  lastMessageAt: string | null;
  labels: ConversationLabel[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

/** Canonical message within a conversation. */
export type ConversationMessage = {
  id: string;
  conversationId: string;
  direction: ConversationMessageDirection;
  externalMessageId: string | null;
  body: string | null;
  attachmentsCount: number;
  sentByUserId: string | null;
  createdAt: string;
  deliveryStatus: ConversationMessageDeliveryStatus | null;
  senderType: "ai" | "human" | "customer" | null;
};
