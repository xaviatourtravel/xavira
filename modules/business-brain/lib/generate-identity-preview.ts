import type {
  AiGoal,
  BrandPersonality,
  CompanyDnaFormValues,
  CommunicationLanguage,
  EmojiUsage,
  GreetingStyle,
  ReplyLength,
  SalesStyle,
} from "@/modules/business-brain/types/company-dna";

export type IdentityPreview = {
  customerMessage: string;
  aiReply: string;
};

const EMOJI_MAX: Record<EmojiUsage, number> = {
  never: 0,
  minimal: 1,
  natural: 2,
  frequent: 2,
};

const GREETING_EMOJI = ["😊", "🙏"];

function countEmojis(text: string): number {
  const matches = text.match(/\p{Extended_Pictographic}/gu);
  return matches?.length ?? 0;
}

function appendEmojis(text: string, usage: EmojiUsage, count: number): string {
  if (usage === "never" || count <= 0) return text;

  const max = Math.min(count, EMOJI_MAX[usage] - countEmojis(text));
  if (max <= 0) return text;

  const pool = usage === "frequent" ? GREETING_EMOJI : ["😊"];
  const suffix = pool.slice(0, max).join("");
  return `${text}${text.endsWith(" ") ? "" : " "}${suffix}`;
}

function buildGreeting(
  greetingStyle: GreetingStyle,
  language: CommunicationLanguage,
  emojiUsage: EmojiUsage,
): string {
  const templates: Record<GreetingStyle, Record<CommunicationLanguage, string>> = {
    friendly: {
      indonesian: "Halo Kak",
      english: "Hello",
      mixed: "Halo Kak",
    },
    formal: {
      indonesian: "Selamat pagi Bapak/Ibu",
      english: "Good morning Sir/Madam",
      mixed: "Selamat pagi Bapak/Ibu",
    },
    casual: {
      indonesian: "Hai Kak",
      english: "Hey",
      mixed: "Hai Kak",
    },
  };

  const base = templates[greetingStyle][language];

  if (greetingStyle === "friendly") {
    return appendEmojis(base, emojiUsage, emojiUsage === "frequent" ? 2 : 1);
  }

  if (greetingStyle === "casual" && emojiUsage !== "never") {
    return appendEmojis(base, emojiUsage, 1);
  }

  return base;
}

function buildCustomerMessage(language: CommunicationLanguage): string {
  if (language === "english") {
    return "Hi, I'd like to ask about your travel packages.";
  }
  if (language === "mixed") {
    return "Halo kak, I want to ask about your travel packages.";
  }
  return "Halo kak, saya mau tanya paket travel.";
}

function personalityTone(personalities: BrandPersonality[]): string {
  if (personalities.includes("Luxury") || personalities.includes("Premium")) return "premium";
  if (personalities.includes("Professional") || personalities.includes("Corporate")) {
    return "professional";
  }
  if (personalities.includes("Gen Z") || personalities.includes("Casual")) return "relaxed";
  if (personalities.includes("Muslim Friendly")) return "muslim_friendly";
  if (personalities.includes("Friendly")) return "friendly";
  return "neutral";
}

function buildHelpOffer(
  language: CommunicationLanguage,
  companyName: string,
): string {
  const company = companyName.trim();

  if (language === "english") {
    return company
      ? `How can ${company} help you today?`
      : "How can we help you today?";
  }
  if (language === "mixed") {
    return company
      ? `Ada yang bisa ${company} bantu today?`
      : "Ada yang bisa kami bantu today?";
  }
  return company
    ? `Ada yang bisa ${company} bantu hari ini?`
    : "Ada yang bisa kami bantu hari ini?";
}

