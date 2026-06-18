import Link from "next/link";

import {
  computeDisplayedEngagement,
  formatInstagramMetricValue,
} from "@/lib/instagram/insights-display";
import type { InstagramTopPostRow } from "@/lib/instagram/metrics";

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function truncateCaption(value: string | null, max = 80) {
  if (!value) {
    return "Tanpa caption";
  }
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

export function InstagramTopPostsTable({
  rows,
  insightsGranted,
  canLink = false,
}: {
  rows: InstagramTopPostRow[];
  insightsGranted: boolean;
  canLink?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Belum ada data post. Sinkronisasi Instagram untuk memuat analytics.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="border-b bg-muted/50 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Post</th>
            {canLink ? (
              <th className="px-4 py-3 font-medium">Content Board</th>
            ) : null}
            <th className="px-4 py-3 font-medium">Pillar</th>
            <th className="px-4 py-3 text-right font-medium">Reach</th>
            <th className="px-4 py-3 text-right font-medium">Likes</th>
            <th className="px-4 py-3 text-right font-medium">Comments</th>
            <th className="px-4 py-3 text-right font-medium">Saves</th>
            <th className="px-4 py-3 text-right font-medium">Engagement</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.instagramMediaId} className="border-b last:border-b-0">
              <td className="px-4 py-3">
                <p className="font-medium leading-snug">
                  {truncateCaption(row.caption)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDate(row.postedAt)}
                </p>
                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                  {row.permalink ? (
                    <a
                      href={row.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Lihat di IG
                    </a>
                  ) : null}
                  {!canLink && row.contentId ? (
                    <Link
                      href={`/content/${row.contentId}`}
                      className="text-blue-600 hover:underline"
                    >
                      {row.contentTitle ?? "Content Board"}
                    </Link>
                  ) : null}
                </div>
              </td>
              {canLink ? (
                <td className="px-4 py-3">
                  {row.contentId ? (
                    <Link
                      href={`/content/${row.contentId}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {row.contentTitle ?? "Content Board"}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">Belum terhubung</span>
                  )}
                </td>
              ) : null}
              <td className="px-4 py-3 text-muted-foreground">
                {row.contentPillarLabel ?? "—"}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatInstagramMetricValue(row.reach, insightsGranted, "reach")}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatNumber(row.likes)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatNumber(row.comments)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatInstagramMetricValue(row.saves, insightsGranted, "saves")}
              </td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-green-700">
                {formatNumber(
                  computeDisplayedEngagement(row, insightsGranted),
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
