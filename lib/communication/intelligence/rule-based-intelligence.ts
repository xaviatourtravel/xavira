// Intelijen percakapan berbasis aturan (deterministik, tanpa LLM).
//
// CATATAN ARSITEKTUR: seluruh logika di sini murni dan sinkron sehingga cepat
// dan dapat diprediksi. Untuk mengganti dengan AI sungguhan nanti, cukup ganti
// implementasi `buildRuleBasedIntelligence` tanpa mengubah bentuk keluarannya,
// sehingga UI (tab Intelijen, composer, brief Today) tidak perlu berubah.

import type { MessageRow } from "@/types/omnichannel-inbox";

export type IntelligenceIntent =
  | "price_inquiry"
  | "booking_interest"
  | "destination_interest"
  | "muslim_friendly"
  | "hotel_concern"
  | "departure_date"
  | "pax"
  | "general_question"
  | "unknown";

export type IntelligenceSentiment = "positive" | "neutral" | "concerned";
export type IntelligencePriority = "high" | "medium";

export type IntelligenceEntities = {
  destination: string | null;
  pax: string | null;
  departure: string | null;
  budget: string | null;
  concern: string | null;
  latestQuestion: string | null;
  latestCustomerMessage: string | null;
};

export type RuleBasedIntelligence = {
  hasData: boolean;
  summary: string | null;
  intent: IntelligenceIntent;
  intentLabel: string;
  sentiment: IntelligenceSentiment;
  sentimentLabel: string;
  priority: IntelligencePriority;
  priorityLabel: string;
  entities: IntelligenceEntities;
  nextActionLabel: string;
  suggestedReply: string;
};

export type IntelligenceMessageInput = Pick<
  MessageRow,
  "direction" | "message_text" | "created_at"
>;

export type IntelligenceConversationMeta = {
  displayName: string;
  channelLabel: string;
  statusLabel: string;
  unreadCount: number;
  leadId: string | null;
};

const RECENT_MESSAGE_LIMIT = 20;

const INTENT_LABELS: Record<IntelligenceIntent, string> = {
  price_inquiry: "Tanya Harga",
  booking_interest: "Minat Booking",
  destination_interest: "Minat Destinasi",
  muslim_friendly: "Muslim Friendly",
  hotel_concern: "Soal Hotel",
  departure_date: "Tanggal Berangkat",
  pax: "Jumlah Peserta",
  general_question: "Pertanyaan Umum",
  unknown: "Belum Diketahui",
};

const SENTIMENT_LABELS: Record<IntelligenceSentiment, string> = {
  positive: "Positif",
  neutral: "Netral",
  concerned: "Perlu Perhatian",
};

const PRIORITY_LABELS: Record<IntelligencePriority, string> = {
  high: "Tinggi",
  medium: "Sedang",
};

const DESTINATIONS: { match: string[]; label: string }[] = [
  { match: ["yunnan", "kunming", "lijiang", "shangri"], label: "Yunnan" },
  { match: ["xinjiang", "urumqi", "kashgar"], label: "Xinjiang" },
  { match: ["xian", "xi'an"], label: "Xi'an" },
  { match: ["chongqing"], label: "Chongqing" },
  { match: ["beijing"], label: "Beijing" },
  { match: ["shanghai"], label: "Shanghai" },
  { match: ["guilin"], label: "Guilin" },
  { match: ["zhangjiajie"], label: "Zhangjiajie" },
  { match: ["chengdu"], label: "Chengdu" },
  { match: ["jepang", "japan", "tokyo", "osaka", "kyoto"], label: "Jepang" },
  { match: ["korea", "seoul"], label: "Korea" },
  { match: ["umrah", "umroh"], label: "Umrah" },
  { match: ["turki", "turkey", "istanbul"], label: "Turki" },
  { match: ["dubai"], label: "Dubai" },
  { match: ["eropa", "europe"], label: "Eropa" },
  { match: ["china", "tiongkok", "tibet"], label: "China" },
];

