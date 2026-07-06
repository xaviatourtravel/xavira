export type PlaygroundConfidenceQualityLabel =
  | "Excellent"
  | "Good"
  | "Medium"
  | "Low"
  | "Poor";

export type PlaygroundConfidenceDimensionKey =
  | "knowledge"
  | "rules"
  | "products"
  | "documents"
  | "memory";

export type PlaygroundConfidenceBreakdownItem = {
  key: PlaygroundConfidenceDimensionKey;
  label: string;
  score: number;
  qualityLabel: PlaygroundConfidenceQualityLabel;
  explanation: string | null;
};

export type PlaygroundConfidenceBreakdown = {
  overall: number;
  items: PlaygroundConfidenceBreakdownItem[];
};

export function playgroundConfidenceQualityLabel(
  score: number,
): PlaygroundConfidenceQualityLabel {
  if (score >= 90) {
    return "Excellent";
  }

  if (score >= 75) {
    return "Good";
  }

  if (score >= 60) {
    return "Medium";
  }

  if (score >= 40) {
    return "Low";
  }

  return "Poor";
}

export function shouldExplainConfidenceDimension(
  qualityLabel: PlaygroundConfidenceQualityLabel,
): boolean {
  return qualityLabel === "Medium" || qualityLabel === "Low" || qualityLabel === "Poor";
}
