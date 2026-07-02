import type { AiIntentClassification } from "@/lib/whatsapp-inbox/ai/types";
import { containsBlockedSafetyTerms } from "@/lib/whatsapp-inbox/ai/safety-keywords";

export type WhatsappSafeIntent =
  | "greeting"
  | "package_inquiry"
  | "price_question"
  | "itinerary_question"
  | "departure_schedule"
  | "halal_food_question"
  | "payment_method_question"
  | "general_faq";

export type WhatsappHumanRequiredIntent =
  | "negotiation"
  | "discount_request"
  | "booking_confirmation"
  | "payment_proof"
  | "complaint"
  | "refund"
  | "phone_call_request"
  | "custom_private_trip"
  | "angry_customer";

export type WhatsappAiIntent =
  | WhatsappSafeIntent
  | WhatsappHumanRequiredIntent
  | "safety_blocked"
  | "unknown";

const HUMAN_INTENT_RULES: Array<{
  intent: WhatsappHumanRequiredIntent;
  keywords: string[];
  reason: string;
  confidence: number;
}> = [
  {
    intent: "payment_proof",
    keywords: [
      "bukti transfer",
      "bukti bayar",
      "bukti dp",
      "bukti pembayaran",
      "sudah transfer",
      "struk",
    ],
    reason: "Pelanggan mengirim bukti pembayaran",
    confidence: 0.95,
  },
  {
    intent: "booking_confirmation",
    keywords: [
      "konfirmasi booking",
      "fix booking",
      "mau booking",
      "saya book",
      "pesan paket",
    ],
    reason: "Pelanggan ingin konfirmasi booking",
    confidence: 0.92,
  },
  {
    intent: "negotiation",
    keywords: ["nego", "negosiasi", "negotiate", "kurangin", "lebih murah"],
    reason: "Pelanggan meminta negosiasi harga",
    confidence: 0.9,
  },
  {
    intent: "discount_request",
    keywords: ["diskon", "discount", "promo khusus", "potongan"],
    reason: "Pelanggan meminta diskon",
    confidence: 0.9,
  },
  {
    intent: "complaint",
    keywords: ["komplain", "keluhan", "complaint", "kecewa", "buruk"],
    reason: "Pelanggan menyampaikan keluhan",
    confidence: 0.93,
  },
  {
    intent: "refund",
    keywords: ["refund", "pengembalian", "batal", "pembatalan"],
    reason: "Pelanggan meminta refund/pembatalan",
    confidence: 0.92,
  },
  {
    intent: "phone_call_request",
    keywords: ["telepon", "telfon", "call", "video call", "hubungi saya"],
    reason: "Pelanggan meminta dihubungi via telepon",
    confidence: 0.88,
  },
  {
    intent: "custom_private_trip",
    keywords: [
      "private trip",
      "custom trip",
      "itinerary khusus",
      "request khusus",
      "trip khusus",
      "private tour",
    ],
    reason: "Pelanggan meminta trip custom/private",
    confidence: 0.87,
  },
  {
    intent: "angry_customer",
    keywords: ["marah", "kesal", "tidak puas", "jelek", "buruk sekali"],
    reason: "Pelanggan tampak tidak puas",
    confidence: 0.94,
  },
];

const SAFE_INTENT_RULES: Array<{
  intent: WhatsappSafeIntent;
  keywords: string[];
  confidence: number;
}> = [
  {
    intent: "greeting",
    keywords: [
      "halo",
      "hai",
      "hello",
      "hi",
      "selamat pagi",
      "selamat siang",
      "selamat sore",
      "selamat malam",
      "assalamualaikum",
      "pagi kak",
      "siang kak",
    ],
    confidence: 0.9,
  },
  {
    intent: "package_inquiry",
    keywords: [
      "paket",
      "package",
      "tour",
      "trip",
      "open trip",
      "destinasi",
      "tujuan",
    ],
    confidence: 0.86,
  },
  {
    intent: "price_question",
    keywords: ["harga", "price", "biaya", "tarif", "berapa", "budget"],
    confidence: 0.88,
  },
  {
    intent: "itinerary_question",
    keywords: [
      "itinerary",
      "jadwal harian",
      "rute",
      "program hari",
      "aktivitas",
    ],
    confidence: 0.85,
  },
  {
    intent: "departure_schedule",
    keywords: [
      "jadwal",
      "keberangkatan",
      "tanggal berangkat",
      "bulan",
      "januari",
      "februari",
      "maret",
      "april",
      "mei",
      "juni",
      "juli",
      "agustus",
      "september",
      "oktober",
      "november",
      "desember",
    ],
    confidence: 0.84,
  },
  {
    intent: "halal_food_question",
    keywords: [
      "halal",
      "makanan",
      "makan",
      "sholat",
      "shalat",
      "masjid",
      "mushola",
      "muslim",
    ],
    confidence: 0.87,
  },
  {
    intent: "payment_method_question",
    keywords: [
      "cara bayar",
      "metode pembayaran",
      "payment",
      "transfer ke",
      "rekening",
      "bank",
      "cicilan",
    ],
    confidence: 0.83,
  },
  {
    intent: "general_faq",
    keywords: [
      "info",
      "informasi",
      "tanya",
      "apakah",
      "bagaimana",
      "gimana",
      "bisa",
      "boleh",
      "?",
    ],
    confidence: 0.65,
  },
];

function normalize(text: string) {
  return text.trim().toLowerCase();
}

function includesAny(haystack: string, needles: string[]) {
  return needles.some((needle) => haystack.includes(needle));
}

function detectHumanRequiredIntent(text: string) {
  for (const rule of HUMAN_INTENT_RULES) {
    if (includesAny(text, rule.keywords)) {
      return rule;
    }
  }

  return null;
}

function detectSafeIntent(text: string) {
  for (const rule of SAFE_INTENT_RULES) {
    if (includesAny(text, rule.keywords)) {
      return rule;
    }
  }

  return {
    intent: "general_faq" as const,
    confidence: 0.55,
  };
}

/**
 * Rule-based intent classifier. Swap implementation for LLM later
 * without changing the pipeline contract.
 */
export const intentClassifierService = {
  classifyIntent(messageText: string): AiIntentClassification {
    const text = normalize(messageText);

    if (!text) {
      return {
        intent: "unknown",
        requiresHuman: true,
        reason: "Pesan kosong",
        confidence: 0.99,
      };
    }

    if (containsBlockedSafetyTerms(messageText)) {
      return {
        intent: "safety_blocked",
        requiresHuman: true,
        reason: "Topik sensitif memerlukan bantuan tim",
        confidence: 0.98,
      };
    }

    const humanRule = detectHumanRequiredIntent(text);
    if (humanRule) {
      return {
        intent: humanRule.intent,
        requiresHuman: true,
        reason: humanRule.reason,
        confidence: humanRule.confidence,
      };
    }

    const safeRule = detectSafeIntent(text);
    return {
      intent: safeRule.intent,
      requiresHuman: false,
      confidence: safeRule.confidence,
    };
  },
};
