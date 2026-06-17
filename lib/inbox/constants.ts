import type { Database } from "@/types/database";

export type InboxSource = Database["public"]["Enums"]["inbox_source"];
export type InboxStatus = Database["public"]["Enums"]["inbox_status"];

export const INBOX_SOURCES = ["instagram", "facebook"] as const satisfies ReadonlyArray<InboxSource>;

export const INBOX_STATUSES = [
  "new",
  "qualified",
  "converted",
  "closed",
] as const satisfies ReadonlyArray<InboxStatus>;

const INBOX_SOURCE_LABELS: Record<InboxSource, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
};

const INBOX_STATUS_LABELS: Record<InboxStatus, string> = {
  new: "New",
  qualified: "Qualified",
  converted: "Converted",
  closed: "Closed",
};

export function isInboxSource(value: string): value is InboxSource {
  return INBOX_SOURCES.includes(value as InboxSource);
}

export function isInboxStatus(value: string): value is InboxStatus {
  return INBOX_STATUSES.includes(value as InboxStatus);
}

export function parseInboxSource(value: string): InboxSource | null {
  const trimmed = value.trim();
  return isInboxSource(trimmed) ? trimmed : null;
}

export function parseInboxStatus(value: string): InboxStatus | null {
  const trimmed = value.trim();
  return isInboxStatus(trimmed) ? trimmed : null;
}

export function formatInboxSourceLabel(source: InboxSource) {
  return INBOX_SOURCE_LABELS[source];
}

export function formatInboxStatusLabel(status: InboxStatus) {
  return INBOX_STATUS_LABELS[status];
}

export type InboxConversationMetadata = {
  external_thread_id?: string | null;
  whatsapp_number?: string | null;
  channel?: "instagram_dm" | "facebook_dm" | null;
  ai_summary?: string | null;
  ai_qualification?: Record<string, unknown> | null;
};

export function getDefaultInboxMetadata(source: InboxSource): InboxConversationMetadata {
  return {
    channel: source === "instagram" ? "instagram_dm" : "facebook_dm",
    external_thread_id: null,
    whatsapp_number: null,
    ai_summary: null,
    ai_qualification: null,
  };
}
