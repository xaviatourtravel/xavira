import Link from "next/link";

import type { NeedAttentionMetrics } from "@/lib/leads/assignment";

type NeedAttentionCardProps = {
  metrics: NeedAttentionMetrics;
};

const METRIC_ITEMS = [
  {
    key: "overdueFollowUps",
    label: "Overdue Follow Ups",
    href: "/leads?follow_up=overdue",
    valueClassName: "text-red-600",
  },
  {
    key: "leadsInactive3Days",
    label: "Leads Inactive > 3 Days",
    href: "/leads?aging=3",
    valueClassName: "text-yellow-600",
  },
  {
    key: "leadsInactive7Days",
    label: "Leads Inactive > 7 Days",
    href: "/leads?aging=7",
    valueClassName: "text-red-600",
  },
  {
    key: "unassignedLeads",
    label: "Unassigned Leads",
    href: "/leads?assigned_to=unassigned",
    valueClassName: "text-orange-600",
  },
] as const;

export function NeedAttentionCard({ metrics }: NeedAttentionCardProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold">Need Attention</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Item yang perlu segera ditindaklanjuti.
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
