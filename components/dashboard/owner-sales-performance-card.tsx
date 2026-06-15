import type { SalesPerformanceRow } from "@/lib/dashboard/sales-performance";

type OwnerSalesPerformanceCardProps = {
  rows: SalesPerformanceRow[];
  showEmptyState: boolean;
};

export function OwnerSalesPerformanceCard({
  rows,
  showEmptyState,
}: OwnerSalesPerformanceCardProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold">Sales Performance</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Volume lead dan konversi won per anggota sales.
      </p>

      {showEmptyState ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm font-medium">Belum ada data performa penjualan</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Assign lead ke anggota tim untuk melihat metrik di sini.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Lead Count</th>
                <th className="px-4 py-3 font-medium">Won Count</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.profileId} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3">{row.assignedLeads}</td>
                  <td className="px-4 py-3 text-green-700">{row.wonLeads}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
