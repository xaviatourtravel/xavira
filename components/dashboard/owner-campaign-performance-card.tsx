import Link from "next/link";

import type { TopCampaignRow } from "@/lib/campaigns/metrics";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

type OwnerCampaignPerformanceCardProps = {
  rows: TopCampaignRow[];
};

export function OwnerCampaignPerformanceCard({
  rows,
}: OwnerCampaignPerformanceCardProps) {
  return (
    <div className="rounded-xl border p-6">
      <h2 className="text-lg font-semibold">Campaign Performance</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Top 5 campaign berdasarkan revenue dari lead attribution.
      </p>

      {rows.length ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Campaign</th>
                <th className="px-4 py-3 font-medium">Lead Count</th>
                <th className="px-4 py-3 font-medium">Booking Count</th>
                <th className="px-4 py-3 font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.campaignId} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/campaigns/${row.campaignId}`}
                      className="text-blue-600 hover:underline"
                    >
                      {row.campaignName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{row.leadCount}</td>
                  <td className="px-4 py-3">{row.bookingCount}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-green-700">
                    {formatCurrency(row.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Belum ada data campaign attribution.
        </p>
      )}
    </div>
  );
}
