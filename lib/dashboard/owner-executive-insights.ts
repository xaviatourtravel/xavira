import type {
  OwnerDashboardMetrics,
  OwnerPipelineFunnel,
  OwnerRecentActivityItem,
} from "@/lib/dashboard/owner-dashboard-data";

const PIPELINE_STAGE_LABELS: Record<keyof OwnerPipelineFunnel, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  negotiating: "Negotiating",
  won: "Won",
};

export function formatDashboardCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDashboardDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export function buildRevenueTrendShort(
  revenueThisMonth: number,
  revenuePreviousMonth: number,
) {
  if (revenuePreviousMonth === 0 && revenueThisMonth === 0) {
    return "No revenue yet";
  }

  if (revenuePreviousMonth === 0) {
    return "Started this month";
  }

  const changePercent = Math.round(
    ((revenueThisMonth - revenuePreviousMonth) / revenuePreviousMonth) * 100,
  );

  if (changePercent > 0) {
    return `+${changePercent}% vs last month`;
  }

  if (changePercent < 0) {
    return `${changePercent}% vs last month`;
  }

  return "Flat vs last month";
}

export type TodayPriorityItem = {
  id: string;
  label: string;
  count: number;
  detail: string;
  href: string;
  tone: "urgent" | "action" | "neutral" | "opportunity";
};

export function buildTodaysPriorities(
  metrics: OwnerDashboardMetrics,
): TodayPriorityItem[] {
  const waitingForReply =
    metrics.omnichannel.waitingForReply > 0
      ? metrics.omnichannel.waitingForReply
      : metrics.inboxMetrics.newConversations;

  return [
    {
      id: "overdue-follow-ups",
      label: "Overdue follow ups",
      count: metrics.followUpHealth.overdueLeads,
      detail:
        metrics.followUpHealth.overdueLeads > 0
          ? "Leads past their follow-up window"
          : "Nothing overdue right now",
      href: "/follow-ups?filter=overdue",
      tone: metrics.followUpHealth.overdueLeads > 0 ? "urgent" : "neutral",
    },
    {
      id: "waiting-reply",
      label: "Customers waiting for reply",
      count: waitingForReply,
      detail:
        waitingForReply > 0
          ? "New or unread inbox conversations"
          : "Inbox is caught up",
      href: "/inbox",
      tone: waitingForReply > 0 ? "action" : "neutral",
    },
    {
      id: "due-today",
      label: "Follow ups due today",
      count: metrics.followUpHealth.dueTodayLeads,
      detail:
        metrics.followUpHealth.dueTodayLeads > 0
          ? "Scheduled for today"
          : "No follow ups due today",
      href: "/follow-ups?filter=today",
      tone: metrics.followUpHealth.dueTodayLeads > 0 ? "action" : "neutral",
    },
    {
      id: "negotiating",
      label: "Negotiating leads",
      count: metrics.pipelineFunnel.negotiating,
      detail:
        metrics.pipelineFunnel.negotiating > 0
          ? "Deals in active negotiation"
          : "No leads in negotiation",
      href: "/leads?status=negotiating",
      tone:
        metrics.pipelineFunnel.negotiating > 0 ? "opportunity" : "neutral",
    },
  ];
}

export type PipelineFunnelCard = {
  key: keyof OwnerPipelineFunnel;
  label: string;
  count: number;
  sharePercent: number;
  conversionPercent: number | null;
};

const FUNNEL_STAGE_ORDER: Array<{
  key: keyof OwnerPipelineFunnel;
  label: string;
}> = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "qualified", label: "Qualified" },
  { key: "negotiating", label: "Negotiating" },
  { key: "won", label: "Won" },
];

export function buildPipelineFunnelCards(
  funnel: OwnerPipelineFunnel,
): PipelineFunnelCard[] {
  const total = FUNNEL_STAGE_ORDER.reduce(
    (sum, stage) => sum + funnel[stage.key],
    0,
  );

  return FUNNEL_STAGE_ORDER.map((stage, index) => {
    const count = funnel[stage.key];
    const sharePercent = total > 0 ? Math.round((count / total) * 100) : 0;
    const previousCount =
      index > 0 ? funnel[FUNNEL_STAGE_ORDER[index - 1].key] : funnel.new;
    const conversionPercent =
      index === 0
        ? total > 0
          ? 100
          : 0
        : previousCount > 0
          ? Math.round((count / previousCount) * 100)
          : null;

    return {
      key: stage.key,
      label: stage.label,
      count,
      sharePercent,
      conversionPercent,
    };
  });
}

export function buildPipelineTakeaway(funnel: OwnerPipelineFunnel) {
  const stages = (
    Object.entries(funnel) as Array<[keyof OwnerPipelineFunnel, number]>
  ).filter(([key]) => key !== "won");

  const total = stages.reduce((sum, [, count]) => sum + count, 0);

  if (total === 0) {
    return "Add leads to start building your pipeline.";
  }

  const [topStage] = [...stages].sort((a, b) => b[1] - a[1]);
  const [stageKey, stageCount] = topStage;

  if (stageCount === 0) {
    return "Move new leads into contact to build momentum.";
  }

  return `Most leads are in ${PIPELINE_STAGE_LABELS[stageKey]}.`;
}

