import type { OwnerRevenueOverview } from "@/lib/dashboard/owner-dashboard-data";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

type OwnerRevenueOverviewCardProps = {
  overview: OwnerRevenueOverview;
};

export function OwnerRevenueOverviewCard({
  overview,
}: OwnerRevenueOverviewCardProps) {
  return (
    <div className="rounded-xl border p-6">
      <h2 className="text-lg font-semibold">Revenue Overview</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Ringkasan pendapatan organisasi bulan ini dan 30 hari terakhir.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Revenue This Month</p>
          <p className="mt-2 text-2xl font-bold text-green-700">
            {formatCurrency(overview.revenueThisMonth)}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Revenue Last 30 Days</p>
          <p className="mt-2 text-2xl font-bold">
            {formatCurrency(overview.revenueLast30Days)}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium">Revenue by Package</h3>
        {overview.revenueByPackage.length ? (
          <div className="mt-3 space-y-3">
            {overview.revenueByPackage.map((row) => (
              <div
                key={row.packageName}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <span className="font-medium">{row.packageName}</span>
                <span className="text-sm text-green-700">
                  {formatCurrency(row.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Belum ada pembayaran bulan ini.
          </p>
        )}
      </div>
    </div>
  );
}
