import {
  buildInstagramAllPosts,
  buildInstagramPillarPerformance,
  buildInstagramSummaryTotals,
  buildInstagramTopPosts,
  type InstagramPillarPerformanceRow,
  type InstagramTopPostRow,
} from "@/lib/instagram/metrics";
import {
  INSTAGRAM_INTEGRATION_PROVIDER,
  parseInstagramIntegrationMetadata,
} from "@/lib/instagram/constants";
import {
  getInstagramConnectionStatusLabel,
  getInstagramInsightsStatusLabel,
  isInstagramManageInsightsGranted,
  computeDisplayedEngagement,
} from "@/lib/instagram/insights-display";
import { resolveInstagramIntegrationStatus } from "@/lib/instagram/integration";
import { isInstagramIntegrationConfigured } from "@/lib/instagram/oauth";
import type { createClient } from "@/utils/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type MediaInsightRow = {
  instagram_media_id: string;
  caption: string | null;
  permalink: string | null;
  posted_at: string | null;
  content_pillar: string | null;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  saves: number;
  content_id: string | null;
};

export type InstagramConnectionStatus = {
  status: string;
  username: string | null;
  pageName: string | null;
  followersCount: number;
  lastSyncedAt: string | null;
  isConfigured: boolean;
  connectionMethod: "oauth" | "manual" | null;
  insightsGranted: boolean;
  connectionStatusLabel: string;
  insightsStatusLabel: string | null;
};

export type InstagramAnalyticsMetrics = {
  connection: InstagramConnectionStatus;
  summary: ReturnType<typeof buildInstagramSummaryTotals>;
  topPosts: InstagramTopPostRow[];
  allPosts: InstagramTopPostRow[];
  pillarPerformance: InstagramPillarPerformanceRow[];
  hasData: boolean;
  insightsGranted: boolean;
};

export type ContentInstagramMetrics = {
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  saves: number;
  permalink: string | null;
  syncedAt: string | null;
  instagramMediaId: string | null;
  engagement: number;
};

const MEDIA_COLUMNS =
  "instagram_media_id, caption, permalink, posted_at, content_pillar, reach, impressions, likes, comments, saves, content_id, synced_at";

async function loadContentTitlesById(
  supabase: SupabaseServerClient,
  organizationId: string,
  contentIds: string[],
): Promise<Record<string, string>> {
  const ids = [...new Set(contentIds.filter(Boolean))];
  const result: Record<string, string> = {};

  if (ids.length === 0) {
    return result;
  }

  const { data } = await supabase
    .from("contents")
    .select("id, title")
    .eq("organization_id", organizationId)
    .in("id", ids);

  for (const row of data ?? []) {
    result[row.id] = row.title;
  }

  return result;
}

function mapInsightToContentMetrics(
  row: {
    instagram_media_id: string;
    permalink: string | null;
    reach: number | null;
    impressions: number | null;
    likes: number | null;
    comments: number | null;
    saves: number | null;
    synced_at: string | null;
  },
  insightsGranted: boolean,
): ContentInstagramMetrics {
  const metrics = {
    reach: row.reach ?? 0,
    impressions: row.impressions ?? 0,
    likes: row.likes ?? 0,
    comments: row.comments ?? 0,
    saves: row.saves ?? 0,
  };

  return {
    ...metrics,
    permalink: row.permalink,
    syncedAt: row.synced_at,
    instagramMediaId: row.instagram_media_id,
    engagement: computeDisplayedEngagement(metrics, insightsGranted),
  };
}

