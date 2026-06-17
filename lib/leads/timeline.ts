import {
  LEAD_INTELLIGENCE_CACHE_KEY,
  type LeadIntelligenceCacheEntry,
} from "@/lib/ai/lead-intelligence";

export const LEAD_TIMELINE_EVENT_TYPES = [
  "lead_created",
  "lead_assigned",
  "status_change",
  "temperature_change",
  "follow_up_completed",
  "note_added",
  "ai_follow_up_generated",
  "ai_recommendation_generated",
  "booking_created",
  "payment_recorded",
] as const;

export type LeadTimelineEventType =
  (typeof LEAD_TIMELINE_EVENT_TYPES)[number];

export type LeadTimelineActivitySource = {
  id: string;
  activity_type: string;
  title: string | null;
  body: string | null;
  occurred_at: string;
  metadata?: Record<string, unknown> | null;
  actorName: string | null;
};

export type LeadTimelineEvent = {
  id: string;
  eventType: LeadTimelineEventType;
  occurredAt: string;
  userName: string;
  description: string;
  details: string | null;
  source: "activity" | "lead" | "metadata";
};

export type LeadTimelineBuildInput = {
  leadId: string;
  leadCreatedAt: string;
  leadMetadata: unknown;
  activities: LeadTimelineActivitySource[];
};

const LEAD_CREATED_PATTERNS = [/^lead dibuat$/i, /^lead dari inbox$/i];
const FOLLOW_UP_COMPLETED_PATTERNS = [
  /^follow up selesai$/i,
  /^follow up ditandai selesai$/i,
];
const AI_RECOMMENDATION_PATTERNS = [
  /^follow up dibuat dari ai recommendation$/i,
];
const BOOKING_CREATED_PATTERNS = [/^booking dibuat$/i];
const PAYMENT_PATTERNS = [/^payment /i];
const ASSIGNMENT_PATTERNS = [/assign|di-assign|ditugaskan/i];
const TEMPERATURE_PATTERNS = [/temperature|suhu lead|suhu:/i];

function matchesPattern(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim();
}

export function getLeadTimelineEventTypeLabel(
  eventType: LeadTimelineEventType,
): string {
  switch (eventType) {
    case "lead_created":
      return "Lead Dibuat";
    case "lead_assigned":
      return "Lead Di-assign";
    case "status_change":
      return "Perubahan Status";
    case "temperature_change":
      return "Perubahan Suhu";
    case "follow_up_completed":
      return "Follow Up Selesai";
    case "note_added":
      return "Catatan Ditambahkan";
    case "ai_follow_up_generated":
      return "AI Follow Up Dibuat";
    case "ai_recommendation_generated":
      return "Rekomendasi AI";
    case "booking_created":
      return "Booking Dibuat";
    case "payment_recorded":
      return "Pembayaran Tercatat";
    default:
      return "Aktivitas";
  }
}

