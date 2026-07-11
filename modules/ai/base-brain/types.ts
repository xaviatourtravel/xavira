export type BaseBrainPolicySection =
  | "role"
  | "communication"
  | "clarification"
  | "known_unknown"
  | "fallback"
  | "human_control"
  | "conversation"
  | "handoff"
  | "claims";

export type BusinessBrainCompleteness = "empty" | "partial" | "complete";

export type IntentFallbackStrategy =
  | "general_inquiry"
  | "product_inquiry"
  | "pricing_inquiry"
  | "availability_inquiry"
  | "schedule_inquiry"
  | "booking_request"
  | "payment_inquiry"
  | "complaint"
  | "refund_inquiry"
  | "human_request"
  | "unsupported_inquiry"
  | "unknown";
