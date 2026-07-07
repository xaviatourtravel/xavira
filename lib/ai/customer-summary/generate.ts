import OpenAI from "openai";

import { AI_MODEL } from "@/lib/ai/client";

import type { CustomerAiSummaryContext } from "./context";
import { buildCustomerAiSummaryPrompt } from "./prompt";
import { parseCustomerAiSummaryResponse } from "./parse";
import type { CustomerAiSummary } from "./types";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export type CustomerAiSummaryGenerationResult = {
  success: boolean;
  message?: string;
  data?: CustomerAiSummary;
  inputTokens?: number;
  outputTokens?: number;
};

export async function generateCustomerAiSummary(
  context: CustomerAiSummaryContext,
  timezone?: string | null,
): Promise<CustomerAiSummaryGenerationResult> {
  if (!openai) {
    return {
      success: false,
      message: "AI belum dikonfigurasi. Hubungi admin.",
    };
  }

  try {
    const response = await openai.responses.create({
      model: AI_MODEL,
      input: buildCustomerAiSummaryPrompt(context, timezone),
    });

    const text = response.output_text?.trim();

    if (!text) {
      return {
        success: false,
        message: "Gagal membuat ringkasan customer. Coba lagi.",
      };
    }

    const parsed = parseCustomerAiSummaryResponse(
      text,
      context.ruleBasedMissingFields,
    );

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.message,
      };
    }

    return {
      success: true,
      data: parsed.data,
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
    };
  } catch {
    return {
      success: false,
      message:
        "Gagal membuat ringkasan customer. Coba lagi dalam beberapa saat.",
    };
  }
}