export type HeroKpiItem = {
  label: string;
  value: string;
  trend: string;
  tone?: "default" | "warning" | "success";
  emptyState?: boolean;
  href?: string;
};

export function buildHeroKpis(metrics: OwnerDashboardMetrics): HeroKpiItem[] {
  const activeConversations =
    metrics.omnichannel.activeConversations > 0
      ? metrics.omnichannel.activeConversations
      : metrics.inboxMetrics.totalConversations;

  const newConversations =
    metrics.omnichannel.newConversations > 0
      ? metrics.omnichannel.newConversations
      : metrics.inboxMetrics.newConversations;

  return [
    {
      label: "New Leads",
      value: String(metrics.executiveKpis.leadsThisMonth),
      trend:
        metrics.executiveKpis.leadsToday > 0
          ? `+${metrics.executiveKpis.leadsToday} today`
          : `${metrics.followUpHealth.totalLeads} active in pipeline`,
      tone: "default",
    },
    {
      label: "Active Conversations",
      value: String(activeConversations),
      trend:
        newConversations > 0
          ? `${newConversations} new awaiting reply`
          : activeConversations > 0
            ? "Inbox is active"
            : "Connect channels to start",
      tone: activeConversations > 0 ? "success" : "default",
    },
    {
      label: "Follow Ups Due",
      value: String(metrics.followUpHealth.overdueLeads),
      trend:
        metrics.followUpHealth.overdueLeads > 0
          ? "Requires attention"
          : "All caught up",
      tone: metrics.followUpHealth.overdueLeads > 0 ? "warning" : "success",
    },
    {
      label: "Revenue This Month",
      value:
        metrics.executiveKpis.revenueThisMonth > 0
          ? formatDashboardCurrency(metrics.executiveKpis.revenueThisMonth)
          : "—",
      trend:
        metrics.executiveKpis.revenueThisMonth > 0
          ? buildRevenueTrendShort(
              metrics.executiveKpis.revenueThisMonth,
              metrics.revenuePreviousMonth,
            )
          : metrics.executiveKpis.bookingsThisMonth > 0
            ? "Bookings recorded — add payment to track revenue"
            : "Close a deal or record a payment to start tracking",
      tone:
        metrics.executiveKpis.revenueThisMonth > 0 ? "success" : "default",
      emptyState: metrics.executiveKpis.revenueThisMonth === 0,
      href: "/bookings",
    },
  ];
}

export type ExecutiveSummaryItem = {
  id: string;
  icon: "alert" | "message" | "trend" | "money";
  text: string;
  tone: "warning" | "info" | "success" | "neutral";
};

export function buildExecutiveSummaryItems(
  metrics: OwnerDashboardMetrics,
): ExecutiveSummaryItem[] {
  const activeConversations =
    metrics.omnichannel.activeConversations > 0
      ? metrics.omnichannel.activeConversations
      : metrics.inboxMetrics.totalConversations;

  const items: ExecutiveSummaryItem[] = [
    {
      id: "follow-ups",
      icon: "alert",
      text:
        metrics.followUpHealth.overdueLeads > 0
          ? `${metrics.followUpHealth.overdueLeads} follow ups require attention`
          : "Follow ups are on track",
      tone:
        metrics.followUpHealth.overdueLeads > 0 ? "warning" : "success",
    },
    {
      id: "conversations",
      icon: "message",
      text:
        activeConversations > 0
          ? `${activeConversations} active conversation${activeConversations === 1 ? "" : "s"}`
          : "No active conversations yet",
      tone: activeConversations > 0 ? "info" : "neutral",
    },
    {
      id: "leads",
      icon: "trend",
      text: `${metrics.followUpHealth.totalLeads} active lead${metrics.followUpHealth.totalLeads === 1 ? "" : "s"}`,
      tone: metrics.followUpHealth.totalLeads > 0 ? "success" : "neutral",
    },
    {
      id: "bookings",
      icon: "money",
      text: `${metrics.executiveKpis.bookingsThisMonth} booking${metrics.executiveKpis.bookingsThisMonth === 1 ? "" : "s"} this month`,
      tone:
        metrics.executiveKpis.bookingsThisMonth > 0 ? "success" : "neutral",
    },
  ];

  return items;
}

export function formatRecentActivityTime(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export function getActivityFeedMeta(item: OwnerRecentActivityItem) {
  switch (item.type) {
    case "lead":
      return { category: "Lead", tone: "sky" as const };
    case "conversation":
      return { category: "Inbox", tone: "violet" as const };
    case "booking":
      return { category: "Booking", tone: "emerald" as const };
    case "payment":
      return { category: "Payment", tone: "amber" as const };
    default:
      return { category: "Activity", tone: "neutral" as const };
  }
}
