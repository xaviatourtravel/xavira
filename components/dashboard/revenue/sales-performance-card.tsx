import type { PerformanceRow } from "@/lib/dashboard/revenue-intelligence";
import { ConversionBarChart } from "@/components/dashboard/revenue/conversion-bar-chart";
import { PerformanceTable } from "@/components/dashboard/revenue/performance-table";

type SalesPerformanceCardProps = {
  rows: PerformanceRow[];
};

export function SalesPerformanceCard({ rows }: SalesPerformanceCardProps) {
  return (
    <div className="rounded-xl border p-6">
      <h2 className="text-lg font-semibold">Sales Performance</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Assigned leads, bookings, dan conversion rate per sales rep.
      </p>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <PerformanceTable
          rows={rows}
          labelHeader="Sales Rep"
          leadsHeader="Assigned"
          emptyMessage="Belum ada lead yang di-assign ke sales rep."
        />
        {rows.length > 0 ? <ConversionBarChart rows={rows} /> : null}
      </div>
    </div>
  );
}
