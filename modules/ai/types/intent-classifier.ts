export const TRAVEL_WORKSPACE_INTENTS = [
  "GENERAL_GREETING",
  "PACKAGE_INQUIRY",
  "PACKAGE_RECOMMENDATION",
  "PRICE_INQUIRY",
  "ITINERARY_REQUEST",
  "BROCHURE_REQUEST",
  "VISA",
  "PAYMENT",
  "HALAL_FOOD",
  "HOTEL",
  "FLIGHT",
  "DEPARTURE_DATE",
  "BOOKING",
  "PAYMENT_PROOF",
  "NEGOTIATION",
  "REFUND",
  "COMPLAINT",
  "PHONE_CALL",
  "PRIVATE_TRIP",
  "BOOKING_CONFIRMATION",
  "UNKNOWN",
] as const;

export type TravelWorkspaceIntent = (typeof TRAVEL_WORKSPACE_INTENTS)[number];

export const HUMAN_REQUIRED_INTENTS = [
  "NEGOTIATION",
  "REFUND",
  "PAYMENT_PROOF",
  "COMPLAINT",
  "PHONE_CALL",
  "PRIVATE_TRIP",
  "BOOKING_CONFIRMATION",
] as const;

export type HumanRequiredIntent = (typeof HUMAN_REQUIRED_INTENTS)[number];

export type ConversationMessage = {
  sender: "customer" | "human" | "ai";
  text: string;
};

export type ClassifyIntentParams = {
  customerMessage: string;
  conversationHistory: ConversationMessage[];
};

export type IntentClassificationResult = {
  intent: string;
  confidence: number;
  requiresHuman: boolean;
  category: string;
};

export const INTENT_CATEGORIES: Record<TravelWorkspaceIntent, string> = {
  GENERAL_GREETING: "greeting",
  PACKAGE_INQUIRY: "package",
  PACKAGE_RECOMMENDATION: "package",
  PRICE_INQUIRY: "pricing",
  ITINERARY_REQUEST: "itinerary",
  BROCHURE_REQUEST: "document",
  VISA: "travel_detail",
  PAYMENT: "payment",
  HALAL_FOOD: "travel_detail",
  HOTEL: "travel_detail",
  FLIGHT: "travel_detail",
  DEPARTURE_DATE: "schedule",
  BOOKING: "booking",
  PAYMENT_PROOF: "payment",
  NEGOTIATION: "human_required",
  REFUND: "human_required",
  COMPLAINT: "human_required",
  PHONE_CALL: "human_required",
  PRIVATE_TRIP: "human_required",
  BOOKING_CONFIRMATION: "human_required",
  UNKNOWN: "unknown",
};

export const UNKNOWN_INTENT_MAX_CONFIDENCE = 0.49;
