import OpenAI from "openai";

import { AI_MODEL } from "@/lib/ai/client";
import { sanitizeAiReplyBranding } from "@/lib/whatsapp-inbox/ai/workspace-profile";

export const WHATSAPP_AI_LLM_FALLBACK_REPLY =
  "Baik Kak, kami bantu cek dulu ya. Sebentar kami lanjutkan informasinya.";

const HANDOFF_REQUIRED_TOKEN = "HANDOFF_REQUIRED";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export type GenerateWhatsAppReplyInput = {
  workspaceName: string;
  customerName: string;
  messageText: string;
  conversationHistory: string;
  intent: string;
  shouldUseGreeting: boolean;
};

export type GenerateWhatsAppReplyResult = {
  success: boolean;
  reply: string;
  handoffRequired: boolean;
  handoffReason: string | null;
  generationTimeMs: number;
  inputTokens: number;
  outputTokens: number;
  usedFallback: boolean;
  error?: string;
};

type LlmReplyContract = {
  reply: string;
  handoffRequired: boolean;
  handoffReason: string | null;
};

const PROMPT_EXAMPLES = `Examples:

Customer: halo kak
AI: Halo Kak 😊 Boleh, mau tanya paket ke mana?

Customer: ada paket ke cina ga?
AI: Ada Kak, untuk China biasanya ada beberapa favorit seperti Yunnan, Beijing–Shanghai, Xi'an, dan Zhangjiajie. Kakak rencana berangkat bulan apa?

Customer: Yunnan kemana aja?
AI: Yunnan biasanya cover Kunming, Dali, Lijiang, dan Shangri-La Kak. Highlight-nya Jade Dragon Snow Mountain, Blue Moon Valley, Lijiang Old Town, dan Dali.`;

function buildSystemPrompt(workspaceName: string) {
  return `You are a WhatsApp travel sales assistant for ${workspaceName}.
Sound like a real Indonesian travel admin, not a chatbot.
You are not Desklabs. Desklabs is only the internal software platform. Reply as the company/team.

Style rules:
- Keep replies short, warm, casual-professional, and human-like.
- Maximum 1-3 short paragraphs. Ask only one clarifying question at a time.
- Use "Kak" naturally, not in every sentence.
- Do not greet repeatedly. Do not mention the customer name repeatedly.
- Answer based on the latest question and conversation context.
- If the customer asks a follow-up, answer directly without reintroducing yourself.
- Do not overuse chatbot phrases like "Untuk paket...", "Kami memiliki beberapa pilihan menarik...", or repeated CTAs every message.
- Do not overpromise. If unsure, ask one short clarifying question.

Greeting rule:
- Only open with "Halo/Hai/Selamat..." when greeting mode is YES.
- When greeting mode is NO, answer directly. Never start with "Halo Kak...", "Hai Kak...", or "Selamat...".

Name rule:
- Use the customer name only in the first greeting or when truly needed for clarification.
- Avoid repeating "Kak {name}" in every message.

Safety:
If the customer asks for negotiation, discount, payment proof, refund, complaint, phone call, booking confirmation, or anything high-risk, do not answer directly.
Set handoffRequired to true and set handoffReason briefly.

${PROMPT_EXAMPLES}

Return ONLY valid JSON with this exact shape:
{
  "reply": "string",
  "handoffRequired": boolean,
  "handoffReason": "string | null"
}

If handoff is required, reply may be "HANDOFF_REQUIRED".`;
}

