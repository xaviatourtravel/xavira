/**
 * Per-org AI rate limiting boundary.
 *
 * This is a process-local token bucket intended as a reusable contract.
 * Multi-instance deployments should later swap the store for Redis/Upstash.
 * Limits are conservative and intentionally fail closed when exceeded.
 */

export type AiRateLimitScope = {
  organizationId: string;
  route: "analyze" | "speech" | string;
  userId?: string;
};

export type AiRateLimitResult =
  | { ok: true; remaining: number; resetAt: number }
  | {
      ok: false;
      code: "rate_limited";
      message: string;
      retryAfterSeconds: number;
      resetAt: number;
    };

type Bucket = {
  tokens: number;
  updatedAt: number;
};

const DEFAULT_LIMIT = 30;
const DEFAULT_WINDOW_MS = 60_000;

const buckets = new Map<string, Bucket>();

function bucketKey(scope: AiRateLimitScope): string {
  return `${scope.organizationId}:${scope.route}:${scope.userId ?? "anon"}`;
}

export function checkAiRateLimit(
  scope: AiRateLimitScope,
  options?: {
    limit?: number;
    windowMs?: number;
    now?: number;
    store?: Map<string, Bucket>;
  },
): AiRateLimitResult {
  const limit = options?.limit ?? DEFAULT_LIMIT;
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
  const now = options?.now ?? Date.now();
  const store = options?.store ?? buckets;
  const key = bucketKey(scope);
  const existing = store.get(key);

  if (!existing || now - existing.updatedAt >= windowMs) {
    store.set(key, { tokens: limit - 1, updatedAt: now });
    return {
      ok: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
    };
  }

  if (existing.tokens <= 0) {
    const resetAt = existing.updatedAt + windowMs;
    return {
      ok: false,
      code: "rate_limited",
      message: "Terlalu banyak permintaan AI. Coba lagi sebentar.",
      retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)),
      resetAt,
    };
  }

  existing.tokens -= 1;
  store.set(key, existing);
  return {
    ok: true,
    remaining: existing.tokens,
    resetAt: existing.updatedAt + windowMs,
  };
}

/** Test helper — clears the default in-memory store. */
export function resetAiRateLimitStoreForTests() {
  buckets.clear();
}
