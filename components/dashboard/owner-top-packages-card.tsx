import type { OwnerTopPackageRow } from "@/lib/dashboard/owner-dashboard-data";

type OwnerTopPackagesCardProps = {
  rows: OwnerTopPackageRow[];
};

export function OwnerTopPackagesCard({ rows }: OwnerTopPackagesCardProps) {
  return (
    <div className="rounded-xl border p-6">
      <h2 className="text-lg font-semibold">Top Packages</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Paket dengan volume lead dan booking tertinggi.
      </p>

      {rows.length ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Package</th>
                <th className="px-4 py-3 font-medium">Lead Count</th>
                <th className="px-4 py-3 font-medium">Booking Count</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.packageName}
                  className="border-b last:border-b-0"
                >
                  <td className="px-4 py-3 font-medium">{row.packageName}</td>
                  <td className="px-4 py-3">{row.leadCount}</td>
                  <td className="px-4 py-3">{row.bookingCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Belum ada data paket.</p>
      )}
    </div>
  );
}
