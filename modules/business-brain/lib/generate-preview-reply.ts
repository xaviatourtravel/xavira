import type { CompanyDnaFormValues } from "@/modules/business-brain/types/company-dna";

const EMOJI_POOL = {
  minimal: ["🙂"],
  natural: ["😊", "🙏"],
  frequent: ["😊", "🙏", "✨"],
} as const;

const GOAL_HINTS: Record<string, { id: string; en: string; mixed: string }> = {
  answer_faq: {
    id: "Kalau ada pertanyaan, saya siap bantu jelaskan.",
    en: "Happy to answer any questions you have.",
    mixed: "Kalau ada pertanyaan, saya siap help jelaskan.",
  },
  recommend_products: {
    id: "Saya bisa rekomendasikan paket yang paling cocok untuk Anda.",
    en: "I can recommend packages that fit your needs.",
    mixed: "Saya bisa recommend paket yang paling cocok untuk Anda.",
  },
  qualify_leads: {
    id: "Boleh saya tanya sedikit kebutuhan perjalanan Anda?",
    en: "May I ask a few questions about your travel needs?",
    mixed: "Boleh saya tanya sedikit kebutuhan trip Anda?",
  },
  close_leads: {
    id: "Kalau sudah cocok, kita bisa lanjut proses bookingnya.",
    en: "If everything looks good, we can move forward with booking.",
    mixed: "Kalau sudah cocok, kita bisa lanjut proses booking.",
  },
  customer_support: {
    id: "Ada kendala atau butuh bantuan? Saya siap bantu.",
    en: "Need help with anything? I'm here to assist.",
    mixed: "Ada kendala atau butuh bantuan? Saya siap help.",
  },
  upsell: {
    id: "Ada juga opsi upgrade yang mungkin menarik untuk Anda.",
    en: "We also have upgrade options you might like.",
    mixed: "Ada juga opsi upgrade yang mungkin menarik untuk Anda.",
  },
  cross_sell: {
    id: "Kami punya layanan tambahan yang bisa melengkapi perjalanan Anda.",
    en: "We have add-on services that complement your trip.",
    mixed: "Kami punya add-on services yang bisa melengkapi trip Anda.",
  },
};

function languageKey(
  language: CompanyDnaFormValues["communicationStyle"]["language"],
): "id" | "en" | "mixed" {
  if (language === "english") {
    return "en";
  }
  if (language === "mixed") {
    return "mixed";
  }
  return "id";
}

function pickEmoji(usage: CompanyDnaFormValues["communicationStyle"]["emojiUsage"]) {
  if (usage === "never") {
    return "";
  }

  const pool = EMOJI_POOL[usage === "frequent" ? "frequent" : usage === "natural" ? "natural" : "minimal"];
  return ` ${pool[0]}`;
}

function buildGreeting(values: CompanyDnaFormValues): string {
  const name = values.companyName.trim() || "tim kami";
  const { greetingStyle, language } = values.communicationStyle;
  const emoji = pickEmoji(values.communicationStyle.emojiUsage);

  const templates = {
    formal: {
      indonesian: `Selamat datang. Terima kasih telah menghubungi ${name}.`,
      english: `Good day. Thank you for contacting ${name}.`,
      mixed: `Halo, selamat datang di ${name}. Thank you for reaching out.`,
    },
    friendly: {
      indonesian: `Halo kak! Terima kasih sudah menghubungi ${name}.`,
      english: `Hi there! Thanks for reaching out to ${name}.`,
      mixed: `Halo kak! Thanks for contacting ${name}.`,
    },
    casual: {
      indonesian: `Hai kak! Ada yang bisa dibantu dari ${name}?`,
      english: `Hey! What can ${name} help you with today?`,
      mixed: `Hai kak! Ada yang bisa kita bantu hari ini?`,
    },
  } as const;

  const base = templates[greetingStyle][language];
  return `${base}${emoji}`.trim();
}

function buildBody(values: CompanyDnaFormValues): string {
  const { replyLength, language } = values.communicationStyle;
  const aboutSnippet = values.about.trim();
  const industry = values.industry || "bisnis kami";

  const personalityHint =
    values.brandPersonality.length > 0
      ? values.brandPersonality.slice(0, 2).join(", ").toLowerCase()
      : "helpful";

  const salesHints = {
    educate_first: {
      id: "Saya bisa jelaskan dulu opsi dan detailnya supaya Anda bisa putuskan dengan nyaman.",
      en: "I can walk you through the options first so you can decide comfortably.",
      mixed: "Saya bisa explain dulu opsi-opsinya biar Anda bisa decide dengan nyaman.",
    },
    consultative: {
      id: "Ceritakan kebutuhan Anda, nanti saya bantu carikan solusi yang paling pas.",
      en: "Tell me what you need and I'll help find the best fit.",
      mixed: "Ceritakan kebutuhan Anda, nanti saya help carikan yang paling pas.",
    },
    hard_sell: {
      id: "Promo terbatas tersedia — kalau mau, saya bisa bantu amankan slotnya sekarang.",
      en: "Limited promo available — I can help secure your slot now.",
      mixed: "Promo terbatas — kalau mau, saya bisa help secure slot sekarang.",
    },
    relationship_based: {
      id: "Senang bisa terhubung. Saya di sini untuk bantu dari awal sampai perjalanan berjalan lancar.",
      en: "Great to connect. I'm here to support you from start to finish.",
      mixed: "Senang bisa connect. Saya di sini untuk support dari awal sampai trip berjalan lancar.",
    },
  } as const;

  const goalHint =
    values.aiGoals.length > 0
      ? GOAL_HINTS[values.aiGoals[0]]?.[languageKey(language)] ?? ""
      : "";

  if (replyLength === "short") {
    if (language === "english") {
      return "How can I help you today?";
    }
    if (language === "mixed") {
      return "Ada yang bisa saya bantu hari ini?";
    }
    return "Ada yang bisa dibantu hari ini?";
  }

  const intro =
    language === "english"
      ? `We are a ${personalityHint} ${industry} team.`
      : language === "mixed"
        ? `Kami tim ${industry} yang ${personalityHint}.`
        : `Kami adalah tim ${industry} yang ${personalityHint}.`;

  const aboutPart =
    aboutSnippet && replyLength === "detailed"
      ? language === "english"
        ? ` ${aboutSnippet.slice(0, 120)}${aboutSnippet.length > 120 ? "..." : ""}`
        : ` ${aboutSnippet.slice(0, 120)}${aboutSnippet.length > 120 ? "..." : ""}`
      : "";

  const salesPart = salesHints[values.salesStyle][languageKey(language)];
  const parts = [intro + aboutPart, salesPart, goalHint].filter(Boolean);

  if (replyLength === "medium") {
    return parts.slice(0, 2).join(" ");
  }

  return parts.join(" ");
}

export function generateCompanyDnaPreviewReply(
  values: CompanyDnaFormValues,
): string {
  const greeting = buildGreeting(values);
  const body = buildBody(values);
  return `${greeting} ${body}`.replace(/\s+/g, " ").trim();
}

export const COMPANY_DNA_PREVIEW_CUSTOMER_MESSAGE = "Halo kak";
