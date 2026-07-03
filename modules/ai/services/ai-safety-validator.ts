import type {
  ValidateAIResponseParams,
  ValidateAIResponseResult,
} from "@/modules/ai/types/ai-safety-validator";
import { MAX_AI_REPLY_CHARACTERS } from "@/modules/ai/types/ai-safety-validator";
import type { BusinessBrainContext } from "@/modules/business-brain/types/context";

const DESKLABS_PATTERN = /\bdesklabs\b/i;

const CHATBOT_PHRASE_PATTERNS = [
  /\bsebagai\s+ai\b/i,
  /\bsaya\s+adalah\s+chatbot\b/i,
  /\bsaya\s+chatbot\b/i,
  /\bberdasarkan\s+data\s+yang\s+tersedia\b/i,
  /\bsebagai\s+asisten\s+ai\b/i,
  /\bas\s+an\s+ai\b/i,
  /\bi\s+am\s+a\s+chatbot\b/i,
];

const NEGOTIATION_PATTERNS = [
  /\bnego(siasi)?\b/i,
  /\bnegosiasi\s+harga\b/i,
  /\bdiskon\b/i,
  /\bpotongan\b/i,
  /\blebih\s+murah\b/i,
  /\bkurangin\s+harga\b/i,
  /\bbisa\s+nego\b/i,
  /\bkasih\s+potongan\b/i,
];

const SEAT_AVAILABILITY_PATTERNS = [
  /\bkursi\s+(masih\s+)?tersedia\b/i,
  /\bseat\s+(is\s+)?available\b/i,
  /\bmasih\s+ada\s+(slot|kursi)\b/i,
  /\bguaranteed\s+seat\b/i,
  /\bpast(i|i)\s+ada\s+kursi\b/i,
  /\bjamin\s+ada\s+kursi\b/i,
];

const BOOKING_CONFIRMATION_PATTERNS = [
  /\bbooking\s+(sudah\s+)?(ter)?konfirmasi\b/i,
  /\bsudah\s+terkonfirmasi\b/i,
  /\bfix\s+booking\b/i,
  /\bpesan(an)?\s+sudah\s+(di-?)?book\b/i,
  /\bkami\s+konfirmasi\s+booking\b/i,
  /\breservasi\s+sudah\s+fix\b/i,
];

const PAYMENT_CONFIRMATION_PATTERNS = [
  /\bpembayaran\s+(sudah\s+)?(kami\s+)?terima\b/i,
  /\bpayment\s+(has\s+been\s+)?confirmed\b/i,
  /\bsudah\s+kami\s+terima\s+transfer\b/i,
  /\bbukti\s+pembayaran\s+sudah\s+valid\b/i,
  /\btransfer\s+sudah\s+masuk\b/i,
];

const REFUND_DECISION_PATTERNS = [
  /\brefund\s+(sudah\s+)?(di)?setujui\b/i,
  /\bpengembalian\s+dana\s+(sudah\s+)?(di)?proses\b/i,
  /\bkami\s+proses\s+refund\b/i,
  /\bpembatalan\s+disetujui\b/i,
];

const COMPLAINT_CUSTOMER_PATTERNS = [
  /\bkomplain\b/i,
  /\bkeluhan\b/i,
  /\bkecewa\b/i,
  /\btidak\s+puas\b/i,
  /\bcomplaint\b/i,
];

const DOCUMENT_SENT_CLAIM_PATTERNS = [
  /\bsudah\s+(saya\s+)?kirim(kan)?\b/i,
  /\btelah\s+(saya\s+)?kirim(kan)?\b/i,
  /\bsaya\s+kirim(kan)?\b/i,
  /\bterlampir\b/i,
  /\bfile\s+(sudah\s+)?terkirim\b/i,
  /\bdokumen\s+sudah\s+dikirim\b/i,
  /\bcek\s+file\s+yang\s+sudah\b/i,
];

const ITINERARY_DAY_PATTERN = /\b(hari|day)\s*\d+\b/i;

const GREETING_PATTERNS = [
  /^halo\s+kak[,!.\s]*/i,
  /^hai\s+kak[,!.\s]*/i,
  /^halo[,!.\s]*/i,
  /^hai[,!.\s]*/i,
  /^selamat\s+(pagi|siang|sore|malam)[,!.\s]*/i,
];

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function customerAskedAboutDesklabs(messageText: string): boolean {
  return DESKLABS_PATTERN.test(messageText);
}

