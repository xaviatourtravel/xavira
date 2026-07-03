export const BRAIN_BEHAVIOR_TYPES = [
  "ALWAYS_DO",
  "NEVER_DO",
  "HANDOVER_RULE",
  "REPLY_STYLE",
  "QUALIFICATION_RULE",
] as const;

export type BrainBehaviorType = (typeof BRAIN_BEHAVIOR_TYPES)[number];

export const BRAIN_BEHAVIOR_TYPE_LABELS: Record<BrainBehaviorType, string> = {
  ALWAYS_DO: "Always Do",
  NEVER_DO: "Never Do",
  HANDOVER_RULE: "Handover Rules",
  REPLY_STYLE: "Reply Style",
  QUALIFICATION_RULE: "Qualification Rules",
};

export const BRAIN_BEHAVIOR_TYPE_DESCRIPTIONS: Record<BrainBehaviorType, string> = {
  ALWAYS_DO: "Rules AI should always follow when talking to customers.",
  NEVER_DO: "Hard limits on what AI must never do.",
  HANDOVER_RULE: "When to hand conversations to humans.",
  REPLY_STYLE: "How AI should sound in every reply.",
  QUALIFICATION_RULE: "Required questions before recommending packages.",
};

export const RULE_BASED_BEHAVIOR_TYPES = [
  "ALWAYS_DO",
  "NEVER_DO",
  "HANDOVER_RULE",
] as const;

export type RuleBasedBehaviorType = (typeof RULE_BASED_BEHAVIOR_TYPES)[number];

export const CONFIG_BEHAVIOR_TYPES = ["REPLY_STYLE", "QUALIFICATION_RULE"] as const;

export type ConfigBehaviorType = (typeof CONFIG_BEHAVIOR_TYPES)[number];

export const HANDOVER_TRIGGER_INTENTS = [
  "negotiation",
  "payment_proof",
  "complaint",
  "refund",
  "phone_call_request",
  "custom_private_trip",
] as const;

export type HandoverTriggerIntent = (typeof HANDOVER_TRIGGER_INTENTS)[number];

export const HANDOVER_TRIGGER_LABELS: Record<HandoverTriggerIntent, string> = {
  negotiation: "Negotiation",
  payment_proof: "Payment proof",
  complaint: "Complaint",
  refund: "Refund",
  phone_call_request: "Phone call request",
  custom_private_trip: "Custom private trip",
};

export const HANDOVER_ASSIGN_ROLES = [
  "Sales",
  "Finance",
  "Supervisor",
  "Senior Consultant",
] as const;

export type HandoverAssignRole = (typeof HANDOVER_ASSIGN_ROLES)[number];

export const DEFAULT_HANDOFF_MESSAGE =
  "Baik Kak, tim kami akan segera membantu agar penjelasannya lebih nyaman.";

export const BEHAVIOR_REPLY_LENGTH_OPTIONS = ["short", "medium", "detailed"] as const;
export type BehaviorReplyLength = (typeof BEHAVIOR_REPLY_LENGTH_OPTIONS)[number];

export const BEHAVIOR_EMOJI_USAGE_OPTIONS = ["never", "minimal", "natural", "frequent"] as const;
export type BehaviorEmojiUsage = (typeof BEHAVIOR_EMOJI_USAGE_OPTIONS)[number];

export const CTA_STYLE_OPTIONS = ["soft", "direct", "consultative"] as const;
export type BehaviorCtaStyle = (typeof CTA_STYLE_OPTIONS)[number];

export const LANGUAGE_STYLE_OPTIONS = ["indonesian", "english", "mixed"] as const;
export type BehaviorLanguageStyle = (typeof LANGUAGE_STYLE_OPTIONS)[number];

export type ReplyStyleConfig = {
  useKak: boolean;
  avoidRepeatedGreeting: boolean;
  maxReplyLength: BehaviorReplyLength;
  emojiUsage: BehaviorEmojiUsage;
  ctaStyle: BehaviorCtaStyle;
  languageStyle: BehaviorLanguageStyle;
};

export type QualificationConfig = {
  destination: boolean;
  departureMonth: boolean;
  passengerCount: boolean;
  budget: boolean;
  privateOrGroup: boolean;
  specialNeeds: boolean;
};

export type HandoverRuleConfig = {
  triggerIntent: HandoverTriggerIntent;
  assignToRole: HandoverAssignRole;
  handoffMessage: string;
};

export type BrainBehaviorRecord = {
  id: string;
  businessBrainId: string;
  type: BrainBehaviorType;
  name: string;
  description: string;
  config: ReplyStyleConfig | QualificationConfig | HandoverRuleConfig | Record<string, never>;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BrainBehaviorListItem = {
  id: string;
  type: BrainBehaviorType;
  name: string;
  description: string;
  enabled: boolean;
  updatedAt: string;
};

export const DEFAULT_REPLY_STYLE_CONFIG: ReplyStyleConfig = {
  useKak: true,
  avoidRepeatedGreeting: true,
  maxReplyLength: "medium",
  emojiUsage: "minimal",
  ctaStyle: "consultative",
  languageStyle: "mixed",
};

export const DEFAULT_QUALIFICATION_CONFIG: QualificationConfig = {
  destination: true,
  departureMonth: true,
  passengerCount: true,
  budget: true,
  privateOrGroup: false,
  specialNeeds: false,
};

export const ALWAYS_DO_EXAMPLES = [
  "Ask departure month",
  "Ask passenger count",
  "Recommend suitable package",
  "Offer brochure",
  "Mention Muslim-friendly arrangement",
  "Confirm budget range",
] as const;

export const NEVER_DO_EXAMPLES = [
  "Never negotiate price",
  "Never promise seat availability",
  "Never mention competitors",
  "Never mention Desklabs",
  "Never invent itinerary",
  "Never confirm booking without human",
] as const;

export const HANDOVER_EXAMPLES: Array<{
  triggerIntent: HandoverTriggerIntent;
  assignToRole: HandoverAssignRole;
  name: string;
}> = [
  { name: "Negotiation → Sales", triggerIntent: "negotiation", assignToRole: "Sales" },
  { name: "Payment proof → Finance", triggerIntent: "payment_proof", assignToRole: "Finance" },
  { name: "Complaint → Supervisor", triggerIntent: "complaint", assignToRole: "Supervisor" },
  { name: "Refund → Supervisor", triggerIntent: "refund", assignToRole: "Supervisor" },
  {
    name: "Phone call request → Sales",
    triggerIntent: "phone_call_request",
    assignToRole: "Sales",
  },
  {
    name: "Custom private trip → Senior Consultant",
    triggerIntent: "custom_private_trip",
    assignToRole: "Senior Consultant",
  },
];

export const QUALIFICATION_FIELD_LABELS: Record<keyof QualificationConfig, string> = {
  destination: "Destination",
  departureMonth: "Departure Month",
  passengerCount: "Passenger Count",
  budget: "Budget",
  privateOrGroup: "Private / Group",
  specialNeeds: "Special Needs",
};
