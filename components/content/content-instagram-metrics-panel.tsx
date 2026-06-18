import {
  formatInstagramMetricValue,
} from "@/lib/instagram/insights-display";
import type { ContentInstagramMetrics } from "@/lib/instagram/queries";

type ContentInstagramMetricsPanelProps = {
  metrics: ContentInstagramMetrics;
  insightsGranted?: boolean;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function ContentInstagramMetricsPanel({
  metrics,
  insightsGranted = false,
}: ContentInstagramMetricsPanelProps) {
  const items = [
    { label: "Likes", value: metrics.likes, metric: "likes" as const },
    {
      label: "Comments",
      value: metrics.comments,
      metric: "comments" as const,
    },
    {
      label: "Engagement",
      value: metrics.engagement,
      metric: "likes" as const,
    },
  ];

  return (
    <div className="rounded-xl border p-6">
      <h2 className="text-base font-semibold">Instagram Performance</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Metrics dari sinkronisasi Instagram Analytics.
      </p>

      {metrics.permalink ? (
        <p className="mt-3 text-sm">
          <a
            href={metrics.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Lihat post di Instagram
          </a>
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {item.label === "Engagement"
                ? formatInstagramMetricValue(
                    item.value,
                    insightsGranted,
                    "likes",
                  )
                : formatInstagramMetricValue(
                    item.value,
                    insightsGranted,
                    item.metric,
                  )}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Terakhir disinkronisasi: {formatDateTime(metrics.syncedAt)}
      </p>
    </div>
  );
}
