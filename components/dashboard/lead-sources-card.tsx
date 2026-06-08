import Link from "next/link";

import type { LeadSourceStatsRow } from "@/lib/leads/source-tracking";

type LeadSourcesCardProps = {
  rows: LeadSourceStatsRow[];
};

export function LeadSourcesCard({ rows }: LeadSourcesCardProps) {
  const hasData = rows.some((row) => row.leadCount > 0);

  return (
    <div>
      <h2 className="text-lg font-semibold">Lead Sources</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Performa akuisisi lead per sumber, termasuk konversi ke won.
      </p>

      {hasData ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Leads</th>
                <th className="px-4 py-3 font-medium">Won</th>
                <th className="px-4 py-3 font-medium">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.source} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/leads?source=${row.source}`}
                      className="text-blue-600 hover:underline"
                    >
                      {row.label}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{row.leadCount}</td>
                  <td className="px-4 py-3">{row.wonCount}</td>
                  <td className="px-4 py-3">{row.conversionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Belum ada data sumber lead.
        </p>
      )}
    </div>
  );
}