const MONTHS = [
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
];

const PRICE_KEYWORDS = ["harga", "price", "biaya", "tarif", "berapa", "budget"];
const BOOKING_KEYWORDS = [
  "booking",
  "daftar",
  "ikut",
  "seat",
  "dp",
  "pesan",
  "reservasi",
  "book",
];
const MUSLIM_KEYWORDS = [
  "halal",
  "makanan",
  "makan",
  "sholat",
  "shalat",
  "masjid",
  "mushola",
  "musholla",
  "syariat",
  "syariah",
];
const HOTEL_KEYWORDS = ["hotel", "kamar", "room", "bintang", "penginapan"];
const PAX_KEYWORDS = [
  "pax",
  "orang",
  "berdua",
  "bertiga",
  "berempat",
  "keluarga",
  "peserta",
  "rombongan",
];
const QUESTION_WORDS = [
  "apa",
  "apakah",
  "bagaimana",
  "gimana",
  "kapan",
  "berapa",
  "bisakah",
  "boleh",
  "kah",
];

function normalize(text: string | null | undefined): string {
  return (text ?? "").toLowerCase();
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

function findDestination(text: string): string | null {
  for (const destination of DESTINATIONS) {
    if (includesAny(text, destination.match)) {
      return destination.label;
    }
  }
  return null;
}

function findPax(text: string): string | null {
  const numbered = text.match(/(\d+)\s*(orang|pax|peserta|pax|jamaah|jemaah)/);
  if (numbered) {
    return `${numbered[1]} orang`;
  }
  if (text.includes("berdua")) return "2 orang";
  if (text.includes("bertiga")) return "3 orang";
  if (text.includes("berempat")) return "4 orang";
  if (text.includes("keluarga")) return "Keluarga";
  if (text.includes("rombongan")) return "Rombongan";
  return null;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function findDeparture(text: string): string | null {
  const month = MONTHS.find((name) => text.includes(name)) ?? null;
  const day = text.match(/tanggal\s*(\d{1,2})/);

  if (day && month) {
    return `Tanggal ${day[1]} ${capitalize(month)}`;
  }
  if (month) {
    return capitalize(month);
  }
  if (day) {
    return `Tanggal ${day[1]}`;
  }
  return null;
}

function findBudget(text: string): string | null {
  const match = text.match(/(rp\s?)?\d[\d.,]*\s*(juta|jt|ribu|rb|k)\b/);
  if (match) {
    return match[0].trim();
  }
  return null;
}

function findConcern(text: string): string | null {
  if (includesAny(text, MUSLIM_KEYWORDS)) {
    return "Muslim-friendly (halal/sholat)";
  }
  if (includesAny(text, HOTEL_KEYWORDS)) {
    return "Hotel / kamar";
  }
  if (includesAny(text, ["visa"])) {
    return "Visa";
  }
  if (includesAny(text, ["refund", "batal", "pembatalan", "cancel"])) {
    return "Pembatalan / refund";
  }
  return null;
}

function detectPrimaryIntent(text: string): IntelligenceIntent {
  if (!text) {
    return "unknown";
  }
  // Concern spesifik diutamakan agar balasan sesuai konteks.
  if (includesAny(text, MUSLIM_KEYWORDS)) return "muslim_friendly";
  if (includesAny(text, HOTEL_KEYWORDS)) return "hotel_concern";
  if (includesAny(text, PRICE_KEYWORDS)) return "price_inquiry";
  if (includesAny(text, BOOKING_KEYWORDS)) return "booking_interest";
  if (findDestination(text)) return "destination_interest";
  if (text.includes("tanggal") || text.includes("berangkat") || text.includes("bulan") || MONTHS.some((m) => text.includes(m))) {
    return "departure_date";
  }
  if (includesAny(text, PAX_KEYWORDS)) return "pax";
  if (text.includes("?") || includesAny(text, QUESTION_WORDS)) {
    return "general_question";
  }
  return "unknown";
}

function detectSentiment(text: string): IntelligenceSentiment {
  if (
    includesAny(text, [
      "komplain",
      "kecewa",
      "lama",
      "mahal",
      "batal",
      "refund",
      "marah",
      "buruk",
      "tidak puas",
      "kok belum",
    ])
  ) {
    return "concerned";
  }
  if (
    includesAny(text, [
      "terima kasih",
      "makasih",
      "thanks",
      "mantap",
      "oke",
      "baik kak",
      "siap",
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

function buildSuggestedReply(
  intent: IntelligenceIntent,
  destination: string | null,
): string {
  switch (intent) {
    case "destination_interest":
      return `Baik Kak, untuk ${destination ?? "destinasi tersebut"} saya bantu cek jadwal dan ketersediaannya ya. Kakak rencana berangkat bulan apa dan untuk berapa orang?`;
    case "price_inquiry":
      return "Baik Kak, saya kirimkan detail harga dan itinerary-nya ya. Untuk estimasi terbaik, boleh info rencana berangkat bulan apa dan berapa pax?";
    case "muslim_friendly":
      return "Insya Allah Kak, untuk perjalanan Muslim-friendly restoran yang dipilih sudah diseleksi tim agar sesuai syariat Islam, dan waktu sholat juga kami perhatikan dalam itinerary.";
    case "hotel_concern":
      return "Baik Kak, saya bantu cek opsi hotelnya. Untuk preferensi, Kakak ingin standard, superior, atau upgrade hotel?";
    case "booking_interest":
      return "Baik Kak, untuk booking saya bantu siapkan datanya ya. Boleh info nama lengkap, jumlah peserta, dan tanggal keberangkatannya?";
    case "departure_date":
      return "Baik Kak, untuk tanggal tersebut saya cek ketersediaan jadwalnya dulu ya. Untuk berapa orang rencananya, dan ada destinasi yang sudah diincar?";
    case "pax":
      return "Baik Kak, noted untuk jumlah pesertanya. Boleh info tujuan dan rencana tanggal berangkatnya supaya saya bantu carikan paket yang pas?";
    default:
      return "Halo Kak, apakah ada yang bisa saya bantu lebih lanjut? Saya siap bantu carikan paket yang paling cocok.";
  }
}

function buildNextActionLabel(
  intent: IntelligenceIntent,
  meta: IntelligenceConversationMeta,
): string {
  switch (intent) {
    case "price_inquiry":
      return "Kirim harga & itinerary";
    case "destination_interest":
      return "Cek jadwal & kirim itinerary";
    case "muslim_friendly":
      return "Jelaskan layanan Muslim-friendly";
    case "hotel_concern":
      return "Tawarkan opsi hotel";
    case "booking_interest":
      return meta.leadId ? "Proses booking" : "Konversi jadi lead & proses booking";
    case "departure_date":
    case "pax":
      return "Tindak lanjut detail perjalanan";
    default:
      return meta.unreadCount > 0 ? "Balas pelanggan" : "Tindak lanjut";
  }
}

function buildSummary(
  meta: IntelligenceConversationMeta,
  totalText: number,
  entities: IntelligenceEntities,
): string {
  const parts: string[] = [
    `${meta.displayName} via ${meta.channelLabel}, ${totalText} pesan, status ${meta.statusLabel}.`,
  ];

  if (entities.destination) {
    parts.push(`Tertarik ${entities.destination}.`);
  }
  if (entities.pax) {
    parts.push(`Peserta ${entities.pax}.`);
  }
  if (entities.departure) {
    parts.push(`Rencana ${entities.departure}.`);
  }
  if (entities.concern) {
    parts.push(`Perhatian: ${entities.concern}.`);
  }
  if (entities.latestQuestion) {
    parts.push(`Pertanyaan terakhir: "${entities.latestQuestion}".`);
  }

  return parts.join(" ");
}

function emptyIntelligence(): RuleBasedIntelligence {
  return {
    hasData: false,
    summary: null,
    intent: "unknown",
    intentLabel: INTENT_LABELS.unknown,
    sentiment: "neutral",
    sentimentLabel: SENTIMENT_LABELS.neutral,
    priority: "medium",
    priorityLabel: PRIORITY_LABELS.medium,
    entities: {
      destination: null,
      pax: null,
      departure: null,
      budget: null,
      concern: null,
      latestQuestion: null,
      latestCustomerMessage: null,
    },
    nextActionLabel: "Tindak lanjut",
    suggestedReply: buildSuggestedReply("unknown", null),
  };
}

/**
 * Membangun intelijen percakapan dari riwayat pesan nyata.
 *
 * Mengambil maksimal 20 pesan terakhir yang memiliki teks (incoming + outgoing),
 * lalu menurunkan ringkasan, intent, sentimen, prioritas, entitas, saran
 * tindakan, dan saran balasan secara deterministik.
 */
export function buildRuleBasedIntelligence(
  meta: IntelligenceConversationMeta,
  messages: IntelligenceMessageInput[],
): RuleBasedIntelligence {
  // Abaikan pesan kosong/media-only; pertahankan urutan menaik (lama -> baru).
  const textMessages = messages
    .filter((message) => message.message_text?.trim())
    .slice(-RECENT_MESSAGE_LIMIT);

  if (textMessages.length === 0) {
    return emptyIntelligence();
  }

  // Cari dari pesan terbaru ke terlama untuk entitas "terakhir disebut".
  let latestCustomerMessage: string | null = null;
  let latestQuestion: string | null = null;
  let destination: string | null = null;
  let pax: string | null = null;
  let departure: string | null = null;
  let budget: string | null = null;
  let concern: string | null = null;

  for (let index = textMessages.length - 1; index >= 0; index -= 1) {
    const message = textMessages[index];
    const raw = message.message_text?.trim() ?? "";
    const text = raw.toLowerCase();

    if (message.direction === "incoming") {
      if (!latestCustomerMessage) {
        latestCustomerMessage = raw;
      }
      if (!latestQuestion && (text.includes("?") || includesAny(text, QUESTION_WORDS))) {
        latestQuestion = raw;
      }
    }

    if (!destination) destination = findDestination(text);
    if (!pax) pax = findPax(text);
    if (!departure) departure = findDeparture(text);
    if (!budget) budget = findBudget(text);
    if (!concern) concern = findConcern(text);
  }

  const entities: IntelligenceEntities = {
    destination,
    pax,
    departure,
    budget,
    concern,
    latestQuestion,
    latestCustomerMessage,
  };

  // Intent & sentimen diturunkan dari pesan pelanggan terakhir bila ada,
  // fallback ke pesan terakhir mana pun.
  const basis = normalize(
    latestCustomerMessage ?? textMessages[textMessages.length - 1].message_text,
  );
  const intent = detectPrimaryIntent(basis);
  const sentiment = detectSentiment(basis);

  const hotKeywords = includesAny(basis, [
    "booking",
    "daftar",
    "harga",
    "dp",
    "seat",
  ]);
  const priority: IntelligencePriority =
    meta.unreadCount > 0 || hotKeywords || sentiment === "concerned"
      ? "high"
      : "medium";

  return {
    hasData: true,
    summary: buildSummary(meta, textMessages.length, entities),
    intent,
    intentLabel: INTENT_LABELS[intent],
    sentiment,
    sentimentLabel: SENTIMENT_LABELS[sentiment],
    priority,
    priorityLabel: PRIORITY_LABELS[priority],
    entities,
    nextActionLabel: buildNextActionLabel(intent, meta),
    suggestedReply: buildSuggestedReply(intent, destination),
  };
}
