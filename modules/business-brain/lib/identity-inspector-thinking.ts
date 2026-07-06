import type {
  AiGoal,
  CompanyDnaFormValues,
  CommunicationLanguage,
  EmojiUsage,
  GreetingStyle,
  ReplyLength,
  SalesStyle,
} from "@/modules/business-brain/types/company-dna";

export const AI_GOAL_LABELS: Record<AiGoal, string> = {
  answer_faq: "Answer FAQ",
  recommend_products: "Recommend Products",
  qualify_leads: "Qualify Leads",
  close_leads: "Close Leads",
  customer_support: "Customer Support",
  upsell: "Upsell",
  cross_sell: "Cross Sell",
};

const GREETING_LABELS: Record<GreetingStyle, string> = {
  formal: "Formal",
  friendly: "Friendly",
  casual: "Casual",
};

const REPLY_LENGTH_LABELS: Record<ReplyLength, string> = {
  short: "Short",
  medium: "Medium",
  detailed: "Detailed",
};

const EMOJI_LABELS: Record<EmojiUsage, string> = {
  never: "Never",
  minimal: "Minimal",
  natural: "Natural",
  frequent: "Frequent",
};

const LANGUAGE_LABELS: Record<CommunicationLanguage, string> = {
  indonesian: "Indonesian",
  english: "English",
  mixed: "Mixed",
};

const SALES_STYLE_LABELS: Record<SalesStyle, string> = {
  educate_first: "Educate First",
  consultative: "Consultative",
  hard_sell: "Hard Sell",
  relationship_based: "Relationship Based",
};

const GOAL_DERIVED_RULES: Record<AiGoal, string> = {
  answer_faq: "Answer FAQ clearly from knowledge",
  recommend_products: "Recommend relevant products when appropriate",
  qualify_leads: "Ask one question at a time",
  close_leads: "Guide customers toward booking",
  customer_support: "Provide helpful customer support",
  upsell: "Suggest upgrades when appropriate",
  cross_sell: "Suggest complementary services",
};

export type IdentityThinkingConfig = {
  tone: string;
  greetingStyle: string;
  replyLength: string;
  emojiUsage: string;
  language: string;
  salesStyle: string;
};

export type IdentityCompleteness = {
  complete: boolean;
  missing: string[];
};

function normalizeNeverRule(rule: string): string {
  const trimmed = rule.trim();
  if (!trimmed) return "";

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("never ") ||
    lower.startsWith("do not ") ||
    lower.startsWith("don't ") ||
    lower.startsWith("avoid ")
  ) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }

  return `Never ${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`;
}

function ruleKey(rule: string): string {
  return rule.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
}

export function deriveIdentityThinkingConfig(
  values: CompanyDnaFormValues,
): IdentityThinkingConfig {
  const { communicationStyle } = values;

  return {
    tone:
      values.brandPersonality.length > 0
        ? values.brandPersonality.join(", ")
        : "Not set",
    greetingStyle: GREETING_LABELS[communicationStyle.greetingStyle],
    replyLength: REPLY_LENGTH_LABELS[communicationStyle.replyLength],
    emojiUsage: EMOJI_LABELS[communicationStyle.emojiUsage],
    language: LANGUAGE_LABELS[communicationStyle.language],
    salesStyle: SALES_STYLE_LABELS[values.salesStyle],
  };
}

export function deriveIdentityActiveRules(values: CompanyDnaFormValues): string[] {
  const seen = new Set<string>();
  const rules: string[] = [];

  const addRule = (rule: string) => {
    const normalized = rule.trim();
    if (!normalized) return;

    const key = ruleKey(normalized);
    if (seen.has(key)) return;

    seen.add(key);
    rules.push(normalized);
  };

  for (const rule of values.neverRules) {
    addRule(normalizeNeverRule(rule));
  }

  for (const goal of values.aiGoals) {
    addRule(GOAL_DERIVED_RULES[goal]);
  }

  const { replyLength, emojiUsage } = values.communicationStyle;

  if (replyLength === "short") {
    addRule("Keep reply concise");
  }

  if (emojiUsage === "never") {
    addRule("Do not use emojis");
  }

  if (values.salesStyle === "hard_sell") {
    addRule("Do not promise availability without confirmation");
  } else if (values.aiGoals.includes("close_leads") || values.aiGoals.includes("qualify_leads")) {
    addRule("Do not promise availability");
  }

  return rules;
}

export function deriveIdentityCompleteness(
  values: CompanyDnaFormValues,
): IdentityCompleteness {
  const missing: string[] = [];

  if (!values.companyName.trim()) {
    missing.push("Company Name");
  }
  if (!values.industry) {
    missing.push("Industry");
  }
  if (!values.about.trim()) {
    missing.push("About Company");
  }

  return {
    complete: missing.length === 0,
    missing,
  };
}

export function formatAiGoalLabels(goals: AiGoal[]): string[] {
  return goals.map((goal) => AI_GOAL_LABELS[goal]);
}
