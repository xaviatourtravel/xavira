import Link from "next/link";

import type { LeadSourceRevenueRow } from "@/lib/leads/source-revenue";

type RevenueBySourceCardProps = {
  rows: LeadSourceRevenueRow[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function RevenueBySourceCard({ rows }: RevenueBySourceCardProps) {
  const hasData = rows.some(
    (row) => row.leadCount > 0 || row.totalRevenueReceived > 0,
  );

  return (
    <div>
      <h2 className="text-lg font-semibold">Revenue by Source</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Pendapatan aktual dari pembayaran yang diterima, diatribusikan ke sumber
        lead.
      </p>

      {hasData ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Leads</th>
                <th className="px-4 py-3 font-medium">Won</th>
                <th className="px-4 py-3 font-medium">Revenue</th>
                <th className="px-4 py-3 font-medium">Conv %</th>
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
                  <td className="px-4 py-3">
                    {formatCurrency(row.totalRevenueReceived)}
                  </td>
                  <td className="px-4 py-3">{row.conversionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Belum ada data pendapatan per sumber lead.
        </p>
      )}
    </div>
  );
}
