import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  Inbox,
  MessageSquare,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

import {
  buildExecutiveInsights,
  buildPipelineTakeaway,
  buildRevenueTrendLabel,
  formatDashboardCurrency,
  formatDashboardDate,
  formatRecentActivityTime,
  getRecentActivityIcon,
} from "@/lib/dashboard/owner-executive-insights";
import type { OwnerDashboardMetrics } from "@/lib/dashboard/owner-dashboard-data";
import { cn } from "@/lib/utils";

type DashboardSectionProps = {
  metrics: OwnerDashboardMetrics;
};

function DashboardCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl border bg-card shadow-sm", className)}>
      {children}
    </section>
  );
}

export function OwnerDashboardHeader() {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Owner Dashboard
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Executive overview of revenue, pipeline, inbox, and follow-up
          performance.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 lg:justify-end">
        <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>{formatDashboardDate()}</span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Live data
        </span>
      </div>
    </div>
  );
}

export function OwnerHeroRevenueSection({ metrics }: DashboardSectionProps) {
  const { executiveKpis, estimatedPipelineValue, revenuePreviousMonth } = metrics;
  const trendLabel = buildRevenueTrendLabel(
    executiveKpis.revenueThisMonth,
    revenuePreviousMonth,
  );

  return (
    <DashboardCard className="overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr]">
        <div className="border-b bg-gradient-to-br from-emerald-50/80 via-background to-background p-6 sm:p-8 lg:border-b-0 lg:border-r">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Revenue This Month
              </p>
              <p className="mt-3 text-4xl font-bold tracking-tight text-emerald-700 sm:text-5xl">
                {formatDashboardCurrency(executiveKpis.revenueThisMonth)}
              </p>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CircleDollarSign className="h-5 w-5" />
            </span>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">{trendLabel}</p>
        </div>

        <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-1">
          <div className="bg-card p-5 sm:p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Bookings This Month
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {executiveKpis.bookingsThisMonth}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Confirmed customer bookings
            </p>
          </div>

          <div className="bg-card p-5 sm:p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Estimated Pipeline Value
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {estimatedPipelineValue > 0
                ? formatDashboardCurrency(estimatedPipelineValue)
                : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {estimatedPipelineValue > 0
                ? "Based on active lead budgets"
                : "Add lead budgets to estimate pipeline value"}
            </p>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

export function OwnerExecutiveSummarySection({ metrics }: DashboardSectionProps) {
  const insights = buildExecutiveInsights(metrics);

  return (
    <DashboardCard className="p-6 sm:p-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Executive Summary</h2>
              <p className="text-sm text-muted-foreground">
                What needs your attention right now
              </p>
            </div>
          </div>

          <ul className="space-y-2.5">
            {insights.map((insight) => (
              <li
                key={insight}
                className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-2 lg:max-w-xs lg:flex-col">
          <Link
            href="/inbox"
            className="inline-flex items-center justify-center gap-2 rounded-xl border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50"
          >
            Open Inbox
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/follow-ups/queue"
            className="inline-flex items-center justify-center gap-2 rounded-xl border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50"
          >
            Review Follow Ups
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/leads"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            View Leads
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </DashboardCard>
  );
}

export function OwnerKpiStrip({ metrics }: DashboardSectionProps) {
  const items = [
    {
      label: "Active Leads",
      value: metrics.followUpHealth.totalLeads,
      helper: "Open opportunities in pipeline",
      icon: Users,
    },
    {
      label: "Bookings This Month",
      value: metrics.executiveKpis.bookingsThisMonth,
      helper: "New bookings recorded",
      icon: Target,
    },
    {
      label: "New Conversations",
      value:
        metrics.omnichannel.newConversations > 0
          ? metrics.omnichannel.newConversations
          : metrics.inboxMetrics.newConversations,
      helper: "Unread customer conversations",
      icon: MessageSquare,
    },
    {
      label: "Follow-up Overdue",
      value: metrics.followUpHealth.overdueLeads,
      helper: "Leads needing immediate action",
      icon: AlertTriangle,
      emphasis: metrics.followUpHealth.overdueLeads > 0,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <DashboardCard key={item.label} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </p>
                <p
                  className={cn(
                    "mt-2 text-3xl font-bold",
                    item.emphasis && "text-amber-700",
                  )}
                >
                  {item.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.helper}
                </p>
              </div>
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl",
                  item.emphasis
                    ? "bg-amber-100 text-amber-700"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
            </div>
          </DashboardCard>
        );
      })}
    </div>
  );
}

const PIPELINE_STAGES = [
  { key: "new", label: "New", href: "/leads/kanban?status=new" },
  { key: "contacted", label: "Contacted", href: "/leads/kanban?status=contacted" },
  { key: "qualified", label: "Qualified", href: "/leads/kanban?status=qualified" },
  {
    key: "negotiating",
    label: "Negotiating",
    href: "/leads/kanban?status=negotiating",
  },
  { key: "won", label: "Won", href: "/leads/kanban?status=won" },
] as const;

export function OwnerSalesPipelineSection({ metrics }: DashboardSectionProps) {
  const { pipelineFunnel } = metrics;
  const total = PIPELINE_STAGES.reduce(
    (sum, stage) => sum + pipelineFunnel[stage.key],
    0,
  );
  const takeaway = buildPipelineTakeaway(pipelineFunnel);

  return (
    <DashboardCard className="p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Sales Pipeline</h2>
          <p className="text-sm text-muted-foreground">
            Lead distribution across each stage
          </p>
        </div>
        <Link
          href="/leads/kanban"
          className="text-sm font-medium text-primary hover:underline"
        >
          View pipeline
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        {PIPELINE_STAGES.map((stage) => {
          const count = pipelineFunnel[stage.key];
          const widthPercent = total > 0 ? Math.max((count / total) * 100, 4) : 0;

          return (
            <Link
              key={stage.key}
              href={stage.href}
              className="block rounded-xl border bg-muted/20 p-4 transition-colors hover:bg-muted/40"
            >
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">{stage.label}</span>
                <span className="font-semibold tabular-nums">{count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    stage.key === "won" ? "bg-emerald-500" : "bg-primary/70",
                  )}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </Link>
          );
        })}
      </div>

      <p className="mt-5 rounded-xl bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        {takeaway}
      </p>
    </DashboardCard>
  );
}

export function OwnerCustomerConversationsSection({
  metrics,
}: DashboardSectionProps) {
  const { inboxMetrics, omnichannel } = metrics;
  const newConversations =
    omnichannel.newConversations > 0
      ? omnichannel.newConversations
      : inboxMetrics.newConversations;
  const activeConversations =
    omnichannel.activeConversations > 0
      ? omnichannel.activeConversations
      : inboxMetrics.totalConversations;

  return (
    <DashboardCard className="p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Customer Conversations</h2>
          <p className="text-sm text-muted-foreground">
            Instagram and Facebook inbox performance
          </p>
        </div>
        <Link
          href="/inbox"
          className="text-sm font-medium text-primary hover:underline"
        >
          Open Inbox
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-muted-foreground">New</p>
          <p className="mt-1 text-2xl font-bold">{newConversations}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Converted</p>
          <p className="mt-1 text-2xl font-bold">{inboxMetrics.convertedLeads}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Conversion</p>
          <p className="mt-1 text-2xl font-bold">{inboxMetrics.conversionRate}%</p>
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        {activeConversations} active conversation
        {activeConversations === 1 ? "" : "s"} across connected channels.
      </p>
    </DashboardCard>
  );
}

export function OwnerFollowUpRiskSection({ metrics }: DashboardSectionProps) {
  const { followUpHealth } = metrics;
  const hasRisk = followUpHealth.overdueLeads > 0;

  return (
    <DashboardCard
      className={cn(
        "p-6",
        hasRisk && "border-amber-200 bg-amber-50/30",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Follow-up Risk</h2>
          <p className="text-sm text-muted-foreground">
            Leads that may be slipping through the cracks
          </p>
        </div>
        <Link
          href="/follow-ups/queue"
          className="text-sm font-medium text-primary hover:underline"
        >
          Open Follow-up Queue
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Overdue Leads</p>
          <p
            className={cn(
              "mt-1 text-2xl font-bold",
              hasRisk && "text-amber-700",
            )}
          >
            {followUpHealth.overdueLeads}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Hot Leads Overdue</p>
          <p className="mt-1 text-2xl font-bold text-orange-700">
            {followUpHealth.hotLeadsOverdue}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Compliance</p>
          <p className="mt-1 text-2xl font-bold">
            {followUpHealth.compliance.today.complianceRate}%
          </p>
        </div>
      </div>

      {hasRisk ? (
        <p className="mt-4 flex items-center gap-2 text-sm font-medium text-amber-800">
          <AlertTriangle className="h-4 w-4" />
          Follow-up attention required today.
        </p>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">
          No overdue follow-ups right now. Keep momentum with today&apos;s queue.
        </p>
      )}
    </DashboardCard>
  );
}

export function OwnerRecentActivitySection({ metrics }: DashboardSectionProps) {
  const { recentActivity } = metrics;

  return (
    <DashboardCard className="p-6 sm:p-7">
      <div>
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <p className="text-sm text-muted-foreground">
          Latest movement across leads, inbox, bookings, and payments
        </p>
      </div>

      {recentActivity.length > 0 ? (
        <div className="mt-5 divide-y rounded-xl border">
          {recentActivity.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">
                  {getRecentActivityIcon(item.type)}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatRecentActivityTime(item.timestamp)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            No recent activity yet. Activity will appear as your team uses
            Desklabs.
          </p>
        </div>
      )}
    </DashboardCard>
  );
}

const STRATEGIC_ACTIONS = [
  {
    title: "Revenue Intelligence",
    description: "Understand what drives bookings, packages, and conversion.",
    href: "/revenue",
    icon: TrendingUp,
  },
  {
    title: "Inbox Management",
    description: "Review Instagram and Facebook conversations in one place.",
    href: "/inbox",
    icon: Inbox,
  },
  {
    title: "Lead Follow-up Queue",
    description: "Prioritize overdue and high-intent leads for your sales team.",
    href: "/follow-ups/queue",
    icon: Target,
  },
] as const;

export function OwnerStrategicActionsSection() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {STRATEGIC_ACTIONS.map((action) => {
        const Icon = action.icon;

        return (
          <Link
            key={action.href}
            href={action.href}
            className="group rounded-2xl border bg-card p-5 shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/5"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
            <h3 className="mt-4 font-semibold text-foreground">{action.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {action.description}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
