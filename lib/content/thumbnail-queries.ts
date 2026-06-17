import {
  getContentStudioAngleLabel,
  getContentStudioPillarLabel,
  isContentStudioAngle,
  isContentStudioPillar,
} from "@/lib/ai/content-studio";
import {
  getThumbnailCoverFormatLabel,
  getThumbnailStylePresetLabel,
  parseStoredThumbnailConcept,
  parseStoredThumbnailHeadlines,
  parseStoredThumbnailImages,
  type ThumbnailConcept,
  type ThumbnailImageVariation,
} from "@/lib/ai/thumbnail-studio";
import { formatGenerationDateTime } from "@/lib/content/generations";
import type { createClient } from "@/utils/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type AiThumbnailGenerationRow = {
  id: string;
  organization_id: string;
  created_by: string | null;
  ai_content_generation_id: string | null;
  source_hook: string;
  source_vo_script: string;
  content_pillar: string;
  content_angle: string;
  custom_headline: string | null;
  cover_format: string;
  style_preset: string;
  headlines: unknown;
  concept: unknown;
  image_variations: unknown;
  selected_headline: string | null;
  selected_image_id: string | null;
  created_at: string;
  profiles?: { full_name: string | null } | { full_name: string | null }[] | null;
};

export type ThumbnailGenerationListItem = {
  id: string;
  sourceHook: string;
  pillarLabel: string;
  angleLabel: string;
  styleLabel: string;
  coverFormatLabel: string;
  coverFormat: string;
  stylePreset: string;
  headlines: string[];
  concept: ThumbnailConcept | null;
  imageVariations: ThumbnailImageVariation[];
  selectedHeadline: string | null;
  selectedImageId: string | null;
  customHeadline: string | null;
  previewHeadline: string;
  previewImageUrl: string | null;
  createdAt: string;
  createdByName: string | null;
  aiContentGenerationId: string | null;
};

function getProfileName(
  relation:
    | { full_name: string | null }
    | { full_name: string | null }[]
    | null
    | undefined,
) {
  const profile = Array.isArray(relation) ? relation[0] : relation;
  return profile?.full_name ?? null;
}

export function mapThumbnailGenerationRow(
  row: AiThumbnailGenerationRow,
): ThumbnailGenerationListItem | null {
  const headlines = parseStoredThumbnailHeadlines(row.headlines);
  const concept = parseStoredThumbnailConcept(row.concept);
  const imageVariations = parseStoredThumbnailImages(row.image_variations);
  const previewHeadline =
    row.selected_headline || headlines[0] || row.custom_headline || row.source_hook;

  return {
    id: row.id,
    sourceHook: row.source_hook,
    pillarLabel: isContentStudioPillar(row.content_pillar)
      ? getContentStudioPillarLabel(row.content_pillar)
      : row.content_pillar,
    angleLabel: isContentStudioAngle(row.content_angle)
      ? getContentStudioAngleLabel(row.content_angle)
      : row.content_angle,
    styleLabel: getThumbnailStylePresetLabel(row.style_preset),
    coverFormatLabel: getThumbnailCoverFormatLabel(row.cover_format),
    coverFormat: row.cover_format,
    stylePreset: row.style_preset,
    headlines,
    concept,
    imageVariations,
    selectedHeadline: row.selected_headline,
    selectedImageId: row.selected_image_id,
    customHeadline: row.custom_headline,
    previewHeadline:
      previewHeadline.length > 80
        ? `${previewHeadline.slice(0, 77)}...`
        : previewHeadline,
    previewImageUrl:
      imageVariations.find((item) => item.id === row.selected_image_id)?.publicUrl ??
      imageVariations[0]?.publicUrl ??
      null,
    createdAt: row.created_at,
    createdByName: getProfileName(row.profiles),
    aiContentGenerationId: row.ai_content_generation_id,
  };
}

export function formatThumbnailDateTime(value: string) {
  return formatGenerationDateTime(value);
}

export async function loadRecentThumbnailGenerations(
  supabase: SupabaseServerClient,
  organizationId: string,
  limit = 20,
) {
  const { data, error } = await supabase
    .from("ai_thumbnail_generations")
    .select(
      `
      id,
      organization_id,
      created_by,
      ai_content_generation_id,
      source_hook,
      source_vo_script,
      content_pillar,
      content_angle,
      custom_headline,
      cover_format,
      style_preset,
      headlines,
      concept,
      image_variations,
      selected_headline,
      selected_image_id,
      created_at,
      profiles!ai_thumbnail_generations_created_by_fkey (
        full_name
      )
    `,
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => mapThumbnailGenerationRow(row as AiThumbnailGenerationRow))
    .filter((item): item is ThumbnailGenerationListItem => item !== null);
}

export async function loadThumbnailGenerationById(
  supabase: SupabaseServerClient,
  organizationId: string,
  generationId: string,
) {
  const { data, error } = await supabase
    .from("ai_thumbnail_generations")
    .select(
      `
      id,
      organization_id,
      created_by,
      ai_content_generation_id,
      source_hook,
      source_vo_script,
      content_pillar,
      content_angle,
      custom_headline,
      cover_format,
      style_preset,
      headlines,
      concept,
      image_variations,
      selected_headline,
      selected_image_id,
      created_at,
      profiles!ai_thumbnail_generations_created_by_fkey (
        full_name
      )
    `,
    )
    .eq("id", generationId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapThumbnailGenerationRow(data as AiThumbnailGenerationRow);
}

export async function loadOrgContentOptionsForThumbnailAttach(
  supabase: SupabaseServerClient,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from("contents")
    .select("id, title, status, platform")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
