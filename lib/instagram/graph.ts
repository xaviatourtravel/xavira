import {
  GRAPH_API_BASE,
  INSTAGRAM_MEDIA_SYNC_LIMIT,
} from "@/lib/instagram/constants";

export type GraphApiError = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
  };
};

export type InstagramAccountResponse = {
  id: string;
  username?: string;
  followers_count?: number;
  name?: string;
};

export type InstagramMediaItem = {
  id: string;
  caption?: string;
  media_type?: string;
  permalink?: string;
  timestamp?: string;
  like_count?: number;
  comments_count?: number;
};

export type InstagramMediaListResponse = {
  data?: InstagramMediaItem[];
  paging?: { next?: string };
  error?: GraphApiError["error"];
};

export type InstagramInsightValue = {
  name: string;
  values?: Array<{ value?: number }>;
};

export type InstagramInsightsResponse = {
  data?: InstagramInsightValue[];
  error?: GraphApiError["error"];
};

export type InstagramMediaWithMetrics = {
  instagramMediaId: string;
  mediaType: string | null;
  permalink: string | null;
  caption: string | null;
  postedAt: string | null;
  likes: number;
  comments: number;
  reach: number;
  impressions: number;
  saves: number;
};

async function graphFetch<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const payload = (await response.json()) as T & GraphApiError;

  if (!response.ok || payload.error) {
    const message =
      payload.error?.message ??
      `Meta Graph API request failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
}

function buildUrl(path: string, accessToken: string, params?: Record<string, string>) {
  const url = new URL(`${GRAPH_API_BASE}${path}`);
  url.searchParams.set("access_token", accessToken);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export async function fetchInstagramAccount(
  accessToken: string,
  instagramBusinessAccountId: string,
): Promise<InstagramAccountResponse> {
  return graphFetch<InstagramAccountResponse>(
    buildUrl(`/${instagramBusinessAccountId}`, accessToken, {
      fields: "id,username,followers_count,name",
    }),
  );
}

export async function fetchInstagramMediaList(
  accessToken: string,
  instagramBusinessAccountId: string,
  limit = INSTAGRAM_MEDIA_SYNC_LIMIT,
): Promise<InstagramMediaItem[]> {
  const response = await graphFetch<InstagramMediaListResponse>(
    buildUrl(`/${instagramBusinessAccountId}/media`, accessToken, {
      fields:
        "id,caption,media_type,permalink,timestamp,like_count,comments_count",
      limit: String(limit),
    }),
  );

  return response.data ?? [];
}

function insightMetricsForMediaType(mediaType: string | undefined): string {
  // Reels use plays; feed/carousel use impressions + reach + saved.
  if (mediaType === "VIDEO" || mediaType === "REELS") {
    return "reach,plays,saved,likes,comments,total_interactions";
  }
  return "reach,impressions,saved,likes,comments";
}

export async function probeInstagramManageInsights(
  accessToken: string,
  instagramBusinessAccountId: string,
): Promise<boolean> {
  const mediaList = await fetchInstagramMediaList(
    accessToken,
    instagramBusinessAccountId,
    1,
  );

  if (mediaList.length === 0) {
    return false;
  }

  const media = mediaList[0];
  const url = buildUrl(`/${media.id}/insights`, accessToken, {
    metric: insightMetricsForMediaType(media.media_type),
  });

  const response = await fetch(url, { cache: "no-store" });
  const payload = (await response.json()) as InstagramInsightsResponse;

  if (payload.error) {
    return false;
  }

  const insightNames = new Set((payload.data ?? []).map((item) => item.name));
  return (
    insightNames.has("reach") ||
    insightNames.has("impressions") ||
    insightNames.has("saved") ||
    insightNames.has("plays")
  );
}

export async function fetchMediaInsights(
  accessToken: string,
  mediaId: string,
  mediaType?: string,
): Promise<Record<string, number>> {
  try {
    const response = await graphFetch<InstagramInsightsResponse>(
      buildUrl(`/${mediaId}/insights`, accessToken, {
        metric: insightMetricsForMediaType(mediaType),
      }),
    );

    const result: Record<string, number> = {};
    for (const item of response.data ?? []) {
      const value = item.values?.[0]?.value ?? 0;
      result[item.name] = value;
    }
    return result;
  } catch {
    // Some media types or permissions may not return all insight metrics.
    return {};
  }
}

export async function fetchInstagramMediaWithMetrics(
  accessToken: string,
  instagramBusinessAccountId: string,
  limit = INSTAGRAM_MEDIA_SYNC_LIMIT,
): Promise<InstagramMediaWithMetrics[]> {
  const mediaList = await fetchInstagramMediaList(
    accessToken,
    instagramBusinessAccountId,
    limit,
  );

  const results: InstagramMediaWithMetrics[] = [];

  for (const media of mediaList) {
    const insights = await fetchMediaInsights(
      accessToken,
      media.id,
      media.media_type,
    );

    const likes = insights.likes ?? media.like_count ?? 0;
    const comments = insights.comments ?? media.comments_count ?? 0;
    const reach = insights.reach ?? 0;
    const impressions =
      insights.impressions ?? insights.plays ?? insights.total_interactions ?? 0;
    const saves = insights.saved ?? 0;

    results.push({
      instagramMediaId: media.id,
      mediaType: media.media_type ?? null,
      permalink: media.permalink ?? null,
      caption: media.caption ?? null,
      postedAt: media.timestamp ?? null,
      likes,
      comments,
      reach,
      impressions,
      saves,
    });
  }

  return results;
}

/** Validates credentials by fetching the account profile from Graph API. */
export async function validateInstagramCredentials(
  accessToken: string,
  instagramBusinessAccountId: string,
): Promise<InstagramAccountResponse> {
  return fetchInstagramAccount(accessToken, instagramBusinessAccountId);
}
