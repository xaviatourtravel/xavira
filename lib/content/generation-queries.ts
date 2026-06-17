import {
  mapContentGenerationRow,
  type AiContentGenerationRow,
  type ContentGenerationListItem,
} from "@/lib/content/generations";
import type { createClient } from "@/utils/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function loadRecentContentGenerations(
  supabase: SupabaseServerClient,
  organizationId: string,
  limit = 20,
): Promise<ContentGenerationListItem[]> {
  const { data, error } = await supabase
    .from("ai_content_generations")
    .select(
      `
      id,
      organization_id,
      created_by,
      source_type,
      package_id,
      topic,
      platform,
      goal,
      content_pillar,
      content_angle,
      additional_context,
      generated_output,
      created_at,
      packages:package_id ( name ),
      profiles:created_by ( full_name )
    `,
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Load content generations error:", error);
    throw new Error(error.message);
  }

  return ((data ?? []) as AiContentGenerationRow[])
    .map(mapContentGenerationRow)
    .filter((item): item is ContentGenerationListItem => item != null);
}

export async function loadContentGenerationById(
  supabase: SupabaseServerClient,
  organizationId: string,
  generationId: string,
): Promise<ContentGenerationListItem | null> {
  const { data, error } = await supabase
    .from("ai_content_generations")
    .select(
      `
      id,
      organization_id,
      created_by,
      source_type,
      package_id,
      topic,
      platform,
      goal,
      content_pillar,
      content_angle,
      additional_context,
      generated_output,
      created_at,
      packages:package_id ( name ),
      profiles:created_by ( full_name )
    `,
    )
    .eq("organization_id", organizationId)
    .eq("id", generationId)
    .maybeSingle();

  if (error) {
    console.error("Load content generation error:", error);
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapContentGenerationRow(data as AiContentGenerationRow);
}
