import {
  fetchInstagramMediaWithMetrics,
  probeInstagramManageInsights,
  validateInstagramCredentials,
} from "@/lib/instagram/graph";
import {
  INSTAGRAM_INTEGRATION_PROVIDER,
  parseInstagramIntegrationMetadata,
} from "@/lib/instagram/constants";
import { findAutoLinkContentMatch } from "@/lib/instagram/matching";
import type { createClient } from "@/utils/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type ContentLinkRow = {
  id: string;
  title: string;
  caption: string | null;
  instagram_media_id: string | null;
  instagram_permalink: string | null;
  publish_date: string | null;
  status: string;
  ai_generation_id: string | null;
  ai_content_generations:
    | { content_pillar: string | null }
    | { content_pillar: string | null }[]
    | null;
};

function getContentPillar(row: ContentLinkRow): string | null {
  const gen = row.ai_content_generations;
  if (!gen) {
    return null;
  }
  const item = Array.isArray(gen) ? gen[0] : gen;
  return item?.content_pillar ?? null;
}

export async function loadInstagramIntegration(
  supabase: SupabaseServerClient,
  organizationId: string,
) {
  const { data } = await supabase
    .from("integrations")
    .select("status, metadata")
    .eq("organization_id", organizationId)
    .eq("provider", INSTAGRAM_INTEGRATION_PROVIDER)
    .maybeSingle();

  return {
    status: data?.status ?? "not_connected",
    metadata: parseInstagramIntegrationMetadata(data?.metadata),
  };
}

export async function syncInstagramAnalyticsForOrganization(
  supabase: SupabaseServerClient,
  organizationId: string,
  accessToken: string,
  instagramBusinessAccountId: string,
): Promise<{ syncedCount: number; username: string; followersCount: number }> {
  const account = await validateInstagramCredentials(
    accessToken,
    instagramBusinessAccountId,
  );

  const mediaWithMetrics = await fetchInstagramMediaWithMetrics(
    accessToken,
    instagramBusinessAccountId,
  );
  const instagramManageInsightsGranted = await probeInstagramManageInsights(
    accessToken,
    instagramBusinessAccountId,
  );

  const now = new Date().toISOString();

  await supabase.from("instagram_account_stats").upsert(
    {
      organization_id: organizationId,
      instagram_business_account_id: instagramBusinessAccountId,
      username: account.username ?? null,
      followers_count: account.followers_count ?? 0,
      last_synced_at: now,
      updated_at: now,
    },
    { onConflict: "organization_id" },
  );

  const { data: instagramContents } = await supabase
    .from("contents")
    .select(
      `
      id,
      title,
      caption,
      status,
      publish_date,
      instagram_media_id,
      instagram_permalink,
      ai_generation_id,
      ai_content_generations ( content_pillar )
    `,
    )
    .eq("organization_id", organizationId)
    .eq("platform", "instagram");

  const contentRows = (instagramContents ?? []) as ContentLinkRow[];

  for (const media of mediaWithMetrics) {
    const matched = findAutoLinkContentMatch(contentRows, {
      instagramMediaId: media.instagramMediaId,
      permalink: media.permalink,
      caption: media.caption,
      postedAt: media.postedAt,
    });

    const contentPillar = matched ? getContentPillar(matched) : null;
    const contentId = matched?.id ?? null;

    if (matched && !matched.instagram_media_id) {
      await supabase
        .from("contents")
        .update({
          instagram_media_id: media.instagramMediaId,
          instagram_permalink: media.permalink,
        })
        .eq("id", matched.id)
        .eq("organization_id", organizationId);
    }

    await supabase.from("instagram_media_insights").upsert(
      {
        organization_id: organizationId,
        instagram_media_id: media.instagramMediaId,
        media_type: media.mediaType,
        permalink: media.permalink,
        caption: media.caption,
        posted_at: media.postedAt,
        reach: media.reach,
        impressions: media.impressions,
        likes: media.likes,
        comments: media.comments,
        saves: media.saves,
        content_pillar: contentPillar,
        content_id: contentId,
        synced_at: now,
        updated_at: now,
      },
      { onConflict: "organization_id,instagram_media_id" },
    );
  }

  const { data: existingIntegration } = await supabase
    .from("integrations")
    .select("metadata")
    .eq("organization_id", organizationId)
    .eq("provider", INSTAGRAM_INTEGRATION_PROVIDER)
    .maybeSingle();

  const existingMetadata = parseInstagramIntegrationMetadata(
    existingIntegration?.metadata,
  );

  const metadata = {
    ...existingMetadata,
    pageAccessToken: accessToken,
    accessToken,
    instagramBusinessAccountId,
    username: account.username ?? existingMetadata.username ?? null,
    instagramUsername:
      account.username ?? existingMetadata.instagramUsername ?? null,
    followersCount: account.followers_count ?? 0,
    lastSyncedAt: now,
    businessAccountStatus: instagramManageInsightsGranted
      ? "connected"
      : "instagram_basic_connected",
    instagramManageInsightsGranted,
    connectedAccount:
      existingMetadata.pageName ??
      account.name ??
      account.username ??
      instagramBusinessAccountId,
  };

  await supabase.from("integrations").upsert(
    {
      organization_id: organizationId,
      provider: INSTAGRAM_INTEGRATION_PROVIDER,
      status: "connected",
      metadata,
      updated_at: now,
    },
    { onConflict: "organization_id,provider" },
  );

  return {
    syncedCount: mediaWithMetrics.length,
    username: account.username ?? "",
    followersCount: account.followers_count ?? 0,
  };
}
