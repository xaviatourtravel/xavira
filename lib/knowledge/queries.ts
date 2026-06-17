import type { KnowledgeFaqItem } from "@/lib/knowledge/ai";
import {
  isKnowledgeCategory,
  type KnowledgeAiStatus,
  type KnowledgeCategory,
  type KnowledgeSourceType,
} from "@/lib/knowledge/constants";
import type { Tables } from "@/types/database";
import type { createClient } from "@/utils/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type KnowledgeEntryRow = Tables<"knowledge_entries">;

export type KnowledgeEntryListItem = {
  id: string;
  title: string;
  category: KnowledgeCategory;
  tags: string[];
  summary: string | null;
  aiStatus: KnowledgeAiStatus;
  sourceType: KnowledgeSourceType;
  fileName: string | null;
  updatedAt: string;
};

export type KnowledgeEntryDetail = KnowledgeEntryListItem & {
  content: string;
  keyPoints: string[];
  faq: KnowledgeFaqItem[];
  filePath: string | null;
  fileType: string | null;
  createdAt: string;
};

export type KnowledgeFilters = {
  category: KnowledgeCategory | null;
  tag: string | null;
  query: string | null;
};

function coerceCategory(value: string): KnowledgeCategory {
  return isKnowledgeCategory(value) ? value : "product_knowledge";
}

function coerceAiStatus(value: string): KnowledgeAiStatus {
  if (
    value === "pending" ||
    value === "processing" ||
    value === "completed" ||
    value === "failed"
  ) {
    return value;
  }
  return "pending";
}

function coerceSourceType(value: string): KnowledgeSourceType {
  return value === "upload" ? "upload" : "manual";
}

function coerceStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

function coerceFaq(value: unknown): KnowledgeFaqItem[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const result: KnowledgeFaqItem[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const record = item as Record<string, unknown>;
    result.push({
      question: typeof record.question === "string" ? record.question : "",
      answer: typeof record.answer === "string" ? record.answer : "",
    });
  }
  return result;
}

function mapListItem(row: KnowledgeEntryRow): KnowledgeEntryListItem {
  return {
    id: row.id,
    title: row.title,
    category: coerceCategory(row.category),
    tags: row.tags ?? [],
    summary: row.summary,
    aiStatus: coerceAiStatus(row.ai_status),
    sourceType: coerceSourceType(row.source_type),
    fileName: row.file_name,
    updatedAt: row.updated_at,
  };
}

const LIST_COLUMNS =
  "id, title, category, tags, summary, ai_status, source_type, file_name, updated_at";

const DETAIL_COLUMNS =
  "id, title, category, tags, summary, ai_status, source_type, file_name, file_path, file_type, content, key_points, faq, created_at, updated_at";

export function parseKnowledgeFilters(searchParams: {
  category?: string;
  tag?: string;
  q?: string;
}): KnowledgeFilters {
  const category =
    searchParams.category && isKnowledgeCategory(searchParams.category)
      ? searchParams.category
      : null;
  const tag = searchParams.tag?.trim() ? searchParams.tag.trim() : null;
  const query = searchParams.q?.trim() ? searchParams.q.trim() : null;

  return { category, tag, query };
}

export async function loadKnowledgeEntries(
  supabase: SupabaseServerClient,
  organizationId: string,
  filters: KnowledgeFilters,
): Promise<KnowledgeEntryListItem[]> {
  let query = supabase
    .from("knowledge_entries")
    .select(LIST_COLUMNS)
    .eq("organization_id", organizationId);

  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  if (filters.tag) {
    query = query.contains("tags", [filters.tag]);
  }

  if (filters.query) {
    query = query.textSearch("search_vector", filters.query, {
      type: "websearch",
      config: "simple",
    });
  }

  const { data, error } = await query
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Knowledge entries query error:", error);
    // TEMP (dev): surface the real Supabase error to diagnose root cause.
    // Revert to a generic message before production.
    throw new Error(`Gagal memuat knowledge entries: ${error.message}`);
  }

  return ((data ?? []) as KnowledgeEntryRow[]).map(mapListItem);
}

export async function loadKnowledgeEntryById(
  supabase: SupabaseServerClient,
  organizationId: string,
  id: string,
): Promise<KnowledgeEntryDetail | null> {
  const { data, error } = await supabase
    .from("knowledge_entries")
    .select(DETAIL_COLUMNS)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as KnowledgeEntryRow;

  return {
    ...mapListItem(row),
    content: row.content ?? "",
    keyPoints: coerceStringArray(row.key_points),
    faq: coerceFaq(row.faq),
    filePath: row.file_path,
    fileType: row.file_type,
    createdAt: row.created_at,
  };
}

export async function loadKnowledgeTagCloud(
  supabase: SupabaseServerClient,
  organizationId: string,
  limit = 30,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("knowledge_entries")
    .select("tags")
    .eq("organization_id", organizationId)
    .limit(500);

  if (error || !data) {
    return [];
  }

  const counts = new Map<string, number>();
  for (const row of data as Array<{ tags: string[] | null }>) {
    for (const tag of row.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "id"))
    .slice(0, limit)
    .map(([tag]) => tag);
}
