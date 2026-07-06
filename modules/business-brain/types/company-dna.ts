export const COMPANY_DNA_INDUSTRIES = [
  "Travel & Tour",
  "Umrah & Hajj",
  "Hospitality",
  "Retail",
  "Food & Beverage",
  "Professional Services",
  "Technology",
  "Healthcare",
  "Education",
  "Other",
] as const;

export type CompanyDnaIndustry = (typeof COMPANY_DNA_INDUSTRIES)[number];

export const BRAND_PERSONALITY_OPTIONS = [
  "Friendly",
  "Professional",
  "Casual",
  "Luxury",
  "Corporate",
  "Muslim Friendly",
  "Gen Z",
  "Premium",
  "Minimalist",
] as const;

export type BrandPersonality = (typeof BRAND_PERSONALITY_OPTIONS)[number];

export const REPLY_LENGTH_OPTIONS = ["short", "medium", "detailed"] as const;
export type ReplyLength = (typeof REPLY_LENGTH_OPTIONS)[number];

export const GREETING_STYLE_OPTIONS = ["formal", "friendly", "casual"] as const;
export type GreetingStyle = (typeof GREETING_STYLE_OPTIONS)[number];

export const EMOJI_USAGE_OPTIONS = ["never", "minimal", "natural", "frequent"] as const;
export type EmojiUsage = (typeof EMOJI_USAGE_OPTIONS)[number];

export const LANGUAGE_OPTIONS = ["indonesian", "english", "mixed"] as const;
export type CommunicationLanguage = (typeof LANGUAGE_OPTIONS)[number];

export const SALES_STYLE_OPTIONS = [
  "educate_first",
  "consultative",
  "hard_sell",
  "relationship_based",
] as const;

export type SalesStyle = (typeof SALES_STYLE_OPTIONS)[number];

export const AI_GOAL_OPTIONS = [
  "answer_faq",
  "recommend_products",
  "qualify_leads",
  "close_leads",
  "customer_support",
  "upsell",
  "cross_sell",
] as const;

export type AiGoal = (typeof AI_GOAL_OPTIONS)[number];

export type CommunicationStyle = {
  replyLength: ReplyLength;
  greetingStyle: GreetingStyle;
  emojiUsage: EmojiUsage;
  language: CommunicationLanguage;
};

export type CompanyDnaFormValues = {
  companyName: string;
  industry: CompanyDnaIndustry | "";
  website: string;
  about: string;
  brandPersonality: BrandPersonality[];
  communicationStyle: CommunicationStyle;
  salesStyle: SalesStyle;
  aiGoals: AiGoal[];
  neverRules: string[];
};

export type CompanyDnaRecord = CompanyDnaFormValues & {
  id: string;
  businessBrainId: string;
  updatedAt: string;
};

export const DEFAULT_COMMUNICATION_STYLE: CommunicationStyle = {
  replyLength: "medium",
  greetingStyle: "friendly",
  emojiUsage: "minimal",
  language: "mixed",
};

export const DEFAULT_COMPANY_DNA_FORM: CompanyDnaFormValues = {
  companyName: "",
  industry: "",
  website: "",
  about: "",
  brandPersonality: [],
  communicationStyle: DEFAULT_COMMUNICATION_STYLE,
  salesStyle: "consultative",
  aiGoals: [],
  neverRules: [],
};

export {
  BUSINESS_BRAIN_NAV_ITEMS,
  type BusinessBrainNavId,
} from "@/modules/business-brain/types/business-brain-workspace";
