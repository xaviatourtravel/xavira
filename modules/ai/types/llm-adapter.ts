export type GenerateJSONParams = {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
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
