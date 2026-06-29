export const INTELLIGENCE_UI_CARD_TYPES = [
  "ai_summary",
  "extracted_information",
  "lead_score",
  "revenue_potential",
  "emotion",
  "intent",
  "recommendation",
  "memory",
  "timeline",
] as const;

export type IntelligenceUiCardType = (typeof INTELLIGENCE_UI_CARD_TYPES)[number];

export type IntelligenceUiCard = {
  type: IntelligenceUiCardType;
  title: string;
  order: number;
};

export const INTELLIGENCE_UI_CARDS: IntelligenceUiCard[] = [
  { type: "ai_summary", title: "AI Summary", order: 1 },
  { type: "extracted_information", title: "Extracted Information", order: 2 },
  { type: "lead_score", title: "Lead Score", order: 3 },
  { type: "revenue_potential", title: "Revenue Potential", order: 4 },
  { type: "emotion", title: "Emotion", order: 5 },
  { type: "intent", title: "Intent", order: 6 },
  { type: "recommendation", title: "Recommendation", order: 7 },
  { type: "memory", title: "Memory", order: 8 },
  { type: "timeline", title: "Timeline", order: 9 },
];

export function getIntelligenceUiCards(): IntelligenceUiCard[] {
  return [...INTELLIGENCE_UI_CARDS].sort((left, right) => left.order - right.order);
}
