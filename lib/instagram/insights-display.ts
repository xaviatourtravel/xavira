import type { InstagramIntegrationMetadata } from "@/lib/instagram/constants";

export const INSTAGRAM_INSIGHTS_HELPER_TEXT =
  "Reach, impressions, dan saves membutuhkan permission Instagram Insights.";

export const INSTAGRAM_INSIGHTS_UNAVAILABLE_LABEL = "Belum tersedia";

export type InstagramInsightsMetricKey = "reach" | "impressions" | "saves";

const INSIGHTS_METRICS = new Set<InstagramInsightsMetricKey>([
  "reach",
  "impressions",
  "saves",
]);

export function isInstagramManageInsightsGranted(
  metadata: InstagramIntegrationMetadata,
): boolean {
  return metadata.instagramManageInsightsGranted === true;
}

export function getInstagramConnectionStatusLabel(
  isConfigured: boolean,
  insightsGranted: boolean,
): string {
  if (!isConfigured) {
    return "Not connected";
  }

  if (insightsGranted) {
    return "Connected";
  }

  return "Instagram Basic Connected";
}

export function getInstagramInsightsStatusLabel(
  isConfigured: boolean,
  insightsGranted: boolean,
): string | null {
  if (!isConfigured || insightsGranted) {
    return null;
  }

  return "Instagram Insights Permission Pending";
}

export function isInsightsMetricUnavailable(
  insightsGranted: boolean,
  metric: InstagramInsightsMetricKey | "likes" | "comments",
): boolean {
  return !insightsGranted && INSIGHTS_METRICS.has(metric as InstagramInsightsMetricKey);
}

export function formatInstagramMetricValue(
  value: number,
  insightsGranted: boolean,
  metric: InstagramInsightsMetricKey | "likes" | "comments",
): string {
  if (isInsightsMetricUnavailable(insightsGranted, metric)) {
    return INSTAGRAM_INSIGHTS_UNAVAILABLE_LABEL;
  }

  return new Intl.NumberFormat("id-ID").format(value);
}

export function formatInstagramCompactMetricValue(
  value: number,
  insightsGranted: boolean,
  metric: InstagramInsightsMetricKey | "likes" | "comments",
): string {
  if (isInsightsMetricUnavailable(insightsGranted, metric)) {
    return INSTAGRAM_INSIGHTS_UNAVAILABLE_LABEL;
  }

  return new Intl.NumberFormat("id-ID", { notation: "compact" }).format(value);
}

export function computeDisplayedEngagement(
  metrics: { likes: number; comments: number; saves: number },
  insightsGranted: boolean,
): number {
  if (insightsGranted) {
    return metrics.likes + metrics.comments + metrics.saves;
  }

  return metrics.likes + metrics.comments;
}
