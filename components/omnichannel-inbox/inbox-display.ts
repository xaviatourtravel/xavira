import type { OmnichannelConversationListItem } from "@/lib/omnichannel-inbox/queries";
import type { OmnichannelInboxFilter } from "@/lib/omnichannel-inbox/queries";

export type OmnichannelFilterCounts = Record<OmnichannelInboxFilter, number>;

export function buildOmnichannelFilterCounts(
  conversations: OmnichannelConversationListItem[],
  currentUserId: string,
): OmnichannelFilterCounts {
  return {
    all: conversations.length,
    instagram: conversations.filter((item) => item.channel === "instagram").length,
    facebook: conversations.filter((item) => item.channel === "facebook").length,
    unassigned: conversations.filter((item) => !item.assignedUserId).length,
    mine: conversations.filter((item) => item.assignedUserId === currentUserId)
      .length,
    hot_leads: conversations.filter((item) => item.status === "hot_lead").length,
  };
}

export function getConversationDisplayName(conversation: {
  customerName: string;
  customerUsername: string | null;
}) {
  const username = conversation.customerUsername?.trim();
  const name = conversation.customerName?.trim();

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
    return "—";
  }

  const date = new Date(value);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export function formatInboxMessageTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function getConversationAvatarInitials(name: string) {
  const parts = name.replace(/^@/, "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

const AVATAR_COLORS = [
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
] as const;

export function getConversationAvatarColor(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = seed.charCodeAt(index) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

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
