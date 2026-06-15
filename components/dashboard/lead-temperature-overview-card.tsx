import Link from "next/link";

import type { OwnerTemperatureOverview } from "@/lib/dashboard/owner-dashboard-data";
import { cn } from "@/lib/utils";

type LeadTemperatureOverviewCardProps = {
  overview: OwnerTemperatureOverview;
};

const TEMPERATURE_ITEMS = [
  {
    key: "hot" as const,
    label: "Hot",
    percentKey: "hotPercent" as const,
    countKey: "hot" as const,
    badgeClassName: "bg-orange-100 text-orange-800",
    barClassName: "bg-orange-500",
  },
  {
    key: "warm" as const,
    label: "Warm",
    percentKey: "warmPercent" as const,
    countKey: "warm" as const,
    badgeClassName: "bg-yellow-100 text-yellow-800",
    barClassName: "bg-yellow-500",
  },
  {
    key: "cold" as const,
    label: "Cold",
    percentKey: "coldPercent" as const,
    countKey: "cold" as const,
    badgeClassName: "bg-slate-100 text-slate-700",
    barClassName: "bg-slate-400",
  },
];

export function LeadTemperatureOverviewCard({
  overview,
}: LeadTemperatureOverviewCardProps) {
  const total = overview.hot + overview.warm + overview.cold;

  return (
    <div className="rounded-xl border p-6">
      <h2 className="text-lg font-semibold">Lead Temperature Overview</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Klasifikasi suhu lead berdasarkan tingkat kesiapan beli.
      </p>

      {total === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada data lead.</p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {TEMPERATURE_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={`/leads?temperature=${item.key}`}
                className="rounded-lg border p-4 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "rounded-full px-2 py-1 text-xs font-medium",
                      item.badgeClassName,
                    )}
                  >
                    {item.label}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {overview[item.percentKey]}%
                  </span>
                </div>
                <p className="mt-3 text-2xl font-bold">
                  {overview[item.countKey]}
                </p>
              </Link>
            ))}
          </div>

          <div className="flex h-3 overflow-hidden rounded-full bg-muted">
            {TEMPERATURE_ITEMS.map((item) =>
              overview[item.percentKey] > 0 ? (
                <div
                  key={item.key}
                  className={cn(item.barClassName)}
                  style={{ width: `${overview[item.percentKey]}%` }}
                  title={`${item.label}: ${overview[item.percentKey]}%`}
                />
              ) : null,
            )}
          </div>
        </div>
      )}
    </div>
  );
}
