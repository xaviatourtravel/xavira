import {
  buildRuleBasedIntelligence,
  type IntelligenceIntent,
  type IntelligenceMessageInput,
} from "@/lib/communication/intelligence/rule-based-intelligence";
import type { Locale } from "@/lib/i18n/config";
import type { InboxKey } from "@/lib/i18n/inbox-dictionary";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import { resolveWhatsappAiState } from "@/lib/whatsapp-inbox/ai/constants";

export type ReplyConfidenceLevel = "high" | "medium" | "low";

export type ReplySourceKey = "identity" | "product" | "knowledge" | "rules";

export type MissingContextKey = "refundPolicy" | "visaPolicy" | "pricing";

export type ReplyVariant =
  | "default"
  | "short"
  | "persuasive"
  | "friendly"
  | "professional";

export type SuggestedReplySource = {
  key: ReplySourceKey;
  active: boolean;
  href: string;
  labelKey: InboxKey;
};

export type SuggestedReplyResult = {
  text: string;
  confidence: number;
  confidenceLevel: ReplyConfidenceLevel;
  confidenceLabelKey: InboxKey;
  sources: SuggestedReplySource[];
  missingContext: MissingContextKey[];
  missingContextLabelKeys: Record<MissingContextKey, InboxKey>;
  canGenerate: boolean;
  intent: IntelligenceIntent;
};

const SOURCE_HREFS: Record<ReplySourceKey, string> = {
  identity: "/business-brain/identity",
  product: "/business-brain/products",
  knowledge: "/business-brain/knowledge",
  rules: "/business-brain/rules",
};

const SOURCE_LABEL_KEYS: Record<ReplySourceKey, InboxKey> = {
  identity: "sourceIdentity",
  product: "sourceProduct",
  knowledge: "sourceKnowledge",
  rules: "sourceRules",
};

const MISSING_LABEL_KEYS: Record<MissingContextKey, InboxKey> = {
  refundPolicy: "missingRefundPolicy",
  visaPolicy: "missingVisaPolicy",
  pricing: "missingPricing",
};

const INTERNATIONAL_DESTINATION_HINTS = [
  "japan",
  "jepang",
  "europe",
  "eropa",
  "korea",
  "turkey",
  "turki",
  "dubai",
  "singapore",
  "malaysia",
  "thailand",
  "bali",
  "umrah",
  "haji",
  "mesir",
  "egypt",
];

type ReplyTemplateSet = Record<IntelligenceIntent, string[]>;

