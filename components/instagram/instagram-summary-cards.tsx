import {
  formatInstagramMetricValue,
  INSTAGRAM_INSIGHTS_HELPER_TEXT,
} from "@/lib/instagram/insights-display";
import type { InstagramAnalyticsMetrics } from "@/lib/instagram/queries";

const SUMMARY_ITEMS: Array<{
  key: keyof InstagramAnalyticsMetrics["summary"];
  label: string;
  metric: "reach" | "impressions" | "likes" | "comments" | "saves";
}> = [
  { key: "reach", label: "Reach", metric: "reach" },
  { key: "impressions", label: "Impressions", metric: "impressions" },
  { key: "likes", label: "Likes", metric: "likes" },
  { key: "comments", label: "Comments", metric: "comments" },
  { key: "saves", label: "Saves", metric: "saves" },
];

export function InstagramSummaryCards({
  summary,
  insightsGranted,
}: {
  summary: InstagramAnalyticsMetrics["summary"];
  insightsGranted: boolean;
}) {
  return (
    <div className="space-y-3">
      {!insightsGranted ? (
        <p className="text-sm text-muted-foreground">
          {INSTAGRAM_INSIGHTS_HELPER_TEXT}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {SUMMARY_ITEMS.map((item) => (
          <div key={item.key} className="rounded-xl border p-5">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums">
              {formatInstagramMetricValue(
                summary[item.key] as number,
                insightsGranted,
                item.metric,
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
