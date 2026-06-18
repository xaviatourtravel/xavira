import type { createClient } from "@/utils/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type ContentBoardItem = {
  id: string;
  title: string;
  platform: string;
  content_type: string;
  status: string;
  publish_date: string | null;
  assigned_to: string | null;
  instagram_media_id: string | null;
  campaigns: { name: string } | { name: string }[] | null;
  profiles: { full_name: string | null } | { full_name: string | null }[] | null;
};

export async function resolveContentCampaignId(
  supabase: SupabaseServerClient,
  organizationId: string,
  campaignId: string,
): Promise<string | null> {
  const trimmed = campaignId.trim();

  if (!trimmed) {
    return null;
  }

  const { data, error } = await supabase
    .from("campaigns")
    .select("id")
    .eq("id", trimmed)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.id ?? null;
}

export async function resolveContentAssigneeId(
  supabase: SupabaseServerClient,
  organizationId: string,
  assigneeId: string,
): Promise<string | null> {
  const trimmed = assigneeId.trim();

  if (!trimmed) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", trimmed)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.id ?? null;
}

export function getContentRelationName<T extends { name?: string | null }>(
  relation: T | T[] | null | undefined,
) {
  if (!relation) {
    return null;
  }

  const item = Array.isArray(relation) ? relation[0] : relation;
  return item?.name ?? null;
}

export function getContentAssigneeName(
  relation:
    | { full_name: string | null }
    | { full_name: string | null }[]
    | null
    | undefined,
) {
  if (!relation) {
    return null;
  }

  const profile = Array.isArray(relation) ? relation[0] : relation;
  return profile?.full_name ?? null;
}
