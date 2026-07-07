import {
  buildRuntimeContext,
  buildRuntimePrompt,
  DEFAULT_AI_TIMEZONE,
  prependRuntimePrompt,
  withRuntimeContext,
  type AiRuntimeContext,
  type BuildRuntimeContextInput,
} from "@/modules/ai/runtime/build-runtime-context";

export { DEFAULT_AI_TIMEZONE };

/** @deprecated Use AiRuntimeContext from modules/ai/runtime */
export type TemporalContext = AiRuntimeContext & {
  currentMonth: string;
  currentYear: string;
  friendlyDate: string;
  friendlyDateTime: string;
};

/** @deprecated Use BuildRuntimeContextInput from modules/ai/runtime */
export type BuildTemporalContextOptions = BuildRuntimeContextInput;

function toLegacyTemporalContext(context: AiRuntimeContext): TemporalContext {
  return {
    ...context,
    currentMonth: context.month,
    currentYear: context.year,
    friendlyDate: context.currentDate,
    friendlyDateTime: context.currentDateTime,
  };
}

/** @deprecated Use buildRuntimeContext from modules/ai/runtime */
export function buildTemporalContext(
  options?: BuildRuntimeContextInput,
): TemporalContext {
  return toLegacyTemporalContext(buildRuntimeContext(options));
}

/** @deprecated Use buildRuntimePrompt from modules/ai/runtime */
export function formatTemporalContextBlock(context: AiRuntimeContext): string {
  return buildRuntimePrompt(context);
}

/** @deprecated Runtime rules are included in buildRuntimePrompt */
export function formatTemporalResolutionRules(context: AiRuntimeContext): string {
  return [
    "Temporal awareness rules:",
    `- "today" means ${context.resolved.todayLabel}`,
    `- "tomorrow" means ${context.resolved.tomorrowLabel}`,
    `- "this month" means ${context.resolved.thisMonth}`,
    `- "next month" means ${context.resolved.nextMonth}`,
    "- Never assume another date.",
    "- Never fabricate current time.",
  ].join("\n");
}

/** @deprecated Use prependRuntimePrompt from modules/ai/runtime */
export function injectTemporalBeforeContent(
  content: string,
  options?: BuildRuntimeContextInput,
): string {
  return prependRuntimePrompt(content, options);
}

/** @deprecated Use withRuntimeContext from modules/ai/runtime */
export function withTemporalContext(
  prompt: string,
  options?: BuildRuntimeContextInput,
): string {
  return withRuntimeContext(prompt, options);
}

/** @deprecated Use buildRuntimePrompt in system prompt assembly */
export function augmentSystemPromptWithTemporalContext(
  systemPrompt: string,
  options?: BuildRuntimeContextInput,
): string {
  const context = buildRuntimeContext(options);
  return [buildRuntimePrompt(context), "", systemPrompt].join("\n");
}

export {
  buildRuntimeContext,
  buildRuntimePrompt,
  prependRuntimePrompt,
  withRuntimeContext,
} from "@/modules/ai/runtime/build-runtime-context";