const REPLY_TEMPLATES_ID: ReplyTemplateSet = {
  destination_interest: [
    "Baik Kak, untuk {destination} saya bantu cek jadwal dan ketersediaannya ya. Kakak rencana berangkat bulan apa dan untuk berapa orang?",
    "Siap Kak! Untuk {destination}, kami punya beberapa opsi paket yang bisa disesuaikan. Boleh info rencana keberangkatan dan jumlah penumpangnya?",
  ],
  price_inquiry: [
    "Baik Kak, saya kirimkan detail harga dan itinerary-nya ya. Untuk estimasi terbaik, boleh info rencana berangkat bulan apa dan berapa pax?",
    "Siap Kak, saya bantu rangkum opsi harga yang paling sesuai. Boleh tahu rencana keberangkatan dan jumlah pesertanya?",
  ],
  muslim_friendly: [
    "Insya Allah Kak, untuk perjalanan Muslim-friendly restoran yang dipilih sudah diseleksi tim agar sesuai syariat Islam, dan waktu sholat juga kami perhatikan dalam itinerary.",
    "Tenang Kak, layanan Muslim-friendly kami sudah termasuk pemilihan makanan halal dan penyesuaian waktu ibadah selama perjalanan.",
  ],
  hotel_concern: [
    "Baik Kak, saya bantu cek opsi hotelnya. Untuk preferensi, Kakak ingin standard, superior, atau upgrade hotel?",
    "Siap Kak, saya bisa bantu bandingkan beberapa opsi akomodasi sesuai budget dan preferensi Kakak.",
  ],
  booking_interest: [
    "Baik Kak, untuk booking saya bantu siapkan datanya ya. Boleh info nama lengkap, jumlah peserta, dan tanggal keberangkatannya?",
    "Siap Kak, saya bantu proses langkah booking-nya. Boleh konfirmasi jumlah peserta dan tanggal keberangkatan yang diinginkan?",
  ],
  departure_date: [
    "Baik Kak, untuk tanggal tersebut saya cek ketersediaan jadwalnya dulu ya. Untuk berapa orang rencananya, dan ada destinasi yang sudah diincar?",
    "Siap Kak, saya cek slot keberangkatan terdekat untuk tanggal tersebut. Boleh info jumlah penumpang dan destinasi yang diminati?",
  ],
  pax: [
    "Baik Kak, noted untuk jumlah pesertanya. Boleh info tujuan dan rencana tanggal berangkatnya supaya saya bantu carikan paket yang pas?",
    "Siap Kak, saya catat jumlah penumpangnya. Boleh share destinasi dan rencana keberangkatannya?",
  ],
  general_question: [
    "Halo Kak, apakah ada yang bisa saya bantu lebih lanjut? Saya siap bantu carikan paket yang paling cocok.",
    "Siap Kak, saya bantu jelaskan detailnya. Ada informasi spesifik yang ingin Kakak ketahui?",
  ],
  unknown: [
    "Halo Kak, terima kasih sudah menghubungi kami. Boleh tahu destinasi yang Kakak minati dan rencana keberangkatannya?",
    "Baik Kak, saya siap bantu. Boleh share destinasi dan rencana perjalanan yang Kakak inginkan?",
  ],
};

const REPLY_TEMPLATES_EN: ReplyTemplateSet = {
  destination_interest: [
    "Hi! For {destination}, I can check schedules and availability. When are you planning to travel, and for how many guests?",
    "Great choice! We have several {destination} packages we can tailor. May I know your travel dates and group size?",
  ],
  price_inquiry: [
    "I can share pricing and itinerary details. For the best estimate, may I know your travel month and number of guests?",
    "I'll help summarize the best pricing options. Could you share your departure plan and group size?",
  ],
  muslim_friendly: [
    "Our Muslim-friendly trips include halal meal arrangements and prayer-time considerations in the itinerary.",
    "We carefully select halal dining options and plan schedules with worship needs in mind.",
  ],
  hotel_concern: [
    "I can compare hotel options for you. Do you prefer standard, superior, or upgraded accommodation?",
    "Let me shortlist accommodation options that match your budget and preferences.",
  ],
  booking_interest: [
    "I can help prepare the booking details. May I have the full names, guest count, and departure date?",
    "Happy to guide you through booking. Please confirm guest count and preferred departure date.",
  ],
  departure_date: [
    "I'll check availability for that date. How many guests will travel, and which destination do you have in mind?",
    "Let me verify the nearest departure slots for that date. Could you share guest count and destination?",
  ],
  pax: [
    "Noted on the guest count. Which destination and departure date should I match packages for?",
    "Got it. Please share destination and travel dates so I can recommend the best fit.",
  ],
  general_question: [
    "Hello! How can I help you further? I'm ready to recommend the best package for you.",
    "Happy to help with more details. What specific information would you like to know?",
  ],
  unknown: [
    "Thanks for reaching out! Which destination interests you, and when are you planning to travel?",
    "I'm here to help. Could you share your destination and travel plans?",
  ],
};

function getLatestIncomingMessageId(messages: OmnichannelConversationDetail["messages"]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.direction === "incoming" && message.message_text?.trim()) {
      return message.id;
    }
  }
  return null;
}

function hasIncomingText(messages: OmnichannelConversationDetail["messages"]) {
  return messages.some(
    (message) => message.direction === "incoming" && message.message_text?.trim(),
  );
}

function pickDestination(conversation: OmnichannelConversationDetail): string | null {
  return (
    conversation.leadQualification?.fields.destination?.trim() ||
    conversation.conversationMemory?.destination?.memoryValue?.trim() ||
    null
  );
}

