import type {
  ClassifyIntentParams,
  IntentClassificationResult,
  TravelWorkspaceIntent,
} from "@/modules/ai/types/intent-classifier";
import {
  HUMAN_REQUIRED_INTENTS,
  INTENT_CATEGORIES,
  UNKNOWN_INTENT_MAX_CONFIDENCE,
} from "@/modules/ai/types/intent-classifier";

type IntentRule = {
  intent: TravelWorkspaceIntent;
  keywords: string[];
  confidence: number;
  requiresHuman?: boolean;
};

const HUMAN_REQUIRED_RULES: IntentRule[] = [
  {
    intent: "PAYMENT_PROOF",
    keywords: [
      "bukti transfer",
      "bukti bayar",
      "bukti dp",
      "bukti pembayaran",
      "sudah transfer",
      "struk",
      "screenshot transfer",
    ],
    confidence: 0.95,
    requiresHuman: true,
  },
  {
    intent: "BOOKING_CONFIRMATION",
    keywords: [
      "konfirmasi booking",
      "confirm booking",
      "fix booking",
      "booking fix",
      "saya book",
      "pesan paket",
      "mau fix",
    ],
    confidence: 0.93,
    requiresHuman: true,
  },
  {
    intent: "NEGOTIATION",
    keywords: [
      "nego",
      "negosiasi",
      "negotiate",
      "kurangin",
      "lebih murah",
      "turunin harga",
      "diskon",
      "discount",
      "potongan",
    ],
    confidence: 0.92,
    requiresHuman: true,
  },
  {
    intent: "REFUND",
    keywords: ["refund", "pengembalian", "pembatalan", "cancel trip", "batal trip"],
    confidence: 0.92,
    requiresHuman: true,
  },
  {
    intent: "COMPLAINT",
    keywords: [
      "komplain",
      "keluhan",
      "complaint",
      "kecewa",
      "marah",
      "kesal",
      "tidak puas",
      "jelek",
      "buruk sekali",
    ],
    confidence: 0.94,
    requiresHuman: true,
  },
  {
    intent: "PHONE_CALL",
    keywords: [
      "telepon",
      "telfon",
      "telpon",
      "call",
      "video call",
      "hubungi saya",
      "bisa telpon",
    ],
    confidence: 0.9,
    requiresHuman: true,
  },
  {
    intent: "PRIVATE_TRIP",
    keywords: [
      "private trip",
      "custom trip",
      "itinerary khusus",
      "request khusus",
      "trip khusus",
      "private tour",
      "trip private",
    ],
    confidence: 0.89,
    requiresHuman: true,
  },
];