function buildUserPrompt(input: GenerateWhatsAppReplyInput) {
  const greetingMode = input.shouldUseGreeting
    ? "YES — brief greeting allowed if natural"
    : "NO — answer directly, no Halo/Hai/Selamat opener";

  const nameMode = input.shouldUseGreeting
    ? "May use customer name once in greeting if needed"
    : "Avoid customer name unless truly needed for clarification";

  return `Intent: ${input.intent}
Greeting mode: ${greetingMode}
Name usage: ${nameMode}
Customer name: ${input.customerName}

Latest customer message:
${input.messageText}

Conversation history (most recent at bottom):
${input.conversationHistory}`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripRepeatedGreeting(
  reply: string,
  shouldUseGreeting: boolean,
  customerName: string,
) {
  if (shouldUseGreeting) {
    return reply.trim();
  }

  let normalized = reply.trim();
  const firstName = customerName.trim().split(/\s+/)[0] ?? "";
  const namePattern = firstName
    ? `(?:${escapeRegExp(firstName)}|Kak\\s+${escapeRegExp(firstName)})`
    : "(?:[^\\n,!?.]+)";

  const greetingPatterns = [
    new RegExp(
      `^halo\\s+${namePattern}[,!.\\s]*`,
      "i",
    ),
    new RegExp(
      `^hai\\s+${namePattern}[,!.\\s]*`,
      "i",
    ),
    new RegExp(
      `^halo\\s+kak\\s+${namePattern}[,!.\\s]*`,
      "i",
    ),
    new RegExp(
      `^hai\\s+kak\\s+${namePattern}[,!.\\s]*`,
      "i",
    ),
    /^halo\s+kak[,!.\s]*/i,
    /^hai\s+kak[,!.\s]*/i,
    /^selamat\s+(?:pagi|siang|sore|malam)[,!.\s]*/i,
  ];

  for (const pattern of greetingPatterns) {
    const next = normalized.replace(pattern, "").trim();
    if (next !== normalized) {
      normalized = next;
    }
  }

  return normalized || reply.trim();
}

function parseLlmReplyContract(raw: string): LlmReplyContract | null {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;

  try {
    const parsed = JSON.parse(candidate) as Record<string, unknown>;

    if (typeof parsed.reply !== "string") {
      return null;
    }

    return {
      reply: parsed.reply.trim(),
      handoffRequired: parsed.handoffRequired === true,
      handoffReason:
        typeof parsed.handoffReason === "string"
          ? parsed.handoffReason.trim() || null
          : null,
    };
  } catch {
    return null;
  }
}

function isHandoffReply(reply: string) {
  return reply.trim().toUpperCase() === HANDOFF_REQUIRED_TOKEN;
}

function buildFallbackResult(
  generationTimeMs: number,
  error?: string,
): GenerateWhatsAppReplyResult {
  return {
    success: false,
    reply: WHATSAPP_AI_LLM_FALLBACK_REPLY,
    handoffRequired: false,
    handoffReason: null,
    generationTimeMs,
    inputTokens: 0,
    outputTokens: 0,
    usedFallback: true,
    error,
  };
}

export const aiLLMReplyService = {
  async generateWhatsAppReply(
    input: GenerateWhatsAppReplyInput,
  ): Promise<GenerateWhatsAppReplyResult> {
    const startedAt = Date.now();

    if (!openai) {
      return buildFallbackResult(
        Date.now() - startedAt,
        "OPENAI_API_KEY is not configured",
      );
    }

    try {
      const response = await openai.responses.create({
        model: AI_MODEL,
        input: [
          {
            role: "system",
            content: buildSystemPrompt(input.workspaceName),
          },
          {
            role: "user",
            content: buildUserPrompt(input),
          },
        ],
        text: {
          format: {
            type: "json_object",
          },
        },
      });

      const generationTimeMs = Date.now() - startedAt;
      const outputText = response.output_text?.trim();

      if (!outputText) {
        return buildFallbackResult(generationTimeMs, "Empty LLM response");
      }

      const contract = parseLlmReplyContract(outputText);

      if (!contract || !contract.reply) {
        return buildFallbackResult(
          generationTimeMs,
          "Invalid LLM JSON response",
        );
      }

      const handoffRequired =
        contract.handoffRequired || isHandoffReply(contract.reply);

      const reply = handoffRequired
        ? contract.reply
        : stripRepeatedGreeting(
            sanitizeAiReplyBranding(
              contract.reply,
              input.messageText,
              input.workspaceName,
            ),
            input.shouldUseGreeting,
            input.customerName,
          );

      return {
        success: true,
        reply,
        handoffRequired,
        handoffReason: contract.handoffReason,
        generationTimeMs,
        inputTokens: response.usage?.input_tokens ?? 0,
        outputTokens: response.usage?.output_tokens ?? 0,
        usedFallback: false,
      };
    } catch (error) {
      return buildFallbackResult(
        Date.now() - startedAt,
        error instanceof Error ? error.message : String(error),
      );
    }
  },
};