export async function loadInstagramConnectionStatus(
  supabase: SupabaseServerClient,
  organizationId: string,
): Promise<InstagramConnectionStatus> {
  const [{ data: integration }, { data: accountStats }] = await Promise.all([
    supabase
      .from("integrations")
      .select("status, metadata")
      .eq("organization_id", organizationId)
      .eq("provider", INSTAGRAM_INTEGRATION_PROVIDER)
      .maybeSingle(),
    supabase
      .from("instagram_account_stats")
      .select("username, followers_count, last_synced_at")
      .eq("organization_id", organizationId)
      .maybeSingle(),
  ]);

  const metadata = parseInstagramIntegrationMetadata(integration?.metadata);
  const isConfigured = isInstagramIntegrationConfigured(metadata);
  const insightsGranted = isInstagramManageInsightsGranted(metadata);
  const status = resolveInstagramIntegrationStatus(
    integration?.status ?? "not_connected",
    metadata,
  );

  return {
    status,
    username:
      accountStats?.username ??
      metadata.instagramUsername ??
      metadata.username ??
      null,
    followersCount:
      accountStats?.followers_count ?? metadata.followersCount ?? 0,
    lastSyncedAt:
      accountStats?.last_synced_at ?? metadata.lastSyncedAt ?? null,
    isConfigured,
    connectionMethod: metadata.connectionMethod ?? null,
    pageName: metadata.pageName ?? null,
    insightsGranted,
    connectionStatusLabel: getInstagramConnectionStatusLabel(
      isConfigured,
      insightsGranted,
    ),
    insightsStatusLabel: getInstagramInsightsStatusLabel(
      isConfigured,
      insightsGranted,
    ),
  };
}

export async function loadInstagramAnalyticsMetrics(
  supabase: SupabaseServerClient,
  organizationId: string,
): Promise<InstagramAnalyticsMetrics> {
  const [connection, { data: mediaRows }] = await Promise.all([
    loadInstagramConnectionStatus(supabase, organizationId),
    supabase
      .from("instagram_media_insights")
      .select(MEDIA_COLUMNS)
      .eq("organization_id", organizationId)
      .order("posted_at", { ascending: false })
      .limit(200),
  ]);

  const rows = (mediaRows ?? []) as MediaInsightRow[];
  const contentIds = rows.map((row) => row.content_id).filter(Boolean) as string[];
  const contentTitlesById = await loadContentTitlesById(
    supabase,
    organizationId,
    contentIds,
  );

  return {
    connection,
    summary: buildInstagramSummaryTotals(rows),
    topPosts: buildInstagramTopPosts(rows, contentTitlesById),
    allPosts: buildInstagramAllPosts(rows, contentTitlesById),
    pillarPerformance: buildInstagramPillarPerformance(rows),
    hasData: rows.length > 0,
    insightsGranted: connection.insightsGranted,
  };
}

export async function loadContentInstagramMetrics(
  supabase: SupabaseServerClient,
  organizationId: string,
  instagramMediaId: string | null,
  insightsGranted = false,
): Promise<ContentInstagramMetrics | null> {
  if (!instagramMediaId) {
    return null;
  }

  const { data } = await supabase
    .from("instagram_media_insights")
    .select(
      "instagram_media_id, permalink, reach, impressions, likes, comments, saves, synced_at",
    )
    .eq("organization_id", organizationId)
    .eq("instagram_media_id", instagramMediaId)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return mapInsightToContentMetrics(data, insightsGranted);
}

export async function loadContentInstagramMetricsMap(
  supabase: SupabaseServerClient,
  organizationId: string,
  instagramMediaIds: string[],
  insightsGranted = false,
): Promise<Record<string, ContentInstagramMetrics>> {
  const ids = instagramMediaIds.filter(Boolean);
  const result: Record<string, ContentInstagramMetrics> = {};

  if (ids.length === 0) {
    return result;
  }

  const { data } = await supabase
    .from("instagram_media_insights")
    .select(
      "instagram_media_id, permalink, reach, impressions, likes, comments, saves, synced_at",
    )
    .eq("organization_id", organizationId)
    .in("instagram_media_id", ids);

  for (const row of data ?? []) {
    result[row.instagram_media_id] = mapInsightToContentMetrics(
      row,
      insightsGranted,
    );
  }

  return result;
}
