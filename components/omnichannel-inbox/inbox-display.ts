import type { OmnichannelConversationListItem } from "@/lib/omnichannel-inbox/queries";
import type { OmnichannelInboxFilter } from "@/lib/omnichannel-inbox/queries";
import { countWhatsappConversationsByAiState } from "@/lib/omnichannel-inbox/inbox-ai-filters";
import { getOutgoingBubbleDeliveryStatusLabel } from "@/lib/communication/messaging/delivery";
import type { MessageDeliveryStatus } from "@/types/omnichannel-inbox";
import { getDesklabsAvatarInitials, getDesklabsAvatarColorClass } from "@/components/ui/desklabs-avatar";

export type OmnichannelFilterCounts = Record<OmnichannelInboxFilter, number>;

export function buildOmnichannelFilterCounts(
  conversations: OmnichannelConversationListItem[],
  currentUserId: string,
): OmnichannelFilterCounts {
  return {
    all: conversations.length,
    unread: conversations.filter((item) => item.unreadCount > 0).length,
    whatsapp: conversations.filter((item) => item.channel === "whatsapp").length,
    instagram: conversations.filter((item) => item.channel === "instagram").length,
    facebook: conversations.filter((item) => item.channel === "facebook").length,
    unassigned: conversations.filter((item) => !item.assignedUserId).length,
    mine: conversations.filter((item) => item.assignedUserId === currentUserId)
      .length,
    hot_leads: conversations.filter((item) => item.status === "following_up").length,
    ready_for_human: countWhatsappConversationsByAiState(
      conversations,
      "READY_FOR_HUMAN",
    ),
    ai_active: countWhatsappConversationsByAiState(conversations, "AI_ACTIVE"),
    human_assisted: countWhatsappConversationsByAiState(
      conversations,
      "HUMAN_ASSISTED",
    ),
    human_only: countWhatsappConversationsByAiState(conversations, "HUMAN_ONLY"),
  };
}

export function getConversationDisplayName(conversation: {
  customerName: string;
  customerUsername: string | null;
  channel?: OmnichannelConversationListItem["channel"];
}) {
  const name = conversation.customerName?.trim();
  const username = conversation.customerUsername?.trim();

  if (conversation.channel === "whatsapp") {
    return name || username || "Kontak WhatsApp";
  }

  if (username) {
    const formatted = username.startsWith("@") ? username : `@${username}`;
    if (!name || name.startsWith("Customer ") || name === "Unknown Customer") {
      return formatted;
    }
  }

  if (name) {
    return name;
  }

  return "Customer";
}

export function formatInboxRelativeTime(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) {
    return "Baru saja";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} mnt lalu`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} jam lalu`;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export function formatInboxActiveLabel(value: string | null) {
  const relative = formatInboxRelativeTime(value);
  if (relative === "Baru saja") {
    return "Aktif baru saja";
  }

  return `Aktif ${relative}`;
}

export function formatInboxMessageTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

/** Short clock time for message bubble metadata (e.g. 09:31). */
export function formatInboxMessageBubbleTime(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export function formatOutgoingBubbleMetadataLine(
  createdAt: string | null | undefined,
  deliveryStatus: MessageDeliveryStatus | null | undefined,
  options?: { isOptimistic?: boolean },
): string {
  const time = formatInboxMessageBubbleTime(createdAt);
  const status = getOutgoingBubbleDeliveryStatusLabel(deliveryStatus, options);

  if (time && status) {
    return `${time} • ${status}`;
  }

  return time ?? status ?? "";
}

export const getConversationAvatarInitials = getDesklabsAvatarInitials;
export const getConversationAvatarColor = getDesklabsAvatarColorClass;

export function filterConversationsBySearch(
  conversations: OmnichannelConversationListItem[],
  query: string,
) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return conversations;
  }

  const digitsOnly = normalized.replace(/\D/g, "");

  return conversations.filter((conversation) => {
    const displayName = getConversationDisplayName(conversation).toLowerCase();
    const customerName = conversation.customerName.toLowerCase();
    const username = conversation.customerUsername?.toLowerCase() ?? "";
    const preview = conversation.lastMessagePreview?.toLowerCase() ?? "";

    if (
      displayName.includes(normalized) ||
      customerName.includes(normalized) ||
      username.includes(normalized) ||
      preview.includes(normalized)
    ) {
      return true;
    }

    if (digitsOnly.length >= 3) {
      const searchableDigits = `${displayName} ${username} ${preview}`.replace(
        /\D/g,
        "",
      );
      return searchableDigits.includes(digitsOnly);
    }

    return false;
  });
}

type InboxMessageForNotes = {
  direction: string;
  message_text: string | null;
};

export function buildInboxConvertNotesDefault(
  messages: InboxMessageForNotes[],
  fallbackPreview?: string | null,
) {
  const incoming = messages
    .filter((message) => message.direction === "incoming")
    .map((message) => message.message_text?.trim())
    .filter((text): text is string => Boolean(text));

  if (incoming.length === 0) {
    return fallbackPreview?.trim() ?? "";
  }

  const first = incoming[0];
  const last = incoming[incoming.length - 1];

  if (incoming.length === 1 || first === last) {
    return first;
  }

  return `First message: ${first}\n\nLatest message: ${last}`;
}