function hasBudget(conversation: OmnichannelConversationDetail) {
  return Boolean(
    conversation.leadQualification?.fields.budget?.trim() ||
      conversation.conversationMemory?.budget?.memoryValue?.trim(),
  );
}

function isInternationalDestination(destination: string | null) {
  if (!destination) return false;
  const normalized = destination.toLowerCase();
  return INTERNATIONAL_DESTINATION_HINTS.some((hint) => normalized.includes(hint));
}

function resolveConfidenceLevel(score: number): ReplyConfidenceLevel {
  if (score >= 80) return "high";
  if (score >= 50) return "medium";
  return "low";
}

function confidenceLabelKey(level: ReplyConfidenceLevel): InboxKey {
  if (level === "high") return "confidenceHigh";
  if (level === "medium") return "confidenceMedium";
  return "confidenceLow";
}

function buildSources(conversation: OmnichannelConversationDetail): SuggestedReplySource[] {
  const memory = conversation.conversationMemory;
  const qualification = conversation.leadQualification;
  const aiState = resolveWhatsappAiState(conversation.aiState);

  const identityActive = Boolean(
    memory && Object.values(memory).some((entry) => entry.memoryValue?.trim()),
  );
  const productActive = Boolean(
    (conversation.recommendedDocuments?.length ?? 0) > 0 ||
      pickDestination(conversation) ||
      (qualification?.fields.destination?.trim() ?? ""),
  );
  const knowledgeActive = Boolean(
    qualification &&
      qualification.fieldProgress.some((field) => field.completed && field.value),
  );
  const rulesActive = Boolean(
    aiState !== "HUMAN_ONLY" ||
      (conversation.aiActions?.length ?? 0) > 0 ||
      conversation.aiHandoffReason?.trim(),
  );

  const flags: Record<ReplySourceKey, boolean> = {
    identity: identityActive || Boolean(conversation.customerName?.trim()),
    product: productActive,
    knowledge: knowledgeActive,
    rules: rulesActive,
  };

  return (Object.keys(flags) as ReplySourceKey[]).map((key) => ({
    key,
    active: flags[key],
    href: SOURCE_HREFS[key],
    labelKey: SOURCE_LABEL_KEYS[key],
  }));
}

function computeConfidence(
  conversation: OmnichannelConversationDetail,
  sources: SuggestedReplySource[],
): number {
  let score = conversation.leadQualification?.completionScore ?? 25;

  if (hasIncomingText(conversation.messages)) score += 15;
  score += sources.filter((source) => source.active).length * 8;

  if ((conversation.recommendedDocuments?.length ?? 0) > 0) score += 5;
  if (conversation.aiActions?.some((action) => action.confidence > 0)) {
    const actionConfidence = conversation.aiActions.find((action) => action.confidence > 0)
      ?.confidence;
    if (typeof actionConfidence === "number") {
      const normalized =
        actionConfidence <= 1 ? Math.round(actionConfidence * 100) : actionConfidence;
      score = Math.round((score + normalized) / 2);
    }
  }

  return Math.min(98, Math.max(32, score));
}

function buildMissingContext(
  conversation: OmnichannelConversationDetail,
  intent: IntelligenceIntent,
  confidence: number,
): MissingContextKey[] {
  if (confidence >= 70) return [];

  const missing: MissingContextKey[] = [];
  const destination = pickDestination(conversation);

  if (!hasBudget(conversation) || intent === "price_inquiry") {
    missing.push("pricing");
  }

  if (isInternationalDestination(destination) || intent === "destination_interest") {
    missing.push("visaPolicy");
  }

  if (
    intent === "general_question" ||
    intent === "booking_interest" ||
    intent === "price_inquiry"
  ) {
    missing.push("refundPolicy");
  }

  return [...new Set(missing)];
}