function buildPersonalityLine(
  tone: string,
  language: CommunicationLanguage,
  companyName: string,
): string {
  const company = companyName.trim();

  if (tone === "premium") {
    if (language === "english") {
      return company
        ? `${company} is ready to provide a premium experience for you.`
        : "We are ready to provide a premium experience for you.";
    }
    if (language === "mixed") {
      return company
        ? `${company} siap memberikan premium experience untuk Anda.`
        : "Kami siap memberikan premium experience untuk Anda.";
    }
    return company
      ? `${company} siap memberikan pelayanan terbaik untuk Anda.`
      : "Kami siap memberikan pelayanan terbaik untuk Anda.";
  }

  if (tone === "muslim_friendly") {
    if (language === "english") {
      return "We can help you plan a comfortable, Muslim-friendly trip.";
    }
    if (language === "mixed") {
      return "Kami bisa bantu rencanakan perjalanan Muslim-friendly yang nyaman.";
    }
    return "Kami bisa bantu rencanakan perjalanan yang nyaman dan sesuai kebutuhan Anda.";
  }

  if (tone === "relaxed") {
    if (language === "english") return "Tell us what you need — we got you.";
    if (language === "mixed") return "Ceritain aja kebutuhannya, we'll help you out.";
    return "Ceritain aja kebutuhannya, nanti kami bantu ya.";
  }

  if (tone === "professional") {
    if (language === "english") {
      return "We will assist you with accurate and clear information.";
    }
    if (language === "mixed") {
      return "Kami akan assist Anda dengan informasi yang jelas dan akurat.";
    }
    return "Kami akan membantu Anda dengan informasi yang jelas dan akurat.";
  }

  return "";
}

function buildGoalLine(
  goals: AiGoal[],
  language: CommunicationLanguage,
  tone: string,
): string {
  const primary = goals[0];
  if (!primary) return "";

  const lines: Record<AiGoal, Record<CommunicationLanguage, string>> = {
    answer_faq: {
      indonesian: "Silakan sampaikan pertanyaannya, kami bantu jelaskan.",
      english: "Please share your question and we will explain.",
      mixed: "Silakan share pertanyaannya, kami bantu jelaskan.",
    },
    recommend_products: {
      indonesian: "Kami bisa bantu cari paket yang paling sesuai kebutuhan Anda.",
      english: "We can help you find a package that fits your needs.",
      mixed: "Kami bisa bantu cari paket yang paling fit dengan kebutuhan Anda.",
    },
    qualify_leads: {
      indonesian: "Boleh tahu rencana perjalanannya untuk berapa orang dan kapan?",
      english: "May we know your travel plan, group size, and preferred dates?",
      mixed: "Boleh tahu rencana trip-nya untuk berapa orang dan kapan?",
    },
    close_leads: {
      indonesian: "Kalau sudah cocok, kami bisa bantu lanjut proses pemesanannya.",
      english: "If everything looks good, we can help you proceed with booking.",
      mixed: "Kalau sudah cocok, kami bisa bantu lanjut proses booking-nya.",
    },
    customer_support: {
      indonesian: "Ada kendala atau butuh bantuan? Kami siap membantu.",
      english: "If you need any assistance, we are here to help.",
      mixed: "Ada kendala atau butuh bantuan? We are here to help.",
    },
    upsell: {
      indonesian: "Kami juga punya opsi upgrade yang mungkin menarik untuk Anda.",
      english: "We also have upgrade options you may find useful.",
      mixed: "Kami juga punya upgrade options yang mungkin menarik untuk Anda.",
    },
    cross_sell: {
      indonesian: "Ada layanan tambahan yang bisa melengkapi perjalanan Anda.",
      english: "We have add-on services that can complement your trip.",
      mixed: "Ada add-on services yang bisa melengkapi perjalanan Anda.",
    },
  };

  let line = lines[primary][language];

  if (tone === "muslim_friendly" && primary === "recommend_products") {
    line =
      language === "english"
        ? "We can help you find a Muslim-friendly package that suits your needs."
        : language === "mixed"
          ? "Kami bisa bantu cari paket Muslim-friendly yang sesuai kebutuhan Anda."
          : "Kami bisa bantu cari paket yang nyaman dan ramah untuk kebutuhan perjalanan Anda.";
  }

  return line;
}

