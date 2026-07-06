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
  ctaLabel: string;
  ctaHref: string;
  /** Optional 0–100 progress for health/readiness cards. */
  progressPercent?: number | null;
};

export type BusinessBrainSuggestion = {
  id: string;
  title: string;
  description: string;
  href?: string;
};

export type BusinessBrainRecentChange = {
  id: string;
  label: string;
  timestampLabel: string;
};

import type { BusinessBrainHealth } from "@/modules/business-brain/types/business-brain-health";
import type { BusinessBrainCoachResult } from "@/modules/business-brain/types/business-brain-coach";
import type { BusinessBrainTimelineResult } from "@/modules/business-brain/types/business-brain-timeline";

export type BusinessBrainOverviewSummary = {
  health: BusinessBrainHealth;
  coach: BusinessBrainCoachResult;
  timeline: BusinessBrainTimelineResult;
  brainHealthPercent: number;
  aiReadinessPercent: number;
  estimatedAiAccuracy: number;
  knowledgeCount: number;
  productCount: number;
  documentCount: number;
  publishStatus: "draft" | "published";
  metrics: BusinessBrainMetricCard[];
  suggestions: BusinessBrainSuggestion[];
  recentChanges: BusinessBrainRecentChange[];
};

export type {
  BusinessBrainHealth,
  BusinessBrainHealthRecommendation,
} from "@/modules/business-brain/types/business-brain-health";

export type {
  BusinessBrainTimelineEvent,
  BusinessBrainTimelineEventType,
  BusinessBrainTimelineResult,
} from "@/modules/business-brain/types/business-brain-timeline";

export type {
  BusinessBrainCoachCategory,
  BusinessBrainCoachDifficulty,
  BusinessBrainCoachEstimatedTime,
  BusinessBrainCoachPriority,
  BusinessBrainCoachProgressItem,
  BusinessBrainCoachRecommendation,
  BusinessBrainCoachResult,
} from "@/modules/business-brain/types/business-brain-coach";

export type {
  KnowledgeCoverageCategoryLabel,
  KnowledgeCoverageCategoryResult,
  KnowledgeCoverageResult,
  KnowledgeCoverageStatus,
} from "@/modules/business-brain/types/knowledge-coverage";

export { KNOWLEDGE_COVERAGE_CATEGORY_LABELS, knowledgeCoverageStatusFromScore } from "@/modules/business-brain/types/knowledge-coverage";

/** @deprecated Use BusinessBrainOverviewSummary */
export type BusinessBrainDashboardPlaceholder = BusinessBrainOverviewSummary;

export * from "@/modules/business-brain/types/company-dna";
export * from "@/modules/business-brain/types/products";
export * from "@/modules/business-brain/types/knowledge";
export * from "@/modules/business-brain/types/documents";
export * from "@/modules/business-brain/types/behaviors";
export * from "@/modules/business-brain/types/playground";
export * from "@/modules/business-brain/types/publish";
export * from "@/modules/business-brain/types/context";
export * from "@/modules/business-brain/types/business-brain-workspace";
export * from "@/modules/business-brain/types/prompt";
