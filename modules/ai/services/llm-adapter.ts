import OpenAI from "openai";

import type {
  GenerateJSONParams,
  GenerateJSONResult,
  LLMAdapter,
} from "@/modules/ai/types/llm-adapter";

export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
export const DEFAULT_LLM_TIMEOUT_MS = 15_000;

function resolveOpenAiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
}

function logRequestStarted(meta: Record<string, unknown>) {
  console.info("[LLM] request_started", meta);
}

function logRequestCompleted(meta: Record<string, unknown>) {
  console.info("[LLM] request_completed", meta);
}

function logInvalidJson(meta: Record<string, unknown>) {
  console.warn("[LLM] invalid_json", meta);
}

function logRequestFailed(meta: Record<string, unknown>) {
  console.warn("[LLM] request_failed", meta);
}

function extractJsonCandidate(rawText: string): string {
  const trimmed = rawText.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fenced ? fenced[1].trim() : trimmed;
}

export function parseLlmJsonResponse(rawText: string): unknown | null {
  const candidate = extractJsonCandidate(rawText);

  try {
    return JSON.parse(candidate) as unknown;
  } catch {
    return null;
  }
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

class DisabledLLMAdapter implements LLMAdapter {
  readonly provider = "disabled";
  readonly model = "none";
  readonly enabled = false;

  async generateJSON(_params: GenerateJSONParams): Promise<GenerateJSONResult> {
    return {
      success: false,
      error: "LLM adapter is not configured.",
      latencyMs: 0,
    };
  }
}

class OpenAILLMAdapter implements LLMAdapter {
  readonly provider = "openai";
  readonly model: string;
  readonly enabled = true;

  private readonly client: OpenAI;
  private readonly timeoutMs: number;

  constructor(options?: { apiKey?: string; model?: string; timeoutMs?: number }) {
    const apiKey = options?.apiKey ?? process.env.OPENAI_API_KEY;
    if (!apiKey?.trim()) {
      throw new Error("OPENAI_API_KEY is required for OpenAILLMAdapter.");
    }

    this.client = new OpenAI({ apiKey });
    this.model = options?.model?.trim() || resolveOpenAiModel();
    this.timeoutMs = options?.timeoutMs ?? DEFAULT_LLM_TIMEOUT_MS;
  }

  async generateJSON(params: GenerateJSONParams): Promise<GenerateJSONResult> {
    const startedAt = Date.now();
    const temperature = params.temperature ?? 0.4;
    const maxTokens = params.maxTokens ?? 800;

    logRequestStarted({
      provider: this.provider,
      model: this.model,
      temperature,
      maxTokens,
      systemPromptLength: params.systemPrompt.length,
      userPromptLength: params.userPrompt.length,
    });

    try {
      const response = await withTimeout(
        this.client.responses.create({
          model: this.model,
          input: [
            { role: "system", content: params.systemPrompt },
            { role: "user", content: params.userPrompt },
          ],
          temperature,
          max_output_tokens: maxTokens,
          text: {
            format: {
              type: "json_object",
            },
          },
        }),
        this.timeoutMs,
        `LLM request timed out after ${this.timeoutMs}ms`,
      );

      const latencyMs = Date.now() - startedAt;
      const rawText = response.output_text?.trim() ?? "";

      if (!rawText) {
        logRequestFailed({
          provider: this.provider,
          model: this.model,
          latencyMs,
          reason: "empty_response",
        });

        return {
          success: false,
          rawText,
          error: "Empty LLM response.",
          latencyMs,
        };
      }

      const data = parseLlmJsonResponse(rawText);
      if (data === null) {
        logInvalidJson({
          provider: this.provider,
          model: this.model,
          latencyMs,
          rawTextLength: rawText.length,
        });

        return {
          success: false,
          rawText,
          error: "Invalid JSON response from LLM.",
          latencyMs,
        };
      }

      logRequestCompleted({
        provider: this.provider,
        model: this.model,
        latencyMs,
        inputTokens: response.usage?.input_tokens ?? 0,
        outputTokens: response.usage?.output_tokens ?? 0,
      });

      return {
        success: true,
        data,
        rawText,
        latencyMs,
      };
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      const message = error instanceof Error ? error.message : String(error);

      logRequestFailed({
        provider: this.provider,
        model: this.model,
        latencyMs,
        reason: message,
      });

      return {
        success: false,
        error: message,
        latencyMs,
      };
    }
  }
}

export function createOpenAILLMAdapter(options?: {
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
}): OpenAILLMAdapter | null {
  const apiKey = options?.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    return null;
  }

  return new OpenAILLMAdapter(options);
}

export function createDisabledLLMAdapter(): LLMAdapter {
  return new DisabledLLMAdapter();
}

export function createLLMAdapter(options?: {
  timeoutMs?: number;
}): LLMAdapter | null {
  return createOpenAILLMAdapter(options);
}

export { OpenAILLMAdapter, DisabledLLMAdapter };
