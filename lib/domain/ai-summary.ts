export type AISummaryIntentLevel = "Low" | "Medium" | "High";

export type AISummaryTemperature = "Cold" | "Warm" | "Hot";

export type AISummaryMissingField =
  | "phone"
  | "travel date"
  | "pax"
  | "budget"
  | "package preference";

/** Canonical AI-generated customer summary. */
export type AISummary = {
  summary: string;
  destinationInterest: string | null;
  travelDateOrMonth: string | null;
  pax: number | null;
  budget: string | null;
  intentLevel: AISummaryIntentLevel;
  leadTemperature: AISummaryTemperature;
  missingFields: AISummaryMissingField[];
  nextBestAction: string;
  suggestedFollowUpMessage: string;
  insufficientData: boolean;
  generatedAt: string;
};

/** Handoff-oriented AI summary slice used during sales takeover. */
export type AISummaryHandoff = {
  handoffReason: string | null;
  destination: string | null;
  departure: string | null;
  passengerCount: string | null;
  budget: string | null;
  tripType: string | null;
  specialRequest: string | null;
  completionScore: number | null;
  aiConfidence: number | null;
  lastCustomerMessage: string | null;
  generatedSummary: string | null;
  hasQualificationData: boolean;
};
