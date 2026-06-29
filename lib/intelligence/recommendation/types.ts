export const RECOMMENDATION_ACTIONS = [
  "suggested_reply",
  "follow_up",
  "quotation",
  "create_lead",
  "schedule_call",
] as const;

export type RecommendationAction = (typeof RECOMMENDATION_ACTIONS)[number];

export type Recommendation = {
  action: RecommendationAction;
  label: string;
  priority: "primary" | "secondary";
  content: string | null;
  rationale: string | null;
};

export type RecommendationSet = {
  primary: Recommendation | null;
  items: Recommendation[];
};

export const RECOMMENDATION_LABELS: Record<RecommendationAction, string> = {
  suggested_reply: "Suggested Reply",
  follow_up: "Follow Up",
  quotation: "Quotation",
  create_lead: "Create Lead",
  schedule_call: "Schedule Call",
};
