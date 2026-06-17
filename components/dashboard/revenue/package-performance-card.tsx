import type { PerformanceRow } from "@/lib/dashboard/revenue-intelligence";
import { ConversionBarChart } from "@/components/dashboard/revenue/conversion-bar-chart";
import { PerformanceTable } from "@/components/dashboard/revenue/performance-table";

type PackagePerformanceCardProps = {
  rows: PerformanceRow[];
};

export function PackagePerformanceCard({ rows }: PackagePerformanceCardProps) {
  return (
    <div className="rounded-xl border p-6">
      <h2 className="text-lg font-semibold">Package Performance</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Lead interest vs booking aktual per paket. Conversion = bookings / leads.
      </p>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <PerformanceTable
          rows={rows}
          labelHeader="Package"
          emptyMessage="Belum ada lead atau booking dengan paket."
        />
        {rows.length > 0 ? <ConversionBarChart rows={rows} /> : null}
      </div>
    </div>
  );
}
