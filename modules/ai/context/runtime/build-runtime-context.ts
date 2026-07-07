import {
  buildRuntimeContext as buildAiRuntimeContext,
  type AiRuntimeLocale,
  type BuildRuntimeContextInput,
} from "@/modules/ai/runtime/build-runtime-context";

export type { AiRuntimeLocale, BuildRuntimeContextInput };

export type RuntimeContext = {
  date: string;
  time: string;
  timezone: string;
  locale: AiRuntimeLocale;
};

export function buildRuntimeContext(
  input?: BuildRuntimeContextInput,
): RuntimeContext {
  const runtime = buildAiRuntimeContext(input);

  return {
    date: runtime.isoDate,
    time: runtime.currentTime,
    timezone: runtime.timezone,
    locale: runtime.locale,
  };
}