export function getLeadTimelineEventBadgeClassName(
  eventType: LeadTimelineEventType,
): string {
  switch (eventType) {
    case "lead_created":
      return "bg-slate-100 text-slate-800";
    case "lead_assigned":
      return "bg-violet-100 text-violet-800";
    case "status_change":
      return "bg-sky-100 text-sky-800";
    case "temperature_change":
      return "bg-orange-100 text-orange-800";
    case "follow_up_completed":
      return "bg-indigo-100 text-indigo-800";
    case "note_added":
      return "bg-zinc-100 text-zinc-700";
    case "ai_follow_up_generated":
      return "bg-blue-100 text-blue-800";
    case "ai_recommendation_generated":
      return "bg-cyan-100 text-cyan-800";
    case "booking_created":
      return "bg-emerald-100 text-emerald-800";
    case "payment_recorded":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function getLeadTimelineEventDotClassName(
  eventType: LeadTimelineEventType,
): string {
  switch (eventType) {
    case "lead_created":
      return "bg-slate-500";
    case "lead_assigned":
      return "bg-violet-500";
    case "status_change":
      return "bg-sky-500";
    case "temperature_change":
      return "bg-orange-500";
    case "follow_up_completed":
      return "bg-indigo-500";
    case "note_added":
      return "bg-zinc-500";
    case "ai_follow_up_generated":
      return "bg-blue-500";
    case "ai_recommendation_generated":
      return "bg-cyan-500";
    case "booking_created":
      return "bg-emerald-500";
    case "payment_recorded":
      return "bg-amber-500";
    default:
      return "bg-slate-500";
  }
}

export function classifyTimelineEventType(
  activity: Pick<
    LeadTimelineActivitySource,
    "activity_type" | "title" | "body" | "metadata"
  >,
): LeadTimelineEventType {
  const title = normalizeText(activity.title);
  const body = normalizeText(activity.body);
  const combined = `${title} ${body}`;
  const activityType = activity.activity_type;

  if (activityType === "follow_up_generated") {
    return "ai_follow_up_generated";
  }

  if (activityType === "status_change") {
    return "status_change";
  }

  if (activityType === "score_update") {
    return "ai_recommendation_generated";
  }

  if (matchesPattern(title, LEAD_CREATED_PATTERNS)) {
    return "lead_created";
  }

  if (matchesPattern(title, FOLLOW_UP_COMPLETED_PATTERNS)) {
    return "follow_up_completed";
  }

  if (matchesPattern(title, AI_RECOMMENDATION_PATTERNS)) {
    return "ai_recommendation_generated";
  }

  if (
    matchesPattern(title, [/^draf pesan:/i]) ||
    activity.metadata?.source === "sales_assistant"
  ) {
    return "ai_follow_up_generated";
  }

  if (matchesPattern(title, BOOKING_CREATED_PATTERNS)) {
    return "booking_created";
  }

  if (matchesPattern(title, PAYMENT_PATTERNS)) {
    return "payment_recorded";
  }

  if (matchesPattern(combined, ASSIGNMENT_PATTERNS)) {
    return "lead_assigned";
  }

  if (matchesPattern(combined, TEMPERATURE_PATTERNS)) {
    return "temperature_change";
  }

  return "note_added";
}

function getTimelineDescription(
  activity: LeadTimelineActivitySource,
  eventType: LeadTimelineEventType,
) {
  const title = normalizeText(activity.title);

  if (title) {
    return title;
  }

  return getLeadTimelineEventTypeLabel(eventType);
}

function activityToTimelineEvent(
  activity: LeadTimelineActivitySource,
): LeadTimelineEvent {
  const eventType = classifyTimelineEventType(activity);

  return {
    id: activity.id,
    eventType,
    occurredAt: activity.occurred_at,
    userName: activity.actorName?.trim() || "Sistem",
    description: getTimelineDescription(activity, eventType),
    details: normalizeText(activity.body) || null,
    source: "activity",
  };
}

function hasLeadCreatedEvent(events: LeadTimelineEvent[]) {
  return events.some((event) => event.eventType === "lead_created");
}

function buildLeadCreatedEvent(
  leadId: string,
  leadCreatedAt: string,
): LeadTimelineEvent {
  return {
    id: `lead-created-${leadId}`,
    eventType: "lead_created",
    occurredAt: leadCreatedAt,
    userName: "Sistem",
    description: "Lead dibuat",
    details: null,
    source: "lead",
  };
}

function buildIntelligenceTimelineEvent(
  leadId: string,
  metadata: unknown,
): LeadTimelineEvent | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const cache = (metadata as Record<string, unknown>)[LEAD_INTELLIGENCE_CACHE_KEY];

  if (!cache || typeof cache !== "object") {
    return null;
  }

  const entry = cache as LeadIntelligenceCacheEntry;

  if (!entry.generatedAt) {
    return null;
  }

  const details = [
    entry.summary,
    entry.nextBestAction
      ? `Aksi berikutnya: ${entry.nextBestAction}`
      : null,
    typeof entry.score === "number" ? `Skor: ${entry.score}` : null,
    entry.reasoning?.length
      ? `Alasan:\n${entry.reasoning.map((reason) => `- ${reason}`).join("\n")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    id: `ai-intelligence-${leadId}-${entry.fingerprint ?? entry.generatedAt}`,
    eventType: "ai_recommendation_generated",
    occurredAt: entry.generatedAt,
    userName: "AI",
    description: entry.nextBestAction
      ? `Rekomendasi AI: ${entry.nextBestAction}`
      : "Rekomendasi AI dihasilkan",
    details: details || null,
    source: "metadata",
  };
}

function sortTimelineEvents(events: LeadTimelineEvent[]) {
  return [...events].sort(
    (left, right) =>
      new Date(right.occurredAt).getTime() -
      new Date(left.occurredAt).getTime(),
  );
}

export function buildLeadTimeline(
  input: LeadTimelineBuildInput,
): LeadTimelineEvent[] {
  const activityEvents = input.activities.map(activityToTimelineEvent);
  const supplementalEvents: LeadTimelineEvent[] = [];

  if (!hasLeadCreatedEvent(activityEvents)) {
    supplementalEvents.push(
      buildLeadCreatedEvent(input.leadId, input.leadCreatedAt),
    );
  }

  const intelligenceEvent = buildIntelligenceTimelineEvent(
    input.leadId,
    input.leadMetadata,
  );

  if (intelligenceEvent) {
    const hasMatchingRecommendation = activityEvents.some((event) => {
      if (event.eventType !== "ai_recommendation_generated") {
        return false;
      }

      const timeDelta = Math.abs(
        new Date(event.occurredAt).getTime() -
          new Date(intelligenceEvent.occurredAt).getTime(),
      );

      return timeDelta < 60_000;
    });

    if (!hasMatchingRecommendation) {
      supplementalEvents.push(intelligenceEvent);
    }
  }

  const seenIds = new Set<string>();
  const mergedEvents: LeadTimelineEvent[] = [];

  for (const event of [...activityEvents, ...supplementalEvents]) {
    if (seenIds.has(event.id)) {
      continue;
    }

    seenIds.add(event.id);
    mergedEvents.push(event);
  }

  return sortTimelineEvents(mergedEvents);
}

export function formatLeadTimelineDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function resolveLeadActivityActorName(
  profiles:
    | {
        full_name: string | null;
      }
    | {
        full_name: string | null;
      }[]
    | null,
) {
  if (!profiles) {
    return null;
  }

  if (Array.isArray(profiles)) {
    return profiles[0]?.full_name ?? null;
  }

  return profiles.full_name;
}
