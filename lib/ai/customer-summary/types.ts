export type CustomerAiIntentLevel = "Low" | "Medium" | "High";

export type CustomerAiTemperature = "Cold" | "Warm" | "Hot";

export type CustomerAiMissingField =
  | "phone"
  | "travel date"
  | "pax"
  | "budget"
  | "package preference";

export type CustomerAiSummary = {
  customerSummary: string;
  destinationInterest: string | null;
  travelDateOrMonth: string | null;
  pax: number | null;
  budget: string | null;
  intentLevel: CustomerAiIntentLevel;
  leadTemperature: CustomerAiTemperature;
  missingFields: CustomerAiMissingField[];
  nextBestAction: string;
  suggestedFollowUpMessage: string;
  insufficientData: boolean;
  generatedAt: string;
};

export const CUSTOMER_AI_SUMMARY_CACHE_KEY = "ai_customer_summary_v1";

export type CustomerAiSummaryCacheEntry = CustomerAiSummary & {
  fingerprint: string;
};
