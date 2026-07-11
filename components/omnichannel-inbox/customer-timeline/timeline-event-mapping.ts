import type { TimelineEventCategory, TimelineEventMeta } from "./types";

const TIMELINE_EVENT_CATEGORY_META: Record<TimelineEventCategory, TimelineEventMeta> = {
  conversation: { category: "conversation", moduleLabel: "Conversation" },
  ai: { category: "ai", moduleLabel: "AI" },
  booking: { category: "booking", moduleLabel: "Booking" },
  finance: { category: "finance", moduleLabel: "Finance" },
  journey: { category: "journey", moduleLabel: "Journey" },
  assignment: { category: "assignment", moduleLabel: "Assignment" },
  internal_note: { category: "internal_note", moduleLabel: "Internal Note" },
  customer: { category: "customer", moduleLabel: "Customer" },
};

const TIMELINE_EVENT_TYPE_CATEGORY: Record<string, TimelineEventCategory> = {
  conversation_started: "customer",
  customer_inquiry: "conversation",
  quotation_sent: "conversation",
  status_changed: "conversation",
  ai_summary_updated: "ai",
  booking_created: "booking",
  payment_received: "finance",
  assigned: "assignment",
  transferred: "assignment",
  journey_updated: "journey",
  internal_note_added: "internal_note",
};

export function resolveTimelineEventCategory(type: string): TimelineEventCategory {
  return TIMELINE_EVENT_TYPE_CATEGORY[type] ?? "conversation";
}

export function getTimelineEventMeta(type: string): TimelineEventMeta {
  const category = resolveTimelineEventCategory(type);
  return TIMELINE_EVENT_CATEGORY_META[category];
}

export function getTimelineModuleLabel(type: string): string {
  return getTimelineEventMeta(type).moduleLabel;
}
