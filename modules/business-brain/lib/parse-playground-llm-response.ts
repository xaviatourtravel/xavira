import type { PlaygroundPreviewResult } from "@/modules/business-brain/types/playground";

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function normalizeConfidence(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }

  const normalized = value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

export function parsePlaygroundLlmResponse(data: unknown): PlaygroundPreviewResult | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  const record = data as Record<string, unknown>;
  if (typeof record.reply !== "string" || !record.reply.trim()) {
    return null;
  }

  return {
    aiReply: record.reply.trim(),
    confidence: normalizeConfidence(record.confidence),
    handoffRequired: record.handoffRequired === true,
    handoffReason:
      typeof record.handoffReason === "string" ? record.handoffReason.trim() || null : null,
    suggestedActions: asStringArray(record.suggestedActions),
    usedSources: asStringArray(record.usedSources),
    sourceLabels: [],
    documentActions: [],
  };
}
