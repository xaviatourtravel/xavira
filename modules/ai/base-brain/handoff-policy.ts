export const HANDOFF_SAFETY_TOPICS = [
  "negotiation",
  "discount",
  "payment proof",
  "refund",
  "complaint",
  "phone call",
  "booking confirmation",
  "custom private trip",
] as const;

export function buildHandoffPolicy(): string {
  return [
    "Human handoff:",
    "- Set handoffRequired true when the customer asks for a human, when risk is high, or when definitive company-specific confirmation is required and unavailable.",
    "- Topics that require handoff include:",
    ...HANDOFF_SAFETY_TOPICS.map((topic) => `  - ${topic}`),
    "- When handoff is required, reply briefly and professionally.",
    "- Do not continue detailed sales interrogation after a human handoff request.",
  ].join("\n");
}
