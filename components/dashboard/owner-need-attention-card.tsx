import Link from "next/link";

import type { OwnerNeedAttentionMetrics } from "@/lib/dashboard/owner-dashboard-data";

type OwnerNeedAttentionCardProps = {
  metrics: OwnerNeedAttentionMetrics;
};

const METRIC_ITEMS = [
  {
    key: "leadsWithoutFollowUp3Days" as const,
    label: "Leads Without Follow-up > 3 Days",
    href: "/leads?aging=3",
    valueClassName: "text-yellow-600",
  },
  {
    key: "coldLeads" as const,
    label: "Cold Leads",
    href: "/leads?temperature=cold",
    valueClassName: "text-slate-700",
  },
  {
    key: "unassignedLeads" as const,
    label: "Unassigned Leads",
    href: "/leads?assigned_to=unassigned",
    valueClassName: "text-orange-600",
  },
  {
    key: "unpaidBookings" as const,
    label: "Unpaid Bookings",
    href: "/bookings",
    valueClassName: "text-red-600",
  },
];

export function OwnerNeedAttentionCard({ metrics }: OwnerNeedAttentionCardProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold">Need Attention</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Area yang membutuhkan tindakan segera dari owner.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {METRIC_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="rounded-xl border p-4 transition-colors hover:bg-accent/50"
          >
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <h3
              className={`mt-2 text-2xl font-bold ${item.valueClassName}`.trim()}
            >
              {metrics[item.key]}
            </h3>
          </Link>
        ))}
      </div>
    </div>
  );
}
