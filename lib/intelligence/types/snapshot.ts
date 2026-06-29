import type { IntelligenceSource, IntelligenceState } from "@/lib/intelligence/types/common";
import type { AutomationSignals } from "@/lib/intelligence/automation/types";
import type { ConversationContext } from "@/lib/intelligence/context/types";
import type { EmotionAnalysis } from "@/lib/intelligence/emotion/types";
import type { ExtractedEntities } from "@/lib/intelligence/entities/types";
import type { IntentAnalysis } from "@/lib/intelligence/intent/types";
import type { CustomerMemory } from "@/lib/intelligence/memory/types";
import type { RecommendationSet } from "@/lib/intelligence/recommendation/types";

export type IntelligenceScores = {
  leadScore: number | null;
  leadScoreLabel: string | null;
  revenuePotentialIdr: number | null;
};

/**
 * Complete reasoning output for one conversation at a point in time.
 * UI renders exclusively from this structure — never from ad-hoc card logic.
 */
export type IntelligenceSnapshot = {
  id: string;
  conversationId: string;
  generatedAt: string;
  state: IntelligenceState;
  source: IntelligenceSource;

  /** Pipeline stage 1 — normalized conversation input */
  context: ConversationContext;

  /** Pipeline stage 2 */
  memory: CustomerMemory;

  /** Pipeline stage 3 */
  intent: IntentAnalysis | null;

  /** Pipeline stage 4 */
  entities: ExtractedEntities;

  /** Pipeline stage 5 */
  emotion: EmotionAnalysis | null;

  /** Pipeline stage 6 */
  recommendation: RecommendationSet;

  /** Pipeline stage 7 */
  automation: AutomationSignals;

  /** Derived narrative for operators */
  summary: string | null;

  /** Derived commercial signals */
  scores: IntelligenceScores;
};

export type IntelligencePipelineStage =
  | "context"
  | "memory"
  | "intent"
  | "entities"
  | "emotion"
  | "recommendation"
  | "automation";

export const INTELLIGENCE_PIPELINE: IntelligencePipelineStage[] = [
  "context",
  "memory",
  "intent",
  "entities",
  "emotion",
  "recommendation",
  "automation",
];
