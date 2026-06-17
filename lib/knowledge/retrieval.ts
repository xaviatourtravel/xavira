import type { KnowledgeCategory } from "@/lib/knowledge/constants";
import type { Tables } from "@/types/database";
import type { createClient } from "@/utils/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type KnowledgeRetrievalRow = Pick<
  Tables<"knowledge_entries">,
  "title" | "category" | "summary" | "key_points"
>;

export type KnowledgeRetrievalOptions = {
  query?: string;
  categories?: KnowledgeCategory[];
  limit?: number;
};

function coerceKeyPoints(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const points: string[] = [];
  for (const item of value) {
    if (typeof item === "string" && item.trim()) {
      points.push(item.trim());
    }
    if (points.length >= limit) {
      break;
    }
  }
  return points;
}

/**
 * Loads the most relevant knowledge entries for an organization and formats
 * them into a compact prompt context string. Returns an empty string when no
 * usable knowledge exists, so callers can append it unconditionally.
 *
 * Shared by AI Sales Assistant, AI Content Studio, and future AI chatbot.
 */
export async function loadKnowledgeContextForAi(
  supabase: SupabaseServerClient,
  organizationId: string,
  options: KnowledgeRetrievalOptions = {},
): Promise<string> {
  const limit = Math.min(Math.max(options.limit ?? 5, 1), 10);

  let query = supabase
    .from("knowledge_entries")
    .select("title, category, summary, key_points")
    .eq("organization_id", organizationId)
    .eq("ai_status", "completed");

  if (options.categories && options.categories.length > 0) {
    query = query.in("category", options.categories);
  }

  const trimmedQuery = options.query?.trim();
  if (trimmedQuery) {
    query = query.textSearch("search_vector", trimmedQuery, {
      type: "websearch",
      config: "simple",
    });
  }

  const { data, error } = await query
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error || !data || data.length === 0) {
    return "";
  }

  const rows = data as KnowledgeRetrievalRow[];
  const blocks: string[] = [];

  for (const row of rows) {
    const lines: string[] = [`- ${row.title}`];

    if (row.summary?.trim()) {
      lines.push(`  Ringkasan: ${row.summary.trim()}`);
    }

    const keyPoints = coerceKeyPoints(row.key_points, 4);
    if (keyPoints.length > 0) {
      lines.push(`  Poin penting: ${keyPoints.join("; ")}`);
    }

    blocks.push(lines.join("\n"));
  }

  if (blocks.length === 0) {
    return "";
  }

  return [
    "Knowledge base perusahaan (gunakan sebagai referensi fakta, jangan mengarang di luar ini):",
    ...blocks,
  ].join("\n");
}
