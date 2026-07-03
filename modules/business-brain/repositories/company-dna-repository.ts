import type { Json } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

import type {
  AiGoal,
  BrandPersonality,
  CommunicationStyle,
  CompanyDnaFormValues,
  SalesStyle,
} from "@/modules/business-brain/types/company-dna";

export type CompanyDnaRow = {
  id: string;
  business_brain_id: string;
  company_name: string;
  industry: string;
  website: string;
  about: string;
  brand_personality: Json;
  communication_style: Json;
  sales_style: string;
  ai_goals: Json;
  never_rules: Json;
  created_at: string;
  updated_at: string;
};

function parseStringArray(value: Json): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function parseCommunicationStyle(value: Json): CommunicationStyle {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      replyLength: "medium",
      greetingStyle: "friendly",
      emojiUsage: "minimal",
      language: "mixed",
    };
  }

  const record = value as Record<string, unknown>;

  return {
    replyLength:
      record.replyLength === "short" ||
      record.replyLength === "medium" ||
      record.replyLength === "detailed"
        ? record.replyLength
        : "medium",
    greetingStyle:
      record.greetingStyle === "formal" ||
      record.greetingStyle === "friendly" ||
      record.greetingStyle === "casual"
        ? record.greetingStyle
        : "friendly",
    emojiUsage:
      record.emojiUsage === "never" ||
      record.emojiUsage === "minimal" ||
      record.emojiUsage === "natural" ||
      record.emojiUsage === "frequent"
        ? record.emojiUsage
        : "minimal",
    language:
      record.language === "indonesian" ||
      record.language === "english" ||
      record.language === "mixed"
        ? record.language
        : "mixed",
  };
}

export function mapCompanyDnaRow(row: CompanyDnaRow): CompanyDnaFormValues & {
  id: string;
  businessBrainId: string;
  updatedAt: string;
} {
  const brandPersonality = parseStringArray(row.brand_personality);
  const aiGoals = parseStringArray(row.ai_goals);
  const neverRules = parseStringArray(row.never_rules);

  return {
    id: row.id,
    businessBrainId: row.business_brain_id,
    updatedAt: row.updated_at,
    companyName: row.company_name,
    industry: row.industry as CompanyDnaFormValues["industry"],
    website: row.website,
    about: row.about,
    brandPersonality: brandPersonality as BrandPersonality[],
    communicationStyle: parseCommunicationStyle(row.communication_style),
    salesStyle: row.sales_style as SalesStyle,
    aiGoals: aiGoals as AiGoal[],
    neverRules,
  };
}

export async function findCompanyDnaByBusinessBrainId(
  businessBrainId: string,
): Promise<CompanyDnaRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_dna")
    .select("*")
    .eq("business_brain_id", businessBrainId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function upsertCompanyDna(
  businessBrainId: string,
  values: CompanyDnaFormValues,
): Promise<CompanyDnaRow> {
  const supabase = await createClient();
  const payload = {
    business_brain_id: businessBrainId,
    company_name: values.companyName,
    industry: values.industry,
    website: values.website,
    about: values.about,
    brand_personality: values.brandPersonality,
    communication_style: values.communicationStyle,
    sales_style: values.salesStyle,
    ai_goals: values.aiGoals,
    never_rules: values.neverRules,
  };

  const { data, error } = await supabase
    .from("company_dna")
    .upsert(payload, { onConflict: "business_brain_id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
