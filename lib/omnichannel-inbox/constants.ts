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
  "interested",
  "hot_lead",
  "booking_process",
  "paid",
  "lost",
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
  interested: "Interested",
  hot_lead: "Hot Lead",
  booking_process: "Booking Process",
  paid: "Paid",
  lost: "Lost",
};

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
