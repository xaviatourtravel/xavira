import Link from "next/link";

import type { MyLeadsMetrics } from "@/lib/leads/assignment";

type MyLeadsCardProps = {
  metrics: MyLeadsMetrics;
};

const METRIC_ITEMS = [
  {
    key: "totalAssigned",
    label: "Total Leads Assigned To Me",
    href: "/leads?assigned_to=me",
    valueClassName: "",
  },
  {
    key: "needFollowUp",
    label: "Need Follow Up",
    href: "/leads?assigned_to=me&aging=3",
    valueClassName: "text-yellow-600",
  },
  {
    key: "criticalLeads",
    label: "Critical Leads",
    href: "/leads?assigned_to=me&aging=7",
    valueClassName: "text-red-600",
  },
  {
    key: "wonLeads",
    label: "Won Leads",
    href: "/leads?assigned_to=me&status=won",
    valueClassName: "text-green-600",
  },
] as const;

export function MyLeadsCard({ metrics }: MyLeadsCardProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold">My Leads</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Ringkasan lead yang di-assign ke Anda.
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
