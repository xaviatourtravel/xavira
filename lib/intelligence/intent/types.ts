export const CUSTOMER_INTENTS = [
  "browsing",
  "price_inquiry",
  "ready_to_buy",
  "complaint",
  "support",
  "booking",
  "cancellation",
] as const;

export type CustomerIntent = (typeof CUSTOMER_INTENTS)[number];

export type IntentAnalysis = {
  primary: CustomerIntent;
  label: string;
  confidence: import("@/lib/intelligence/types/common").ConfidenceLevel;
  rationale: string | null;
};

export const INTENT_LABELS: Record<CustomerIntent, string> = {
  browsing: "Browsing",
  price_inquiry: "Price Inquiry",
  ready_to_buy: "Ready To Buy",
  complaint: "Complaint",
  support: "Support",
  booking: "Booking",
  cancellation: "Cancellation",
};
