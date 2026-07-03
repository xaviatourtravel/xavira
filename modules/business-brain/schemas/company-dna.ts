import { z } from "zod";

import {
  AI_GOAL_OPTIONS,
  BRAND_PERSONALITY_OPTIONS,
  COMPANY_DNA_INDUSTRIES,
  EMOJI_USAGE_OPTIONS,
  GREETING_STYLE_OPTIONS,
  LANGUAGE_OPTIONS,
  REPLY_LENGTH_OPTIONS,
  SALES_STYLE_OPTIONS,
} from "@/modules/business-brain/types/company-dna";

export const communicationStyleSchema = z.object({
  replyLength: z.enum(REPLY_LENGTH_OPTIONS),
  greetingStyle: z.enum(GREETING_STYLE_OPTIONS),
  emojiUsage: z.enum(EMOJI_USAGE_OPTIONS),
  language: z.enum(LANGUAGE_OPTIONS),
});

export const companyDnaFormSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required."),
  industry: z.enum(COMPANY_DNA_INDUSTRIES, {
    errorMap: () => ({ message: "Industry is required." }),
  }),
  website: z.string().trim(),
  about: z.string().trim(),
  brandPersonality: z.array(z.enum(BRAND_PERSONALITY_OPTIONS)),
  communicationStyle: communicationStyleSchema,
  salesStyle: z.enum(SALES_STYLE_OPTIONS),
  aiGoals: z.array(z.enum(AI_GOAL_OPTIONS)),
  neverRules: z.array(z.string().trim().min(1)).max(50),
});

export type CompanyDnaFormInput = z.infer<typeof companyDnaFormSchema>;
