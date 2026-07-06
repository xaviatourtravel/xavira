export type PlaygroundAiScoreLabel = "Excellent" | "Good" | "Needs Improvement" | "Poor";

export type PlaygroundAiScoreBreakdown = {
  overall: number;
  tone: number;
  knowledge: number;
  ruleCompliance: number;
  completeness: number;
  naturalness: number;
};

export type PlaygroundAiScore = {
  breakdown: PlaygroundAiScoreBreakdown;
  overallLabel: PlaygroundAiScoreLabel;
  dimensionLabels: Record<keyof Omit<PlaygroundAiScoreBreakdown, "overall">, PlaygroundAiScoreLabel>;
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
  };
}
