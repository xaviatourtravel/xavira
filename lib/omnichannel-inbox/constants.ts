import type {
  OmnichannelChannel,
  OmnichannelConversationStatus,
  OmnichannelMessageDirection,
} from "@/types/omnichannel-inbox";

export const OMNICHANNEL_CHANNELS = [
  "instagram",
  "facebook",
  "whatsapp",
] as const satisfies ReadonlyArray<OmnichannelChannel>;

export const OMNICHANNEL_CONVERSATION_STATUSES = [
  "new",
  "following_up",
  "quotation_sent",
  "waiting_dp",
  "closed_won",
  "closed_lost",
] as const satisfies ReadonlyArray<OmnichannelConversationStatus>;

export const OMNICHANNEL_MESSAGE_DIRECTIONS = [
  "incoming",
  "outgoing",
] as const satisfies ReadonlyArray<OmnichannelMessageDirection>;

const CHANNEL_LABELS: Record<OmnichannelChannel, string> = {
  instagram: "Instagram DM",
  facebook: "Facebook Messenger",
  whatsapp: "WhatsApp",
};

const STATUS_LABELS: Record<OmnichannelConversationStatus, string> = {
  new: "New",
  following_up: "Following Up",
  quotation_sent: "Quotation Sent",
  waiting_dp: "Waiting DP",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

export const WORKSPACE_LABEL_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
] as const;

export function pickWorkspaceLabelColor(tag: string) {
  let hash = 0;
  for (let index = 0; index < tag.length; index += 1) {
    hash = tag.charCodeAt(index) + ((hash << 5) - hash);
  }
  return WORKSPACE_LABEL_COLORS[Math.abs(hash) % WORKSPACE_LABEL_COLORS.length];
}

export function isOmnichannelChannel(value: string): value is OmnichannelChannel {
  return OMNICHANNEL_CHANNELS.includes(value as OmnichannelChannel);
}

export function isOmnichannelConversationStatus(
  value: string,
): value is OmnichannelConversationStatus {
  return OMNICHANNEL_CONVERSATION_STATUSES.includes(
    value as OmnichannelConversationStatus,
  );
}

export function isOmnichannelMessageDirection(
  value: string,
): value is OmnichannelMessageDirection {
  return OMNICHANNEL_MESSAGE_DIRECTIONS.includes(
    value as OmnichannelMessageDirection,
  );
}

export function parseOmnichannelChannel(value: string): OmnichannelChannel | null {
  const trimmed = value.trim();
  return isOmnichannelChannel(trimmed) ? trimmed : null;
}

export function parseOmnichannelConversationStatus(
  value: string,
): OmnichannelConversationStatus | null {
  const trimmed = value.trim();
  return isOmnichannelConversationStatus(trimmed) ? trimmed : null;
}

export function parseOmnichannelMessageDirection(
  value: string,
): OmnichannelMessageDirection | null {
  const trimmed = value.trim();
  return isOmnichannelMessageDirection(trimmed) ? trimmed : null;
}

export function formatOmnichannelChannelLabel(channel: OmnichannelChannel) {
  return CHANNEL_LABELS[channel];
}

export function formatOmnichannelConversationStatusLabel(
  status: OmnichannelConversationStatus,
) {
  return STATUS_LABELS[status];
}
