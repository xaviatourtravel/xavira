import Link from "next/link";

import { AiSalesCopilotCard } from "@/components/dashboard/ai-sales-copilot-card";
import type { SalesDashboardMetrics } from "@/lib/dashboard/sales-dashboard-data";

const KPI_ITEMS = [
  {
    key: "totalAssignedLeads",
    label: "Total Leads",
    description: "Assigned to me",
    href: "/leads?assigned_to=me",
    valueClassName: "",
  },
  {
    key: "followUpTodayCount",
    label: "Follow Up Hari Ini",
    description: "My tasks",
    href: "/follow-ups?filter=today&assigned=me",
    valueClassName: "text-blue-600",
  },
  {
    key: "followUpOverdueCount",
    label: "Follow Up Terlambat",
    description: "My tasks",
    href: "/follow-ups?filter=overdue&assigned=me",
    valueClassName: "text-red-600",
  },
  {
    key: "criticalLeadsCount",
    label: "My Critical Leads",
    description: "Health score critical",
    href: "/leads?assigned_to=me&health=critical",
    valueClassName: "text-red-600",
  },
] as const;

const QUICK_ACTIONS = [
  {
    label: "View My Leads",
    href: "/leads?assigned_to=me",
  },
  {
    label: "Open Kanban",
    href: "/leads/kanban",
  },
  {
    label: "Open Follow Ups",
    href: "/follow-ups?assigned=me",
  },
] as const;

type SalesDashboardViewProps = {
  metrics: SalesDashboardMetrics;
};

export function SalesDashboardView({ metrics }: SalesDashboardViewProps) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Ringkasan lead dan follow up yang di-assign ke Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="rounded-xl border p-6 transition-colors hover:bg-accent/50"
          >
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="text-xs text-muted-foreground">{item.description}</p>
            <h2
              className={`mt-2 text-3xl font-bold ${item.valueClassName}`.trim()}
            >
              {metrics[item.key]}
            </h2>
          </Link>
        ))}
      </div>

      <AiSalesCopilotCard leads={metrics.priorityLeads} />

      <div>
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Akses cepat ke workflow harian sales.
        </p>

        <div className="flex flex-wrap gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent/50"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
