const PROMPT_COMPILER_V2_ENABLED_VALUES = new Set(["true", "1", "on", "yes"]);

/**
 * Feature flag: DESKLABS_AI_PROMPT_COMPILER_V2
 *
 * Production defaults to the legacy prompt builder unless V2 is explicitly enabled.
 *
 * - unset / empty / false / 0 / off / no / unknown → legacy prompt builder
 * - true / 1 / on / yes → Base Brain + prompt compiler v2
 */
export function parsePromptCompilerV2Flag(raw: string | undefined): boolean {
  if (raw === undefined) {
    return false;
  }

  const value = raw.trim().toLowerCase();
  if (value === "") {
    return false;
  }

  return PROMPT_COMPILER_V2_ENABLED_VALUES.has(value);
}

export function isPromptCompilerV2Enabled(): boolean {
  return parsePromptCompilerV2Flag(process.env.DESKLABS_AI_PROMPT_COMPILER_V2);
}
