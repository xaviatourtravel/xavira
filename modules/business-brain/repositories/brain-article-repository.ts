import type { Json } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

import type {
  BrainArticleAiMetadata,
  BrainArticleCategory,
  BrainArticleFormValues,
  BrainArticleListItem,
  BrainArticleStatus,
  BrainArticleVisibility,
} from "@/modules/business-brain/types/knowledge";

export type BrainArticleRow = {
  id: string;
  business_brain_id: string;
  title: string;
  category: string;
  content: string;
  keywords: Json;
  visibility: string;
  status: string;
  ai_metadata: Json;
  created_at: string;
  updated_at: string;
};

function parseKeywords(value: Json): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function parseAiMetadata(value: Json): BrainArticleAiMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { confidenceWeight: null, priority: null, relatedDocuments: [] };
  }

  const record = value as Record<string, unknown>;
  return {
    confidenceWeight:
      typeof record.confidenceWeight === "number" ? record.confidenceWeight : null,
    priority: typeof record.priority === "number" ? record.priority : null,
    relatedDocuments: Array.isArray(record.relatedDocuments)
      ? record.relatedDocuments.filter((item): item is string => typeof item === "string")
      : [],
  };
}

function coerceCategory(value: string): BrainArticleCategory {
  const categories: BrainArticleCategory[] = [
    "faq",
    "payment",
    "visa",
    "halal",
    "terms",
    "refund",
    "insurance",
    "custom",
  ];
  return categories.includes(value as BrainArticleCategory)
    ? (value as BrainArticleCategory)
    : "faq";
}

function coerceVisibility(value: string): BrainArticleVisibility {
  if (value === "internal" || value === "public") return value;
  return "ai_only";
}

function coerceStatus(value: string): BrainArticleStatus {
  return value === "published" ? "published" : "draft";
}

export function mapBrainArticleFormValues(row: BrainArticleRow): Omit<
  BrainArticleFormValues,
  "relatedProductIds"
> & { aiMetadata: BrainArticleAiMetadata } {
  return {
    title: row.title,
    category: coerceCategory(row.category),
    content: row.content,
    keywords: parseKeywords(row.keywords),
    visibility: coerceVisibility(row.visibility),
    status: coerceStatus(row.status),
    aiMetadata: parseAiMetadata(row.ai_metadata),
  };
}

export function mapBrainArticleListItem(row: BrainArticleRow): BrainArticleListItem {
  return {
    id: row.id,
    title: row.title || "Untitled Article",
    category: coerceCategory(row.category),
    status: coerceStatus(row.status),
    visibility: coerceVisibility(row.visibility),
    updatedAt: row.updated_at,
  };
}

function toDbPayload(values: BrainArticleFormValues) {
  return {
    title: values.title,
    category: values.category,
    content: values.content,
    keywords: values.keywords,
    visibility: values.visibility,
    status: values.status,
    ai_metadata: values.aiMetadata,
  };
}

export async function listBrainArticles(
  businessBrainId: string,
): Promise<BrainArticleRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_articles")
    .select("*")
    .eq("business_brain_id", businessBrainId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function findBrainArticleById(
  articleId: string,
): Promise<BrainArticleRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_articles")
    .select("*")
    .eq("id", articleId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createBrainArticle(
  businessBrainId: string,
  values: Partial<BrainArticleFormValues> = {},
): Promise<BrainArticleRow> {
  const supabase = await createClient();
  const payload = {
    business_brain_id: businessBrainId,
    title: values.title ?? "Untitled Article",
    category: values.category ?? "faq",
    content: values.content ?? "",
    keywords: values.keywords ?? [],
    visibility: values.visibility ?? "ai_only",
    status: values.status ?? "draft",
    ai_metadata: values.aiMetadata ?? {},
  };

  const { data, error } = await supabase
    .from("brain_articles")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateBrainArticle(
  articleId: string,
  values: BrainArticleFormValues,
): Promise<BrainArticleRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_articles")
    .update(toDbPayload(values))
    .eq("id", articleId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateBrainArticleStatus(
  articleId: string,
  status: BrainArticleStatus,
): Promise<BrainArticleRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_articles")
    .update({ status })
    .eq("id", articleId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteBrainArticle(articleId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("brain_articles").delete().eq("id", articleId);

  if (error) {
    throw new Error(error.message);
  }
}
