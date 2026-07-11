/** Supported timeline event categories — maps to Aurora modules. */
export type TimelineEventCategory =
  | "conversation"
  | "ai"
  | "booking"
  | "finance"
  | "journey"
  | "assignment"
  | "internal_note"
  | "customer";

export type TimelineActor = {
  id: string;
  name: string;
};

/** Future-ready timeline event — reusable across Inbox, CRM, and Customer 360. */
export type TimelineEvent = {
  id: string;
  type: string;
  title: string;
  description?: string;
  timestamp: string;
  actor?: TimelineActor;
  metadata?: Record<string, unknown>;
};

export type TimelineDateGroupId = "today" | "yesterday" | "last_week";

export type TimelineDateGroup = {
  id: TimelineDateGroupId;
  label: string;
  events: TimelineEvent[];
};

export type TimelineLabels = {
  today: string;
  yesterday: string;
  lastWeek: string;
};

export type TimelineEventMeta = {
  category: TimelineEventCategory;
  moduleLabel: string;
};

/** Conversation-scoped alias used by inbox context panel mocks. */
export type CustomerTimelineEvent = TimelineEvent & {
  subjectId: string;
};

export type CustomerTimelineDateGroup = TimelineDateGroup;
export type CustomerTimelineDateGroupId = TimelineDateGroupId;
export type CustomerTimelineLabels = TimelineLabels;
