import type { BuildRuntimeContextInput } from "@/modules/ai/runtime/build-runtime-context";

export type GenerateJSONParams = {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  /** @deprecated Use runtimeContext.timezone */
  timezone?: string | null;
  runtimeContext?: BuildRuntimeContextInput;
  /** Skip system runtime injection when runtime is already in the user prompt. */
  runtimeInjection?: "system" | "user" | "none";
};

export type GenerateJSONResult = {
  success: boolean;
  data?: unknown;
  rawText?: string;
  error?: string;
  latencyMs: number;
};

export interface LLMAdapter {
  readonly provider: string;
  readonly model: string;
  readonly enabled: boolean;
  generateJSON(params: GenerateJSONParams): Promise<GenerateJSONResult>;
}
