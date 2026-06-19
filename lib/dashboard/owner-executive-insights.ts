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

export function buildRevenueTrendLabel(
  revenueThisMonth: number,
  revenuePreviousMonth: number,
) {
  if (revenuePreviousMonth === 0 && revenueThisMonth === 0) {
    return "Trend data will appear after more activity.";
  }

  if (revenuePreviousMonth === 0) {
    return "Revenue started this period — no comparison from the previous month yet.";
  }

  const changePercent = Math.round(
    ((revenueThisMonth - revenuePreviousMonth) / revenuePreviousMonth) * 100,
  );

  if (changePercent > 0) {
    return `Up ${changePercent}% compared with previous period.`;
  }

  if (changePercent < 0) {
    return `Down ${Math.abs(changePercent)}% compared with previous period.`;
  }

  return "Flat compared with previous period.";
}

export function buildPipelineTakeaway(funnel: OwnerPipelineFunnel) {
  const stages = (
    Object.entries(funnel) as Array<[keyof OwnerPipelineFunnel, number]>
  ).filter(([key]) => key !== "won");

  const total = stages.reduce((sum, [, count]) => sum + count, 0);

  if (total === 0) {
    return "No active pipeline stages yet. Leads will appear here as your team works them.";
  }

  const [topStage] = [...stages].sort((a, b) => b[1] - a[1]);
  const [stageKey, stageCount] = topStage;

  if (stageCount === 0) {
    return "Pipeline activity is light. Focus on moving new leads into contact.";
  }

  return `Most leads are currently in the ${PIPELINE_STAGE_LABELS[stageKey]} stage.`;
}

export function buildExecutiveInsights(metrics: OwnerDashboardMetrics) {
  const insights: string[] = [];

  if (metrics.followUpHealth.overdueLeads > 0) {
    insights.push(
      `${metrics.followUpHealth.overdueLeads} lead${metrics.followUpHealth.overdueLeads === 1 ? "" : "s"} ${metrics.followUpHealth.overdueLeads === 1 ? "is" : "are"} overdue for follow-up.`,
    );
  }

  if (metrics.executiveKpis.bookingsThisMonth > 0) {
    insights.push(
      `${metrics.executiveKpis.bookingsThisMonth} booking${metrics.executiveKpis.bookingsThisMonth === 1 ? "" : "s"} recorded this month.`,
    );
  } else {
    insights.push("No bookings recorded this month yet.");
  }

  if (metrics.followUpHealth.totalLeads > 0) {
    insights.push(
      `${metrics.followUpHealth.totalLeads} lead${metrics.followUpHealth.totalLeads === 1 ? "" : "s"} ${metrics.followUpHealth.totalLeads === 1 ? "is" : "are"} active in the pipeline.`,
    );
  }

  if (metrics.omnichannel.activeConversations > 0) {
    insights.push(
      `Instagram/Facebook inbox has ${metrics.omnichannel.activeConversations} active conversation${metrics.omnichannel.activeConversations === 1 ? "" : "s"}.`,
    );
  }

  if (metrics.executiveKpis.revenueThisMonth > 0) {
    insights.push(
      `${formatDashboardCurrency(metrics.executiveKpis.revenueThisMonth)} in revenue collected this month.`,
    );
  }

  if (insights.length === 0) {
    insights.push(
      "Your executive overview will populate as your team uses Desklabs.",
    );
  }

  return insights.slice(0, 4);
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

export function getRecentActivityIcon(type: OwnerRecentActivityItem["type"]) {
  switch (type) {
    case "lead":
      return "Lead";
    case "conversation":
      return "Inbox";
    case "booking":
      return "Booking";
    case "payment":
      return "Payment";
    default:
      return "Activity";
  }
}
