/** Shared primitives across intelligence modules. */

export const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export const INTELLIGENCE_SOURCES = ["stub", "rules", "crm", "llm"] as const;
export type IntelligenceSource = (typeof INTELLIGENCE_SOURCES)[number];

export type IntelligenceState = "pending" | "ready";

export type ScoredValue<T> = {
  value: T;
  confidence: ConfidenceLevel;
  source: IntelligenceSource;
};

export type IntelligenceModuleResult<T> = {
  data: T;
  source: IntelligenceSource;
  computedAt: string;
};
