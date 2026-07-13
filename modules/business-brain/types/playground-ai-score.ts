export type PlaygroundAiScoreLabel = "Excellent" | "Good" | "Needs Improvement" | "Poor";

export type PlaygroundAiScoreBreakdown = {
  overall: number;
  tone: number;
  knowledge: number;
  ruleCompliance: number;
  completeness: number;
  naturalness: number;
  groundedness: number;
  answerRelevance: number;
  modelGeneration: number;
  finalDeliverySafety: number;
};

export type PlaygroundGroundingDiagnostics = {
  requestType: string | null;
  selectedEntity: string | null;
  selectedEntitySource: string | null;
  interpretedPeriod: string | null;
  answerability: string | null;
  responseAction: string | null;
  directAnswerRequired: boolean;
  directAnswerPresent: boolean;
  answerFirstPassed: boolean;
  verifiedFactCount: number;
  groundedSourceCount: number;
  unsupportedClaimDetected: boolean;
  unsupportedClaimType: string | null;
  handoffRequired: boolean;
  handoffPreserved: boolean;
  attachmentRequired: boolean;
  attachmentPreserved: boolean;
  followUpQuestionKey: string | null;
  deterministicFallbackUsed: boolean;
  rawModelReplyPreview: string | null;
  finalReplyPreview: string | null;
  greetingAllowed?: boolean;
  greetingType?: string | null;
  companyNameUsed?: string | null;
  catalogQueryType?: string | null;
  catalogQueryValue?: string | null;
  catalogResultCount?: number;
  catalogEntityIds?: string[];
  selectionConfidence?: number | null;
  destinationMatchType?: string | null;
  priceFieldsFound?: number;
  hospitalityPassed?: boolean;
  interrogationDetected?: boolean;
  wrongEntityDetected?: boolean;
  geographicDiagnostics?: import("@/modules/ai/response-planner/types").GeographicDiagnostics | null;
  catalogContradictionDetected?: boolean;
  geographicViolationDetected?: boolean;
  requestedPeriodType?: string | null;
  requestedPeriodStart?: string | null;
  requestedPeriodEnd?: string | null;
  requestedPeriodMonth?: number | null;
  requestedPeriodYear?: number | null;
  requestedPeriodTimezone?: string | null;
  matchingDepartureDates?: string[];
  scheduleGrounded?: boolean;
  turnId?: string | null;
  responsePlannerVersion?: string | null;
  geographicEligibilityVersion?: string | null;
  catalogValidatorVersion?: string | null;
  playgroundScorerVersion?: string | null;
  promptCompilerVersion?: string | null;
  latestMessageIntent?: string | null;
  previousSelectedEntity?: string | null;
  currentSelectedEntity?: string | null;
  selectionOverrideReason?: string | null;
  geographicQueryType?: string | null;
  geographicQueryValue?: string | null;
  exactMatchEntityIds?: string[];
  alternativeEntityIds?: string[];
  excludedEntityIds?: string[];
  catalogEntityIdsDelivered?: string[];
  unplannedEntityIdsDetected?: string[];
  requestedPeriod?: string | null;
  staleTurnDetected?: boolean;
};

export type PlaygroundAiScore = {
  breakdown: PlaygroundAiScoreBreakdown;
  overallLabel: PlaygroundAiScoreLabel;
  finalDeliveryLabel: PlaygroundAiScoreLabel;
  modelGenerationLabel: PlaygroundAiScoreLabel;
  dimensionLabels: Record<
    keyof Omit<PlaygroundAiScoreBreakdown, "overall" | "modelGeneration" | "finalDeliverySafety">,
    PlaygroundAiScoreLabel
  >;
  groundingDiagnostics?: PlaygroundGroundingDiagnostics;
};

export function playgroundAiScoreLabel(score: number): PlaygroundAiScoreLabel {
  if (score >= 90) {
    return "Excellent";
  }

  if (score >= 75) {
    return "Good";
  }

  if (score >= 50) {
    return "Needs Improvement";
  }

  return "Poor";
}

export function labelPlaygroundAiScoreBreakdown(
  breakdown: PlaygroundAiScoreBreakdown,
): PlaygroundAiScore["dimensionLabels"] {
  return {
    tone: playgroundAiScoreLabel(breakdown.tone),
    knowledge: playgroundAiScoreLabel(breakdown.knowledge),
    ruleCompliance: playgroundAiScoreLabel(breakdown.ruleCompliance),
    completeness: playgroundAiScoreLabel(breakdown.completeness),
    naturalness: playgroundAiScoreLabel(breakdown.naturalness),
    groundedness: playgroundAiScoreLabel(breakdown.groundedness),
    answerRelevance: playgroundAiScoreLabel(breakdown.answerRelevance),
  };
}
