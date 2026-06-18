import {
  CONTENT_STUDIO_PILLARS,
  getContentStudioPillarLabel,
  isContentStudioPillar,
  type ContentStudioPillar,
} from "@/lib/ai/content-studio";
import { computeInstagramEngagement } from "@/lib/instagram/constants";

export type InstagramPillarPerformanceRow = {
  pillar: ContentStudioPillar;
  label: string;
  postCount: number;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  saves: number;
  engagement: number;
};

export type InstagramTopPostRow = {
  instagramMediaId: string;
  caption: string | null;
  permalink: string | null;
  postedAt: string | null;
  contentPillar: string | null;
  contentPillarLabel: string | null;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  saves: number;
  engagement: number;
  contentId: string | null;
  contentTitle: string | null;
};

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

export function buildInstagramPillarPerformance(
  mediaRows: MediaInsightRow[],
): InstagramPillarPerformanceRow[] {
  const counters = new Map<
    ContentStudioPillar,
    Omit<InstagramPillarPerformanceRow, "pillar" | "label">
  >(
    CONTENT_STUDIO_PILLARS.map((pillar) => [
      pillar,
      {
        postCount: 0,
        reach: 0,
        impressions: 0,
        likes: 0,
        comments: 0,
        saves: 0,
        engagement: 0,
      },
    ]),
  );

  for (const row of mediaRows) {
    if (!row.content_pillar || !isContentStudioPillar(row.content_pillar)) {
      continue;
    }
    const counter = counters.get(row.content_pillar);
    if (!counter) {
      continue;
    }
    counter.postCount += 1;
    counter.reach += row.reach;
    counter.impressions += row.impressions;
    counter.likes += row.likes;
    counter.comments += row.comments;
    counter.saves += row.saves;
    counter.engagement += computeInstagramEngagement(row);
  }

  return CONTENT_STUDIO_PILLARS.map((pillar) => {
    const stats = counters.get(pillar)!;
    return {
      pillar,
      label: getContentStudioPillarLabel(pillar),
      ...stats,
    };
  }).filter((row) => row.postCount > 0);
}

export function mapMediaInsightToPostRow(
  row: MediaInsightRow,
  contentTitlesById: Record<string, string> = {},
): InstagramTopPostRow {
  return {
    instagramMediaId: row.instagram_media_id,
    caption: row.caption,
    permalink: row.permalink,
    postedAt: row.posted_at,
    contentPillar: row.content_pillar,
    contentPillarLabel:
      row.content_pillar && isContentStudioPillar(row.content_pillar)
        ? getContentStudioPillarLabel(row.content_pillar)
        : null,
    reach: row.reach,
    impressions: row.impressions,
    likes: row.likes,
    comments: row.comments,
    saves: row.saves,
    engagement: computeInstagramEngagement(row),
    contentId: row.content_id,
    contentTitle: row.content_id
      ? (contentTitlesById[row.content_id] ?? null)
      : null,
  };
}

export function buildInstagramTopPosts(
  mediaRows: MediaInsightRow[],
  contentTitlesById: Record<string, string> = {},
  limit = 10,
): InstagramTopPostRow[] {
  return mediaRows
    .map((row) => mapMediaInsightToPostRow(row, contentTitlesById))
    .sort((a, b) => b.engagement - a.engagement || b.reach - a.reach)
    .slice(0, limit);
}

export function buildInstagramAllPosts(
  mediaRows: MediaInsightRow[],
  contentTitlesById: Record<string, string> = {},
): InstagramTopPostRow[] {
  return mediaRows
    .map((row) => mapMediaInsightToPostRow(row, contentTitlesById))
    .sort((a, b) => {
      const aTime = a.postedAt ? new Date(a.postedAt).getTime() : 0;
      const bTime = b.postedAt ? new Date(b.postedAt).getTime() : 0;
      return bTime - aTime;
    });
}

export function buildInstagramSummaryTotals(mediaRows: MediaInsightRow[]) {
  let reach = 0;
  let impressions = 0;
  let likes = 0;
  let comments = 0;
  let saves = 0;

  for (const row of mediaRows) {
    reach += row.reach;
    impressions += row.impressions;
    likes += row.likes;
    comments += row.comments;
    saves += row.saves;
  }

  return { reach, impressions, likes, comments, saves, postCount: mediaRows.length };
}
