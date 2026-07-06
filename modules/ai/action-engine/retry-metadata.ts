import {
  EMPTY_AI_ACTION_RETRY_METADATA,
  type AIActionRetryMetadata,
} from "@/modules/ai/action-engine/types";

export function parseRetryMetadata(value: unknown): AIActionRetryMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...EMPTY_AI_ACTION_RETRY_METADATA };
  }

  const record = value as Record<string, unknown>;
  return {
    retryCount:
      typeof record.retryCount === "number" && record.retryCount >= 0
        ? record.retryCount
        : 0,
    lastRetryAt:
      typeof record.lastRetryAt === "string" ? record.lastRetryAt : null,
    lastRetryBy:
      typeof record.lastRetryBy === "string" ? record.lastRetryBy : null,
    lastRetryError:
      typeof record.lastRetryError === "string" ? record.lastRetryError : null,
  };
}

export function formatRetryCount(metadata: AIActionRetryMetadata): string | null {
  if (metadata.retryCount <= 0) {
    return null;
  }

  return metadata.retryCount === 1
    ? "Retried 1 time"
    : `Retried ${metadata.retryCount} times`;
}
