const CONVERSATION_STATE_V1_ENABLED_VALUES = new Set(["true", "1", "on", "yes"]);

/**
 * Feature flag: DESKLABS_AI_CONVERSATION_STATE_V1
 *
 * Production defaults to history-based behavior unless explicitly enabled.
 *
 * - unset / empty / false / 0 / off / no / unknown → disabled
 * - true / 1 / on / yes → persistent conversation state + greeting guard
 */
export function parseConversationStateV1Flag(raw: string | undefined): boolean {
  if (raw === undefined) {
    return false;
  }

  const value = raw.trim().toLowerCase();
  if (value === "") {
    return false;
  }

  return CONVERSATION_STATE_V1_ENABLED_VALUES.has(value);
}

export function isConversationStateV1Enabled(): boolean {
  return parseConversationStateV1Flag(process.env.DESKLABS_AI_CONVERSATION_STATE_V1);
}
