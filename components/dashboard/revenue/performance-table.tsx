import { cn } from "@/lib/utils";
import type { PerformanceRow } from "@/lib/dashboard/revenue-intelligence";

type PerformanceTableProps = {
  rows: PerformanceRow[];
  labelHeader: string;
  leadsHeader?: string;
  emptyMessage?: string;
};

function conversionToneClass(rate: number) {
  if (rate >= 40) {
    return "text-green-700";
  }
  if (rate >= 15) {
    return "text-amber-600";
  }
  return "text-muted-foreground";
}

export function PerformanceTable({
  rows,
  labelHeader,
  leadsHeader = "Leads",
  emptyMessage = "Belum ada data.",
}: PerformanceTableProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[460px] text-sm">
        <thead className="border-b bg-muted/50 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">{labelHeader}</th>
            <th className="px-4 py-3 text-right font-medium">{leadsHeader}</th>
            <th className="px-4 py-3 text-right font-medium">Bookings</th>
            <th className="px-4 py-3 text-right font-medium">Conversion</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b last:border-b-0">
              <td className="px-4 py-3 font-medium">{row.label}</td>
              <td className="px-4 py-3 text-right tabular-nums">{row.leads}</td>
              <td className="px-4 py-3 text-right tabular-nums">{row.bookings}</td>
              <td
                className={cn(
                  "px-4 py-3 text-right font-semibold tabular-nums",
                  conversionToneClass(row.conversionRate),
                )}
              >
                {row.conversionRate}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
