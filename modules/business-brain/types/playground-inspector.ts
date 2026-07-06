import type { PlaygroundConfidenceBreakdown } from "@/modules/business-brain/types/playground-confidence-breakdown";

export type PlaygroundInspectorMemoryRow = {
  label: string;
  value: string;
};

export type PlaygroundInspectorView = {
  confidencePercent: number;
  confidenceBreakdown: PlaygroundConfidenceBreakdown;
  confidenceTone: "success" | "warning" | "danger";
  knowledgeUsed: string[];
  memoryRows: PlaygroundInspectorMemoryRow[];
  rulesApplied: string[];
  suggestedActions: string[];
  warnings: string[];
  intent: string | null;
};
