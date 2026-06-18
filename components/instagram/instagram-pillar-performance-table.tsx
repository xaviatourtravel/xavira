import { formatInstagramMetricValue } from "@/lib/instagram/insights-display";
import type { InstagramPillarPerformanceRow } from "@/lib/instagram/metrics";

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export function InstagramPillarPerformanceTable({
  rows,
  insightsGranted,
}: {
  rows: InstagramPillarPerformanceRow[];
  insightsGranted: boolean;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Belum ada data pillar. Link post ke Content Board dengan content pillar
        (via AI generation) untuk melihat performa per pillar.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="border-b bg-muted/50 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Content Pillar</th>
            <th className="px-4 py-3 text-right font-medium">Posts</th>
            <th className="px-4 py-3 text-right font-medium">Reach</th>
            <th className="px-4 py-3 text-right font-medium">Impressions</th>
            <th className="px-4 py-3 text-right font-medium">Engagement</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.pillar} className="border-b last:border-b-0">
              <td className="px-4 py-3 font-medium">{row.label}</td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatNumber(row.postCount)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatInstagramMetricValue(row.reach, insightsGranted, "reach")}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatInstagramMetricValue(
                  row.impressions,
                  insightsGranted,
                  "impressions",
                )}
              </td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-green-700">
                {formatNumber(row.engagement)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
