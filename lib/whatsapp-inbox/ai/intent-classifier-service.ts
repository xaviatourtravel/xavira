import { classifyIntent as classifyTravelIntent } from "@/modules/ai/services/intent-classifier";
import type { ConversationMessage } from "@/modules/ai/types/intent-classifier";
import type { AiIntentClassification } from "@/lib/whatsapp-inbox/ai/types";

const HUMAN_INTENT_REASONS: Record<string, string> = {
  PAYMENT_PROOF: "Pelanggan mengirim bukti pembayaran",
  BOOKING_CONFIRMATION: "Pelanggan ingin konfirmasi booking",
  NEGOTIATION: "Pelanggan meminta negosiasi harga",
  REFUND: "Pelanggan meminta refund/pembatalan",
  COMPLAINT: "Pelanggan menyampaikan keluhan",
  PHONE_CALL: "Pelanggan meminta dihubungi via telepon",
  PRIVATE_TRIP: "Pelanggan meminta trip custom/private",
};

function mapToAiIntentClassification(
  result: ReturnType<typeof classifyTravelIntent>,
): AiIntentClassification {
  return {
    intent: result.intent,
    requiresHuman: result.requiresHuman,
    confidence: result.confidence,
    category: result.category,
    reason: result.requiresHuman
      ? (HUMAN_INTENT_REASONS[result.intent] ?? "Percakapan memerlukan bantuan tim")
      : undefined,
  };
}

/**
 * WhatsApp pipeline adapter over the shared travel intent classifier.
 */
export const intentClassifierService = {
  classifyIntent(
    messageText: string,
    conversationHistory: ConversationMessage[] = [],
  ): AiIntentClassification {
    return mapToAiIntentClassification(
      classifyTravelIntent({
        customerMessage: messageText,
        conversationHistory,
      }),
    );
  },
};

export type { ConversationMessage };
