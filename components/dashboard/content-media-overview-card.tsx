import Link from "next/link";

import type { ContentOverviewMetrics } from "@/lib/dashboard/content-overview";

type ContentMediaOverviewCardProps = {
  metrics: ContentOverviewMetrics;
};

export function ContentMediaOverviewCard({
  metrics,
}: ContentMediaOverviewCardProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Content / Media Overview</h2>
          <p className="text-sm text-muted-foreground">
            Ringkasan konten organisasi di content board.
          </p>
        </div>

        <Link
          href="/content"
          className="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent/50"
        >
          Open Content Board
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/content"
          className="rounded-xl border p-4 transition-colors hover:bg-accent/50"
        >
          <p className="text-sm text-muted-foreground">Total Content</p>
          <h3 className="mt-2 text-2xl font-bold">{metrics.total}</h3>
        </Link>

        {metrics.byStatus.map((item) => (
          <Link
            key={item.status}
            href={`/content?status=${item.status}`}
            className="rounded-xl border p-4 transition-colors hover:bg-accent/50"
          >
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <h3 className="mt-2 text-2xl font-bold">{item.count}</h3>
          </Link>
        ))}
      </div>
    </div>
  );
}
