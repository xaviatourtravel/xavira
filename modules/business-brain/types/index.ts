export type BusinessBrainMetricCardId =
  | "brain-health"
  | "ai-readiness"
  | "knowledge"
  | "products"
  | "documents"
  | "publish-status";

export type BusinessBrainMetricCard = {
  id: BusinessBrainMetricCardId;
  title: string;
  description: string;
  statusLabel: string;
};

export type BusinessBrainSuggestion = {
  id: string;
  title: string;
  description: string;
};

export type BusinessBrainRecentChange = {
  id: string;
  label: string;
  timestampLabel: string;
};

export type BusinessBrainDashboardPlaceholder = {
  metrics: BusinessBrainMetricCard[];
  suggestions: BusinessBrainSuggestion[];
  recentChanges: BusinessBrainRecentChange[];
};

export * from "@/modules/business-brain/types/company-dna";
export * from "@/modules/business-brain/types/products";
export * from "@/modules/business-brain/types/knowledge";
export * from "@/modules/business-brain/types/documents";
export * from "@/modules/business-brain/types/behaviors";
export * from "@/modules/business-brain/types/playground";
export * from "@/modules/business-brain/types/publish";
export * from "@/modules/business-brain/types/context";
export * from "@/modules/business-brain/types/prompt";