function matchesAnyPattern(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function buildKnownBrainTerms(context: BusinessBrainContext): string[] {
  const terms = new Set<string>();

  for (const product of context.products) {
    for (const value of [product.name, product.destination, ...product.highlights]) {
      const normalized = value?.trim().toLowerCase();
      if (normalized && normalized.length >= 3) {
        terms.add(normalized);
      }
    }
  }

  for (const article of context.knowledge) {
    const normalized = article.title.trim().toLowerCase();
    if (normalized.length >= 3) {
      terms.add(normalized);
    }
  }

  for (const document of context.documents) {
    const normalized = document.name.trim().toLowerCase();
    if (normalized.length >= 3) {
      terms.add(normalized);
    }
  }

  if (context.companyDNA?.companyName) {
    terms.add(context.companyDNA.companyName.trim().toLowerCase());
  }

  return [...terms];
}

function replyMentionsUnknownPackage(reply: string, context: BusinessBrainContext): boolean {
  if (context.products.length === 0 && context.knowledge.length === 0) {
    if (ITINERARY_DAY_PATTERN.test(reply)) {
      return true;
    }

    const detailedItineraryHints = [
      "itinerary lengkap",
      "jadwal harian",
      "program hari",
      "rute perjalanan",
    ];

    const normalized = normalizeText(reply);
    return detailedItineraryHints.some((hint) => normalized.includes(hint));
  }

  const knownTerms = buildKnownBrainTerms(context);
  const normalizedReply = normalizeText(reply);

  const hasKnownReference = knownTerms.some((term) => normalizedReply.includes(term));
  if (hasKnownReference) {
    return false;
  }

  const packageLikePatterns = [
    /\bpaket\s+[a-z0-9][a-z0-9\s-]{2,40}\b/i,
    /\btour\s+[a-z0-9][a-z0-9\s-]{2,40}\b/i,
    /\btrip\s+[a-z0-9][a-z0-9\s-]{2,40}\b/i,
  ];

  return packageLikePatterns.some((pattern) => pattern.test(reply));
}

function violatesNeverDoBehaviors(
  reply: string,
  context: BusinessBrainContext,
): string | null {
  const neverDoRules = context.behaviors.filter(
    (behavior) => behavior.type === "NEVER_DO" && behavior.enabled,
  );

  const normalizedReply = normalizeText(reply);

  for (const rule of neverDoRules) {
    const needles = [rule.name, rule.description]
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value.length >= 4);

    for (const needle of needles) {
      if (normalizedReply.includes(needle)) {
        return `Violates Business Brain rule: ${rule.name}`;
      }
    }
  }

  return null;
}

function stripChatbotPhrases(reply: string): string {
  let sanitized = reply;

  for (const pattern of CHATBOT_PHRASE_PATTERNS) {
    sanitized = sanitized.replace(pattern, "").trim();
  }

  sanitized = sanitized.replace(DESKLABS_PATTERN, "tim kami");
  return sanitized.replace(/\s{2,}/g, " ").trim();
}

function stripRepeatedGreeting(reply: string): string {
  let sanitized = reply.trim();

  for (const pattern of GREETING_PATTERNS) {
    const next = sanitized.replace(pattern, "").trim();
    if (next !== sanitized) {
      sanitized = next;
    }
  }

  return sanitized;
}

function stripRepeatedCustomerName(reply: string, customerName?: string): string {
  const firstName = customerName?.trim().split(/\s+/)[0];
  if (!firstName || firstName.length < 2) {
    return reply;
  }

  const escaped = firstName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const namePatterns = [
    new RegExp(`\\bkak\\s+${escaped}\\b`, "gi"),
    new RegExp(`\\b${escaped}\\b`, "gi"),
  ];

  let sanitized = reply;
  let replaced = false;

  for (const pattern of namePatterns) {
    const next = sanitized.replace(pattern, (match, offset) => {
      if (!replaced && offset < 40) {
        replaced = true;
        return match;
      }
      return "";
    });

    sanitized = next;
  }

  return sanitized.replace(/\s{2,}/g, " ").replace(/^[,.\s]+/, "").trim();
}

