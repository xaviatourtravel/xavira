import { formatInboxRelativeTime } from "@/components/omnichannel-inbox/inbox-display";
import type { RuleBasedIntelligence } from "@/lib/communication/intelligence/rule-based-intelligence";
import type { PassportJourneyStage, PassportTimelineEntry } from "@/lib/customer-passport/types";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import type { OmnichannelConversationStatus } from "@/types/omnichannel-inbox";

export const INSPECTOR_JOURNEY_STAGES = [
  "lead",
  "quotation",
  "booking",
  "paid",
  "departure",
] as const;

export type InspectorJourneyStage = (typeof INSPECTOR_JOURNEY_STAGES)[number];

export const INSPECTOR_STATUS_BADGE_LABELS: Record<InspectorJourneyStage, string> = {
  lead: "Lead",
  quotation: "Quotation Sent",
  booking: "Booking Confirmed",
  paid: "Paid",
  departure: "Departure Ready",
};

export function getInspectorJourneyStatusLabel(stage: InspectorJourneyStage) {
  return INSPECTOR_STATUS_BADGE_LABELS[stage];
}

export function mapPassportStageToInspectorJourney(
  stage: PassportJourneyStage,
): InspectorJourneyStage {
  switch (stage) {
    case "awareness":
    case "interest":
      return "lead";
    case "planning":
    case "quotation":
      return "quotation";
    case "negotiation":
      return "booking";
    case "dp":
      return "paid";
    case "trip":
    case "review":
    case "repeat":
      return "departure";
    default:
      return "lead";
  }
}

function hoursSince(timestamp: string | null) {
  if (!timestamp) {
    return null;
  }

  const diffMs = Date.now() - new Date(timestamp).getTime();
  if (diffMs < 0) {
    return 0;
  }

  return Math.floor(diffMs / 3_600_000);
}

export function buildInspectorInsights(
  conversation: OmnichannelConversationDetail,
  intel: RuleBasedIntelligence,
): string[] {
  const bullets: string[] = [];

  if (intel.entities.destination) {
    bullets.push(`Pelanggan menanyakan ${intel.entities.destination}.`);
  } else if (conversation.leadContext?.packageInterest?.trim()) {
    bullets.push(
      `Pelanggan tertarik ${conversation.leadContext.packageInterest.trim()}.`,
    );
  }

  const lastOutgoing = [...conversation.messages]
    .reverse()
    .find((message) => message.direction === "outgoing");

  if (lastOutgoing) {
    const hours = hoursSince(lastOutgoing.created_at);
    if (hours != null) {
      if (hours < 1) {
        bullets.push("Balasan terakhir dikirim kurang dari satu jam lalu.");
      } else {
        bullets.push(`Balasan terakhir ${hours} jam lalu.`);
      }
    }
  } else if (conversation.lastMessageAt) {
    bullets.push(
      `Aktivitas terakhir ${formatInboxRelativeTime(conversation.lastMessageAt).toLowerCase()}.`,
    );
  }

  if (intel.priority === "high" && conversation.leadId) {
    bullets.push("Probabilitas konversi tinggi.");
  } else if (conversation.unreadCount > 0) {
    bullets.push("Ada pesan belum dibaca dari pelanggan.");
  }

  if (intel.nextActionLabel) {
    bullets.push(`${intel.nextActionLabel}.`);
  } else if (intel.entities.latestQuestion) {
    bullets.push("Balas pertanyaan terakhir pelanggan hari ini.");
  }

  if (bullets.length === 0 && intel.summary) {
    bullets.push(intel.summary);
  }

  return bullets.slice(0, 4);
}

export function formatInspectorTimelineWhen(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / 86_400_000,
  );

  if (diffDays === 0) {
    return "Hari ini";
  }

  if (diffDays === 1) {
    return "Kemarin";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function simplifyTimelineLabel(entry: PassportTimelineEntry) {
  if (entry.kind === "note") {
    return "Catatan internal ditambahkan";
  }

  if (entry.kind === "assignment") {
    return "Penugasan diperbarui";
  }

  if (entry.kind === "message") {
    return entry.label === "Customer message"
      ? "Pesan masuk"
      : "Balasan dikirim";
  }

  return entry.label;
}

export function pickInspectorTimelineEntries(
  entries: PassportTimelineEntry[],
  limit = 4,
) {
  const prioritized = [
    ...entries.filter((entry) => entry.kind !== "message"),
    ...entries.filter((entry) => entry.kind === "message"),
  ];

  const seen = new Set<string>();
  const unique: PassportTimelineEntry[] = [];

  for (const entry of prioritized) {
    const key = `${entry.kind}-${simplifyTimelineLabel(entry)}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(entry);

    if (unique.length >= limit) {
      break;
    }
  }

  return unique.map((entry) => ({
    id: entry.id,
    when: formatInspectorTimelineWhen(entry.timestamp),
    label: simplifyTimelineLabel(entry),
  }));
}

export function resolveInspectorPaymentStatus(
  conversationStatus: OmnichannelConversationStatus,
  leadStatus?: string | null,
) {
  if (conversationStatus === "waiting_dp") {
    return "Menunggu DP";
  }

  if (conversationStatus === "closed_won" || leadStatus === "won") {
    return "Lunas";
  }

  if (conversationStatus === "quotation_sent" || leadStatus === "proposal") {
    return "Quotation terkirim";
  }

  if (leadStatus === "negotiation") {
    return "Negosiasi";
  }

  return "Belum ada pembayaran";
}

export function hasInspectorBookingContext(
  conversation: OmnichannelConversationDetail,
) {
  const lead = conversation.leadContext;

  return Boolean(
    lead?.packageInterest?.trim() ||
      lead?.travelDatePreference?.trim() ||
      conversation.status === "quotation_sent" ||
      conversation.status === "waiting_dp" ||
      conversation.status === "closed_won",
  );
}
