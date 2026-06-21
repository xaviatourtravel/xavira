import Link from "next/link";

import { SalesTodayTasksCard } from "@/components/dashboard/sales-today-tasks-card";
import { AiSalesAssistantCard } from "@/components/dashboard/ai-sales-assistant-card";
import { FollowUpTodayCard } from "@/components/dashboard/follow-up-today-card";
import { MyLeadsCard } from "@/components/dashboard/my-leads-card";
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
    label: "Open Follow Up Queue",
    href: "/follow-ups/queue?assigned=me",
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
    <div className="mx-auto w-full max-w-7xl space-y-6 overflow-x-hidden">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Ringkasan lead dan follow up yang di-assign ke Anda.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {KPI_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="rounded-xl border p-4 transition-colors hover:bg-accent/50 sm:p-6"
          >
            <p className="text-xs text-muted-foreground sm:text-sm">{item.label}</p>
            <p className="text-[11px] text-muted-foreground sm:text-xs">
              {item.description}
            </p>
            <h2
              className={`mt-2 text-2xl font-bold sm:text-3xl ${item.valueClassName}`.trim()}
            >
              {metrics[item.key]}
            </h2>
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        <div className="order-1">
          <SalesTodayTasksCard {...metrics.todayTasks} />
        </div>

        <div className="order-2">
          <FollowUpTodayCard todayFollowUps={metrics.todayFollowUps} />
        </div>

        <div className="order-3">
          <MyLeadsCard metrics={metrics.myLeadsMetrics} />
        </div>

        <div className="order-4">
          <AiSalesAssistantCard leads={metrics.priorityLeads} />
        </div>
      </div>

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