function sanitizeReply(params: ValidateAIResponseParams): {
  sanitizedReply: string;
  changed: boolean;
} {
  const companyReplacement =
    params.companyName?.trim() && params.companyName !== "tim kami"
      ? params.companyName.trim()
      : "tim kami";

  let sanitized = params.reply.trim();

  if (
    DESKLABS_PATTERN.test(sanitized) &&
    !customerAskedAboutDesklabs(params.customerMessage)
  ) {
    sanitized = sanitized.replace(DESKLABS_PATTERN, companyReplacement);
  }

  sanitized = stripChatbotPhrases(sanitized);

  if (params.hasPriorBusinessReplies) {
    sanitized = stripRepeatedGreeting(sanitized);
  }

  sanitized = stripRepeatedCustomerName(sanitized, params.customerName);

  sanitized = sanitized.replace(/\s{2,}/g, " ").trim();

  return {
    sanitizedReply: sanitized,
    changed: sanitized !== params.reply.trim(),
  };
}

function evaluateBlockingRules(
  reply: string,
  params: ValidateAIResponseParams,
): string | null {
  if (
    DESKLABS_PATTERN.test(reply) &&
    !customerAskedAboutDesklabs(params.customerMessage)
  ) {
    return "Reply mentions Desklabs to customer";
  }

  if (matchesAnyPattern(reply, NEGOTIATION_PATTERNS)) {
    return "Reply negotiates price";
  }

  if (matchesAnyPattern(reply, SEAT_AVAILABILITY_PATTERNS)) {
    return "Reply promises seat availability";
  }

  if (matchesAnyPattern(reply, BOOKING_CONFIRMATION_PATTERNS)) {
    return "Reply confirms booking";
  }

  if (matchesAnyPattern(reply, PAYMENT_CONFIRMATION_PATTERNS)) {
    return "Reply confirms payment";
  }

  if (matchesAnyPattern(reply, REFUND_DECISION_PATTERNS)) {
    return "Reply discusses refund decision";
  }

  const customerComplaint = matchesAnyPattern(
    params.customerMessage,
    COMPLAINT_CUSTOMER_PATTERNS,
  );

  if (customerComplaint && !params.handoffRequired) {
    return "Customer complaint requires human assistance";
  }

  if (replyMentionsUnknownPackage(reply, params.businessBrainContext)) {
    return "Reply may invent package or itinerary outside Business Brain";
  }

  const neverDoViolation = violatesNeverDoBehaviors(
    reply,
    params.businessBrainContext,
  );
  if (neverDoViolation) {
    return neverDoViolation;
  }

  const hasPendingDocumentActions =
    (params.documentActions?.length ?? 0) > 0 ||
    (params.actions?.some((action) => action.type === "SEND_DOCUMENT") ?? false);
  if (
    hasPendingDocumentActions &&
    matchesAnyPattern(reply, DOCUMENT_SENT_CLAIM_PATTERNS)
  ) {
    return "Reply claims document was sent before delivery";
  }

  if (reply.length > MAX_AI_REPLY_CHARACTERS) {
    return `Reply exceeds ${MAX_AI_REPLY_CHARACTERS} characters`;
  }

  return null;
}

export function validateAIResponse(
  params: ValidateAIResponseParams,
): ValidateAIResponseResult {
  if (params.handoffRequired) {
    return {
      allowed: false,
      forceHandoff: true,
      reason: params.handoffReason ?? "LLM marked handoff required",
    };
  }

  const blockReason = evaluateBlockingRules(params.reply, params);
  if (blockReason) {
    return {
      allowed: false,
      forceHandoff: true,
      reason: blockReason,
    };
  }

  const { sanitizedReply, changed } = sanitizeReply(params);

  if (!sanitizedReply) {
    return {
      allowed: false,
      forceHandoff: true,
      reason: "Reply became empty after safety sanitization",
    };
  }

  const postSanitizeBlockReason = evaluateBlockingRules(sanitizedReply, params);
  if (postSanitizeBlockReason) {
    return {
      allowed: false,
      forceHandoff: true,
      reason: postSanitizeBlockReason,
    };
  }

  return {
    allowed: true,
    sanitizedReply,
    sanitized: changed,
  };
}
