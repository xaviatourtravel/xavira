export type ActivityType =
  | "conversation_started"
  | "customer_inquiry"
  | "internal_note_added"
  | "quotation_sent"
  | "ai_summary_updated"
  | "assigned"
  | "transferred"
  | "status_changed"
  | "booking_created"
  | "payment_received"
  | "journey_updated"
  | "lead_created"
  | "lead_assigned"
  | "temperature_change"
  | "follow_up_completed"
  | "note_added"
  | "ai_follow_up_generated"
  | "ai_recommendation_generated"
  | "payment_recorded"
  | "activity";

export type ActivityActor = {
  id: string;
  name: string;
};

/** Canonical activity/timeline event shared across modules. */
export type Activity = {
  id: string;
  type: ActivityType;
  subjectId: string;
  title: string;
  description?: string;
  actor?: ActivityActor;
  occurredAt: string;
  metadata?: Record<string, unknown>;
};

/** Normalized CRM activity row shape. */
export type ActivityRow = {
  id: string;
  activity_type: string;
  title: string | null;
  body: string | null;
  occurred_at: string;
  metadata?: Record<string, unknown> | null;
  actorName: string | null;
};
