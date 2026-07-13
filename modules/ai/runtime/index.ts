export {
  buildRuntimeContext,
  buildRuntimePrompt,
  DEFAULT_AI_TIMEZONE,
  prependRuntimePrompt,
  resolveLocaleFromCommunicationLanguage,
  withRuntimeContext,
  type AiRuntimeContext,
  type AiRuntimeLocale,
  type BuildRuntimeContextInput,
} from "@/modules/ai/runtime/build-runtime-context";

export {
  resolveOrganizationTimezone,
  resolveRuntimeContextInput,
} from "@/modules/ai/runtime/resolve-runtime-context-input";

export {
  RUNTIME_VERSIONS,
  RESPONSE_PLANNER_VERSION,
  GEOGRAPHIC_ELIGIBILITY_VERSION,
  CATALOG_VALIDATOR_VERSION,
  PLAYGROUND_SCORER_VERSION,
} from "@/modules/ai/runtime/runtime-versions";
