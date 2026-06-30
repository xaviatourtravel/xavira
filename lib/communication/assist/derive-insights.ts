// Insight percakapan berbasis aturan (deterministik, tanpa LLM).
//
// CATATAN ARSITEKTUR: semua logika di sini murni dan sinkron. Untuk mengganti
// dengan AI sungguhan nanti, cukup ganti implementasi `deriveConversationInsights`
// tanpa mengubah bentuk keluarannya, sehingga UI tidak perlu berubah.

import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";

export type ConversationIntent =
  | "price_inquiry"
  | "booking_interest"
  | "general_question"
  | "unknown";

export type ConversationSentiment = "positive" | "neutral" | "concerned";

export type ConversationPriority = "high" | "medium";

export type SuggestedNextAction =
  | "send_itinerary"
  | "answer_pricing"
  | "follow_up"
  | "convert_lead";

export type ConversationInsights = {
  intent: ConversationIntent;
  intentLabel: string;
  sentiment: ConversationSentiment;
  sentimentLabel: string;
  priority: ConversationPriority;
  priorityLabel: string;
  nextAction: SuggestedNextAction;
  nextActionLabel: string;
  lastCustomerMessage: string | null;
};

const INTENT_LABELS: Record<ConversationIntent, string> = {
  price_inquiry: "Tanya Harga",
  booking_interest: "Minat Booking",
  general_question: "Pertanyaan Umum",
  unknown: "Belum Diketahui",
};

const SENTIMENT_LABELS: Record<ConversationSentiment, string> = {
  positive: "Positif",
  neutral: "Netral",
  concerned: "Perlu Perhatian",
};

const PRIORITY_LABELS: Record<ConversationPriority, string> = {
  high: "Tinggi",
  medium: "Sedang",
};

const NEXT_ACTION_LABELS: Record<SuggestedNextAction, string> = {
  send_itinerary: "Kirim itinerary",
  answer_pricing: "Jawab harga",
  follow_up: "Tindak lanjut",
  convert_lead: "Konversi jadi lead",
};

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

function getLastCustomerMessage(
  conversation: OmnichannelConversationDetail,
): string | null {
  for (let index = conversation.messages.length - 1; index >= 0; index -= 1) {
    const message = conversation.messages[index];
    if (message.direction === "incoming" && message.message_text?.trim()) {
      return message.message_text.trim();
    }
  }
  return conversation.lastMessagePreview ?? null;
}

function detectIntent(message: string): ConversationIntent {
  if (includesAny(message, ["harga", "price", "biaya", "tarif", "berapa"])) {
    return "price_inquiry";
  }
  if (includesAny(message, ["booking", "daftar", "pesan", "book", "reservasi"])) {
    return "booking_interest";
  }
  if (
    message.includes("?") ||
    includesAny(message, ["apa", "bagaimana", "kapan", "bisakah", "apakah", "gimana"])
  ) {
    return "general_question";
  }
  return "unknown";
}

function detectSentiment(message: string): ConversationSentiment {
  if (
    includesAny(message, [
      "komplain",
      "kecewa",
      "lama",
      "mahal",
      "batal",
      "refund",
      "marah",
      "buruk",
      "tidak puas",
    ])
  ) {
    return "concerned";
  }
  if (
    includesAny(message, [
      "terima kasih",
      "makasih",
      "mantap",
      "oke",
      "ok",
      "baik",
      "bagus",
      "senang",
      "👍",
      "🙏",
      "😊",
    ])
  ) {
    return "positive";
  }
  return "neutral";
}

/**
 * Menurunkan insight ringan dari sebuah percakapan secara deterministik.
 */
export function deriveConversationInsights(
  conversation: OmnichannelConversationDetail,
): ConversationInsights {
  const lastCustomerMessage = getLastCustomerMessage(conversation);
  const normalized = (lastCustomerMessage ?? "").toLowerCase();

  const intent = detectIntent(normalized);
  const sentiment = detectSentiment(normalized);

  const isUnread = conversation.unreadCount > 0;
  const hasHotKeywords = includesAny(normalized, [
    "booking",
    "daftar",
    "harga",
  ]);
  const priority: ConversationPriority =
    isUnread || hasHotKeywords ? "high" : "medium";

  let nextAction: SuggestedNextAction;
  if (includesAny(normalized, ["itinerary", "paket", "rincian", "detail"])) {
    nextAction = "send_itinerary";
  } else if (intent === "price_inquiry") {
    nextAction = "answer_pricing";
  } else if (intent === "booking_interest" && !conversation.leadId) {
    nextAction = "convert_lead";
  } else {
    nextAction = "follow_up";
  }

  return {
    intent,
    intentLabel: INTENT_LABELS[intent],
    sentiment,
    sentimentLabel: SENTIMENT_LABELS[sentiment],
    priority,
    priorityLabel: PRIORITY_LABELS[priority],
    nextAction,
    nextActionLabel: NEXT_ACTION_LABELS[nextAction],
    lastCustomerMessage,
  };
}
