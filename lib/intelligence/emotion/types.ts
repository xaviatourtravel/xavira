export const EMOTION_SIGNALS = [
  "positive",
  "neutral",
  "negative",
  "urgent",
] as const;

export type EmotionSignal = (typeof EMOTION_SIGNALS)[number];

export type EmotionAnalysis = {
  primary: EmotionSignal;
  label: string;
  confidence: import("@/lib/intelligence/types/common").ConfidenceLevel;
  indicators: string[];
};

export const EMOTION_LABELS: Record<EmotionSignal, string> = {
  positive: "Positive",
  neutral: "Neutral",
  negative: "Negative",
  urgent: "Urgent",
};
