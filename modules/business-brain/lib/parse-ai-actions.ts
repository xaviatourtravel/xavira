import {
  isAIActionType,
  normalizeActionConfidence,
  type AIAction,
} from "@/modules/ai/action-engine/types";

/**
 * Parse LLM-recommended actions. Invalid entries are dropped.
 */
export function parseAiActions(value: unknown): AIAction[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const actions: AIAction[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue;
    }

    const record = item as Record<string, unknown>;
    const type =
      typeof record.type === "string" ? record.type.trim().toUpperCase() : "";

    if (!isAIActionType(type)) {
      continue;
    }

    const reason =
      typeof record.reason === "string" ? record.reason.trim() : "";
    if (!reason && type !== "NO_ACTION") {
      continue;
    }

    const payload =
      record.payload &&
      typeof record.payload === "object" &&
      !Array.isArray(record.payload)
        ? (record.payload as Record<string, unknown>)
        : {};

    actions.push({
      type,
      payload,
      confidence: normalizeActionConfidence(
        typeof record.confidence === "number" ? record.confidence : 0,
      ),
      reason: reason || type,
    });
  }

  return actions;
}
