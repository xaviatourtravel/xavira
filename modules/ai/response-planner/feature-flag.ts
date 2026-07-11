const ANSWER_FIRST_V1_ENABLED_VALUES = new Set(["true", "1", "on", "yes"]);

/**
 * Feature flag: DESKLABS_AI_ANSWER_FIRST_V1
 *
 * - unset / empty / false / 0 / off / no / unknown → disabled
 * - true / 1 / on / yes → answer-first response planning + validation
 */
export function parseAnswerFirstV1Flag(raw: string | undefined): boolean {
  if (raw === undefined) return false;
  const value = raw.trim().toLowerCase();
  if (value === "") return false;
  return ANSWER_FIRST_V1_ENABLED_VALUES.has(value);
}

export function isAnswerFirstV1Enabled(): boolean {
  return parseAnswerFirstV1Flag(process.env.DESKLABS_AI_ANSWER_FIRST_V1);
}