function applyVariant(
  text: string,
  variant: ReplyVariant,
  locale: Locale,
): string {
  if (variant === "default") return text;

  if (variant === "short") {
    const firstSentence = text.split(/[.!?]/)[0]?.trim();
    return firstSentence ? `${firstSentence}.` : text;
  }

  const persuasiveSuffix =
    locale === "id"
      ? " Kami siap bantu pilihkan opsi terbaik sesuai kebutuhan Kakak."
      : " We are ready to help you choose the best option for your needs.";

  const friendlyPrefix = locale === "id" ? "Halo Kak! " : "Hi there! ";
  const professionalPrefix = locale === "id" ? "Terima kasih atas pesan Bapak/Ibu. " : "Thank you for your message. ";

  if (variant === "persuasive") return `${text}${persuasiveSuffix}`;
  if (variant === "friendly") {
    return text.startsWith(friendlyPrefix.trim()) ? text : `${friendlyPrefix}${text}`;
  }
  if (variant === "professional") {
    return text.startsWith(professionalPrefix.trim()) ? text : `${professionalPrefix}${text}`;
  }

  return text;
}

function pickBaseReply(
  intent: IntelligenceIntent,
  destination: string | null,
  locale: Locale,
  regenerateSeed: number,
): string {
  const templates = locale === "id" ? REPLY_TEMPLATES_ID : REPLY_TEMPLATES_EN;
  const options = templates[intent] ?? templates.unknown;
  const template = options[regenerateSeed % options.length] ?? options[0];
  const destinationLabel = destination ?? (locale === "id" ? "destinasi tersebut" : "that destination");
  return template.replace(/\{destination\}/g, destinationLabel);
}

export function generateSuggestedReply(input: {
  conversation: OmnichannelConversationDetail;
  locale: Locale;
  variant?: ReplyVariant;
  regenerateSeed?: number;
}): SuggestedReplyResult {
  const variant = input.variant ?? "default";
  const regenerateSeed = input.regenerateSeed ?? 0;
  const canGenerate = hasIncomingText(input.conversation.messages);

  if (!canGenerate) {
    return {
      text: "",
      confidence: 0,
      confidenceLevel: "low",
      confidenceLabelKey: "confidenceLow",
      sources: buildSources(input.conversation),
      missingContext: [],
      missingContextLabelKeys: MISSING_LABEL_KEYS,
      canGenerate: false,
      intent: "unknown",
    };
  }

  const intelligence = buildRuleBasedIntelligence(
    {
      displayName: input.conversation.customerName,
      channelLabel: input.conversation.channelLabel,
      statusLabel: input.conversation.statusLabel,
      unreadCount: input.conversation.unreadCount,
      leadId: input.conversation.leadId,
    },
    input.conversation.messages as IntelligenceMessageInput[],
  );

  const destination =
    intelligence.entities.destination ?? pickDestination(input.conversation);

  let baseText = intelligence.suggestedReply?.trim();
  if (!baseText || regenerateSeed > 0) {
    baseText = pickBaseReply(
      intelligence.intent,
      destination,
      input.locale,
      regenerateSeed,
    );
  } else if (destination && baseText.includes("destinasi tersebut")) {
    baseText = baseText.replace("destinasi tersebut", destination);
  }

  const sources = buildSources(input.conversation);
  const confidence = computeConfidence(input.conversation, sources);
  const confidenceLevel = resolveConfidenceLevel(confidence);
  const missingContext = buildMissingContext(
    input.conversation,
    intelligence.intent,
    confidence,
  );

  return {
    text: applyVariant(baseText, variant, input.locale),
    confidence,
    confidenceLevel,
    confidenceLabelKey: confidenceLabelKey(confidenceLevel),
    sources,
    missingContext,
    missingContextLabelKeys: MISSING_LABEL_KEYS,
    canGenerate: true,
    intent: intelligence.intent,
  };
}

export function getSuggestedReplyRefreshKey(conversation: OmnichannelConversationDetail) {
  const latestIncomingId = getLatestIncomingMessageId(conversation.messages);
  return `${conversation.id}:${latestIncomingId ?? "none"}:${conversation.messages.length}`;
}