const SAFE_INTENT_RULES: IntentRule[] = [
  {
    intent: "BROCHURE_REQUEST",
    keywords: ["brosur", "brochure", "pdf", "kirim file", "kirim dokumen", "download paket"],
    confidence: 0.9,
  },
  {
    intent: "ITINERARY_REQUEST",
    keywords: [
      "itinerary",
      "jadwal harian",
      "rute",
      "program hari",
      "aktivitas",
      "detail hari",
    ],
    confidence: 0.88,
  },
  {
    intent: "PACKAGE_RECOMMENDATION",
    keywords: [
      "rekomendasi",
      "rekomend",
      "recommend",
      "saran paket",
      "paket apa",
      "cocok untuk",
      "best package",
    ],
    confidence: 0.87,
  },
  {
    intent: "PRICE_INQUIRY",
    keywords: ["harga", "price", "biaya", "tarif", "berapa", "budget", "ongkos"],
    confidence: 0.88,
  },
  {
    intent: "VISA",
    keywords: ["visa", "paspor", "passport", "imigrasi"],
    confidence: 0.9,
  },
  {
    intent: "HALAL_FOOD",
    keywords: [
      "halal",
      "makanan halal",
      "makan halal",
      "sholat",
      "shalat",
      "masjid",
      "mushola",
      "muslim",
    ],
    confidence: 0.87,
  },
  {
    intent: "HOTEL",
    keywords: ["hotel", "akomodasi", "penginapan", "bintang", "kamar"],
    confidence: 0.86,
  },
  {
    intent: "FLIGHT",
    keywords: [
      "flight",
      "penerbangan",
      "tiket pesawat",
      "maskapai",
      "transit",
      "bagasi",
    ],
    confidence: 0.86,
  },
  {
    intent: "DEPARTURE_DATE",
    keywords: [
      "keberangkatan",
      "tanggal berangkat",
      "jadwal berangkat",
      "bulan depan",
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
    confidence: 0.85,
  },
  {
    intent: "PAYMENT",
    keywords: [
      "cara bayar",
      "metode pembayaran",
      "payment method",
      "transfer ke",
      "rekening",
      "bank",
      "cicilan",
      "dp",
      "down payment",
      "invoice",
    ],
    confidence: 0.84,
  },
  {
    intent: "BOOKING",
    keywords: [
      "cara booking",
      "proses booking",
      "mau booking",
      "ingin booking",
      "daftar trip",
      "join trip",
    ],
    confidence: 0.83,
  },
  {
    intent: "PACKAGE_INQUIRY",
    keywords: [
      "paket",
      "package",
      "tour",
      "trip",
      "open trip",
      "destinasi",
      "tujuan",
      "wisata",
    ],
    confidence: 0.86,
  },
  {
    intent: "GENERAL_GREETING",
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
      "sore kak",
      "malam kak",
    ],
    confidence: 0.9,
  },
];

const HUMAN_REQUIRED_INTENT_SET = new Set<string>(HUMAN_REQUIRED_INTENTS);

function normalize(text: string) {
  return text.trim().toLowerCase();
}

function includesAny(haystack: string, needles: string[]) {
  return needles.some((needle) => haystack.includes(needle));
}

function buildClassificationText(params: ClassifyIntentParams) {
  const customerText = normalize(params.customerMessage);
  const recentCustomerTurns = params.conversationHistory
    .filter((turn) => turn.sender === "customer")
    .slice(-2)
    .map((turn) => normalize(turn.text))
    .join(" ");

  return [customerText, recentCustomerTurns].filter(Boolean).join(" ");
}

function matchIntentRule(text: string, rules: IntentRule[]) {
  for (const rule of rules) {
    if (includesAny(text, rule.keywords)) {
      return rule;
    }
  }

  return null;
}

function buildResult(
  intent: TravelWorkspaceIntent,
  confidence: number,
): IntentClassificationResult {
  const requiresHuman = HUMAN_REQUIRED_INTENT_SET.has(intent);

  return {
    intent,
    confidence,
    requiresHuman,
    category: INTENT_CATEGORIES[intent],
  };
}

function classifyUnknown(): IntentClassificationResult {
  return {
    intent: "UNKNOWN",
    confidence: UNKNOWN_INTENT_MAX_CONFIDENCE,
    requiresHuman: false,
    category: INTENT_CATEGORIES.UNKNOWN,
  };
}

/**
 * Rule-based travel workspace intent classifier.
 * Runs before context build / LLM calls.
 */
export function classifyIntent(
  params: ClassifyIntentParams,
): IntentClassificationResult {
  const customerText = normalize(params.customerMessage);

  if (!customerText) {
    return classifyUnknown();
  }

  const classificationText = buildClassificationText(params);

  const humanRule = matchIntentRule(classificationText, HUMAN_REQUIRED_RULES);
  if (humanRule) {
    return buildResult(humanRule.intent, humanRule.confidence);
  }

  const safeRule = matchIntentRule(classificationText, SAFE_INTENT_RULES);
  if (safeRule) {
    return buildResult(safeRule.intent, safeRule.confidence);
  }

  if (customerText.includes("?")) {
    return buildResult("PACKAGE_INQUIRY", 0.52);
  }

  return classifyUnknown();
}
