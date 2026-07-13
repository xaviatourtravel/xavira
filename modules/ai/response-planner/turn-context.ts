import { createHash, randomBytes } from "node:crypto";

import type { RuntimeVersions } from "@/modules/ai/runtime/runtime-versions";
import { RUNTIME_VERSIONS } from "@/modules/ai/runtime/runtime-versions";

export type TurnContext = {
  turnId: string;
  latestMessageTextHash: string;
  previousTurnId: string | null;
  planCreatedAt: string;
  runtimeVersions: RuntimeVersions;
};

export function hashMessageText(message: string): string {
  return createHash("sha256").update(message.trim()).digest("hex").slice(0, 16);
}

export function createTurnContext(input: {
  sessionId: string;
  latestMessage: string;
  previousTurnId?: string | null;
  now?: Date;
}): TurnContext {
  const now = input.now ?? new Date();
  const suffix = randomBytes(4).toString("hex");
  return {
    turnId: `${input.sessionId}-${now.getTime()}-${suffix}`,
    latestMessageTextHash: hashMessageText(input.latestMessage),
    previousTurnId: input.previousTurnId ?? null,
    planCreatedAt: now.toISOString(),
    runtimeVersions: RUNTIME_VERSIONS,
  };
}
