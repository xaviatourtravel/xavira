import {
  formatInstagramCompactMetricValue,
} from "@/lib/instagram/insights-display";
import type { ContentInstagramMetrics } from "@/lib/instagram/queries";

type ContentInstagramMetricsBadgeProps = {
  metrics: Pick<ContentInstagramMetrics, "likes" | "comments" | "engagement">;
  insightsGranted?: boolean;
};

export function ContentInstagramMetricsBadge({
  metrics,
  insightsGranted = false,
}: ContentInstagramMetricsBadgeProps) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
      <span>
        ♥{" "}
        {formatInstagramCompactMetricValue(metrics.likes, insightsGranted, "likes")}
      </span>
      <span>
        💬{" "}
        {formatInstagramCompactMetricValue(
          metrics.comments,
          insightsGranted,
          "comments",
        )}
      </span>
      <span>
        ⚡{" "}
        {formatInstagramCompactMetricValue(
          metrics.engagement,
          insightsGranted,
          "likes",
        )}
      </span>
    </div>
  );
}