function buildSalesLine(
  salesStyle: SalesStyle,
  language: CommunicationLanguage,
): string {
  const lines: Record<SalesStyle, Record<CommunicationLanguage, string>> = {
    educate_first: {
      indonesian:
        "Kami jelaskan dulu pilihan dan detailnya supaya Anda bisa memutuskan dengan nyaman.",
      english: "We will explain the options first so you can decide comfortably.",
      mixed:
        "Kami jelaskan dulu options dan detailnya supaya Anda bisa decide dengan nyaman.",
    },
    consultative: {
      indonesian: "Ceritakan kebutuhan Anda, nanti kami bantu carikan solusi yang paling pas.",
      english: "Tell us what you need and we will help find the best fit.",
      mixed: "Ceritakan kebutuhan Anda, nanti kami bantu find the best fit.",
    },
    hard_sell: {
      indonesian: "Kuota terbatas — kalau sudah cocok, kami bisa bantu amankan slotnya sekarang.",
      english: "Slots are limited — if you are ready, we can secure yours now.",
      mixed: "Kuota terbatas — if you are ready, kami bisa bantu secure slot Anda now.",
    },
    relationship_based: {
      indonesian:
        "Senang bisa terhubung. Kami dampingi Anda dari awal sampai perjalanan berjalan lancar.",
      english: "Great to connect. We will support you from start to finish.",
      mixed: "Senang bisa connect. Kami dampingi Anda from start to finish.",
    },
  };

  return lines[salesStyle][language];
}

function sanitizeReply(text: string, neverRules: string[]): string {
  let result = text.replace(/\s+/g, " ").trim();

  const banned = [
    /thanks for contacting/gi,
    /thank you for contacting/gi,
    /thanks for reaching out/gi,
    /sebagai ai/gi,
  ];

  for (const pattern of banned) {
    result = result.replace(pattern, "");
  }

  for (const rule of neverRules) {
    const lower = rule.toLowerCase();
    if (lower.includes("desklabs")) {
      result = result.replace(/desklabs/gi, "");
    }
    const quoted = rule.match(/never\s+(?:mention\s+)?["']?([^"'.]+)["']?/i);
    if (quoted?.[1]) {
      const phrase = quoted[1].trim();
      if (phrase.length > 2) {
        result = result.replace(new RegExp(phrase, "gi"), "");
      }
    }
  }

  return result.replace(/\s+/g, " ").trim();
}

function formatReplyLength(sentences: string[], replyLength: ReplyLength): string {
  const cleaned = sentences.filter(Boolean);

  if (cleaned.length === 0) return "";

  if (replyLength === "short") {
    return cleaned[0];
  }

  if (replyLength === "medium") {
    return cleaned.slice(0, 3).join(" ");
  }

  return cleaned.join(" ");
}

function applyReplyEmojis(text: string, usage: EmojiUsage): string {
  if (usage === "never") return text;

  const existing = countEmojis(text);
  const remaining = EMOJI_MAX[usage] - existing;
  if (remaining <= 0) return text;

  if (usage === "natural" || usage === "frequent") {
    return appendEmojis(text, usage, remaining);
  }

  if (existing === 0) {
    return appendEmojis(text, usage, 1);
  }

  return text;
}

export function generateIdentityPreview(
  companyDNA: CompanyDnaFormValues,
): IdentityPreview {
  const { communicationStyle, neverRules } = companyDNA;
  const { language, replyLength, greetingStyle, emojiUsage } = communicationStyle;
  const tone = personalityTone(companyDNA.brandPersonality);

  const greeting = buildGreeting(greetingStyle, language, emojiUsage);
  const helpOffer = buildHelpOffer(language, companyDNA.companyName);
  const personalityLine = buildPersonalityLine(tone, language, companyDNA.companyName);
  const salesLine = buildSalesLine(companyDNA.salesStyle, language);
  const goalLine = buildGoalLine(companyDNA.aiGoals, language, tone);

  const aboutSnippet = companyDNA.about.trim();
  const aboutLine =
    aboutSnippet.length > 0
      ? aboutSnippet.length > 160
        ? `${aboutSnippet.slice(0, 160).trim()}…`
        : aboutSnippet
      : "";

  const opening =
    greetingStyle === "formal"
      ? `${greeting}. ${helpOffer}`
      : `${greeting}! ${helpOffer}`;

  const sentences = [opening, personalityLine, salesLine, goalLine, aboutLine].filter(Boolean);

  let aiReply = formatReplyLength(sentences, replyLength);
  aiReply = sanitizeReply(aiReply, neverRules);
  aiReply = applyReplyEmojis(aiReply, emojiUsage);

  if (!aiReply) {
    aiReply =
      language === "english"
        ? "How can we help you today?"
        : language === "mixed"
          ? "Ada yang bisa kami bantu today?"
          : "Ada yang bisa kami bantu hari ini?";
  }

  return {
    customerMessage: buildCustomerMessage(language),
    aiReply,
  };
}
