import { PROMPT_COMPILER_VERSION } from "@/modules/ai/prompt-compiler/prompt-version";

export const RESPONSE_PLANNER_VERSION = "answer-first-v1.3";
export const GEOGRAPHIC_ELIGIBILITY_VERSION = "geo-v1.1";
export const CATALOG_VALIDATOR_VERSION = "catalog-v1.2";
export const PLAYGROUND_SCORER_VERSION = "playground-score-v1.3";

export const RUNTIME_VERSIONS = {
  responsePlannerVersion: RESPONSE_PLANNER_VERSION,
  geographicEligibilityVersion: GEOGRAPHIC_ELIGIBILITY_VERSION,
  catalogValidatorVersion: CATALOG_VALIDATOR_VERSION,
  playgroundScorerVersion: PLAYGROUND_SCORER_VERSION,
  promptCompilerVersion: PROMPT_COMPILER_VERSION,
} as const;

export type RuntimeVersions = typeof RUNTIME_VERSIONS;
