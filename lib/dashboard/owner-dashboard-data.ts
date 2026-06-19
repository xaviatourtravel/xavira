import {
  getJakartaDateString,
  getJakartaDaysAgoDateString,
  getJakartaMonthKey,
  isOnOrAfterJakartaDate,
  isSameJakartaMonth,
  toJakartaDateString,
} from "@/lib/dashboard/jakarta-date";
import {
  buildSalesPerformanceRows,
  shouldShowSalesPerformanceEmptyState,
  type SalesPerformanceRow,
} from "@/lib/dashboard/sales-performance";
import { getLeadAgingCutoffIso } from "@/lib/leads/assignment";
import {
  getEffectiveLeadTemperature,
  type LeadTemperature,
} from "@/lib/leads/lead-temperature";
import {
  buildTopCampaigns,
  type TopCampaignRow,
} from "@/lib/campaigns/metrics";
import { loadCampaignMetricsForOrganization } from "@/lib/campaigns/queries";
import { loadFollowUpComplianceMetrics } from "@/lib/automation/compliance";
import {
  loadFollowUpQueue,
  summarizeFollowUpQueue,
} from "@/lib/automation/queue";
import type { FollowUpComplianceMetrics } from "@/lib/automation/compliance";
import { loadInboxDashboardMetrics, type InboxDashboardMetrics } from "@/lib/inbox/metrics";
import type { Tables } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

type Profile = Tables<"profiles">;

type LeadRow = {
  id: string;
  full_name: string | null;
  lead_date: string | null;
  created_at: string;
  status: string;
  updated_at: string;
  lead_temperature: string | null;
  assigned_to: string | null;
  package_interest: string | null;
  budget_idr: number | null;
};

type BookingRow = {
  id: string;
  package_name: string | null;
  payment_status: string;
  created_at: string;
};

type PaymentRow = {
  amount: number;
  created_at: string;
  payment_date: string | null;
  bookings: { package_name: string | null } | { package_name: string | null }[] | null;
};

type OmnichannelConversationRow = {
  id: string;
  customer_name: string | null;
  channel: string;
  status: string;
  created_at: string;
  last_message_at: string | null;
};

export type OwnerRecentActivityItem = {
  id: string;
  type: "lead" | "conversation" | "booking" | "payment";
  label: string;
  timestamp: string;
};

export type OwnerOmnichannelMetrics = {
  activeConversations: number;
  newConversations: number;
};

export type OwnerExecutiveKpis = {
  leadsToday: number;
  leadsThisMonth: number;
  bookingsThisMonth: number;
  revenueThisMonth: number;
};

export type OwnerPipelineFunnel = {
  new: number;
  contacted: number;
  qualified: number;
  negotiating: number;
  won: number;
};

export type OwnerTemperatureOverview = {
  hot: number;
  warm: number;
  cold: number;
  hotPercent: number;
  warmPercent: number;
  coldPercent: number;
};

export type OwnerNeedAttentionMetrics = {
  leadsWithoutFollowUp3Days: number;
  coldLeads: number;
  unassignedLeads: number;
  unpaidBookings: number;
};

export type OwnerRevenueOverview = {
  revenueThisMonth: number;
  revenueLast30Days: number;
  revenueByPackage: Array<{ packageName: string; amount: number }>;
};

export type OwnerTopPackageRow = {
  packageName: string;
  leadCount: number;
  bookingCount: number;
};

export type OwnerDashboardMetrics = {
  executiveKpis: OwnerExecutiveKpis;
  pipelineFunnel: OwnerPipelineFunnel;
  temperatureOverview: OwnerTemperatureOverview;
  salesPerformanceRows: SalesPerformanceRow[];
  showSalesPerformanceEmptyState: boolean;
  needAttention: OwnerNeedAttentionMetrics;
  revenueOverview: OwnerRevenueOverview;
  topPackages: OwnerTopPackageRow[];
  topCampaigns: TopCampaignRow[];
  inboxMetrics: InboxDashboardMetrics;
  omnichannel: OwnerOmnichannelMetrics;
  estimatedPipelineValue: number;
  revenuePreviousMonth: number;
  recentActivity: OwnerRecentActivityItem[];
  followUpHealth: {
    totalLeads: number;
    overdueLeads: number;
    hotLeadsOverdue: number;
    compliance: FollowUpComplianceMetrics;
  };
};

function getLeadAcquisitionDate(lead: Pick<LeadRow, "lead_date" | "created_at">) {
  if (lead.lead_date) {
    return lead.lead_date.slice(0, 10);
  }

  return toJakartaDateString(lead.created_at);
}

function getPaymentDateString(payment: Pick<PaymentRow, "payment_date" | "created_at">) {
  if (payment.payment_date) {
    return payment.payment_date.slice(0, 10);
  }

  return toJakartaDateString(payment.created_at);
}

function getBookingPackageName(
  booking: PaymentRow["bookings"] | BookingRow["package_name"],
) {
  if (typeof booking === "string" || booking == null) {
    return booking?.trim() || "Tanpa Paket";
  }

  if (Array.isArray(booking)) {
    return booking[0]?.package_name?.trim() || "Tanpa Paket";
  }

  return booking.package_name?.trim() || "Tanpa Paket";
}

function isPreviousJakartaMonth(
  dateString: string,
  referenceDateString: string,
) {
  const referenceKey = getJakartaMonthKey(referenceDateString);
  const [year, month] = referenceKey.split("-").map(Number);
  const previousMonth = month === 1 ? 12 : month - 1;
  const previousYear = month === 1 ? year - 1 : year;
  const previousKey = `${previousYear}-${String(previousMonth).padStart(2, "0")}`;

  return getJakartaMonthKey(dateString) === previousKey;
}

function buildEstimatedPipelineValue(leads: LeadRow[]) {
  return leads
    .filter((lead) => !["won", "lost"].includes(lead.status))
    .reduce((sum, lead) => sum + Number(lead.budget_idr ?? 0), 0);
}

function buildOmnichannelMetrics(
  conversations: OmnichannelConversationRow[],
): OwnerOmnichannelMetrics {
  const activeConversations = conversations.filter(
    (conversation) => conversation.status !== "lost",
  ).length;

  const newConversations = conversations.filter(
    (conversation) => conversation.status === "new",
  ).length;

  return {
    activeConversations,
    newConversations,
  };
}

function buildRecentActivity(
  leads: LeadRow[],
  bookings: BookingRow[],
  payments: PaymentRow[],
  conversations: OmnichannelConversationRow[],
): OwnerRecentActivityItem[] {
  const items: OwnerRecentActivityItem[] = [];

  for (const lead of leads) {
    items.push({
      id: `lead-${lead.id}`,
      type: "lead",
      label: `New lead: ${lead.full_name?.trim() || "Unnamed lead"}`,
      timestamp: lead.created_at,
    });
  }

  for (const booking of bookings) {
    items.push({
      id: `booking-${booking.id}`,
      type: "booking",
      label: `Booking created: ${booking.package_name?.trim() || "Package booking"}`,
      timestamp: booking.created_at,
    });
  }

  for (const [index, payment] of payments.entries()) {
    const packageName = getBookingPackageName(payment.bookings);
    items.push({
      id: `payment-${payment.created_at}-${index}`,
      type: "payment",
      label: `Payment recorded: ${packageName}`,
      timestamp: payment.payment_date ?? payment.created_at,
    });
  }

  for (const conversation of conversations) {
    const customerName = conversation.customer_name?.trim() || "Customer";
    const channelLabel =
      conversation.channel === "instagram"
        ? "Instagram"
        : conversation.channel === "facebook"
          ? "Facebook"
          : "WhatsApp";

    items.push({
      id: `conversation-${conversation.id}`,
      type: "conversation",
      label: `New ${channelLabel} conversation: ${customerName}`,
      timestamp: conversation.last_message_at ?? conversation.created_at,
    });
  }

  return items
    .sort(
      (left, right) =>
        new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
    )
    .slice(0, 8);
}

function buildPipelineFunnel(leads: LeadRow[]): OwnerPipelineFunnel {
  const funnel: OwnerPipelineFunnel = {
    new: 0,
    contacted: 0,
    qualified: 0,
    negotiating: 0,
    won: 0,
  };

  for (const lead of leads) {
    switch (lead.status) {
      case "new":
        funnel.new += 1;
        break;
      case "contacted":
        funnel.contacted += 1;
        break;
      case "qualified":
        funnel.qualified += 1;
        break;
      case "proposal_sent":
      case "negotiating":
        funnel.negotiating += 1;
        break;
      case "won":
        funnel.won += 1;
        break;
      default:
        break;
    }
  }

  return funnel;
}

function buildTemperatureOverview(leads: LeadRow[]): OwnerTemperatureOverview {
  const counts: Record<LeadTemperature, number> = {
    hot: 0,
    warm: 0,
    cold: 0,
  };

  for (const lead of leads) {
    const { value } = getEffectiveLeadTemperature(lead);
    counts[value] += 1;
  }

  const total = leads.length;
  const denominator = total > 0 ? total : 1;

  return {
    hot: counts.hot,
    warm: counts.warm,
    cold: counts.cold,
    hotPercent: Math.round((counts.hot / denominator) * 100),
    warmPercent: Math.round((counts.warm / denominator) * 100),
    coldPercent: Math.round((counts.cold / denominator) * 100),
  };
}

function buildTopPackages(
  leads: LeadRow[],
  bookings: BookingRow[],
): OwnerTopPackageRow[] {
  const packageMap = new Map<string, { leadCount: number; bookingCount: number }>();

  for (const lead of leads) {
    const packageName = lead.package_interest?.trim();
    if (!packageName) {
      continue;
    }

    const current = packageMap.get(packageName) ?? {
      leadCount: 0,
      bookingCount: 0,
    };
    current.leadCount += 1;
    packageMap.set(packageName, current);
  }

  for (const booking of bookings) {
    const packageName = booking.package_name?.trim() || "Tanpa Paket";
    const current = packageMap.get(packageName) ?? {
      leadCount: 0,
      bookingCount: 0,
    };
    current.bookingCount += 1;
    packageMap.set(packageName, current);
  }

  return [...packageMap.entries()]
    .map(([packageName, counts]) => ({
      packageName,
      leadCount: counts.leadCount,
      bookingCount: counts.bookingCount,
    }))
    .sort((a, b) => {
      const aTotal = a.leadCount + a.bookingCount;
      const bTotal = b.leadCount + b.bookingCount;
      return bTotal - aTotal || b.leadCount - a.leadCount;
    })
    .slice(0, 5);
}

export async function loadOwnerDashboardMetrics(
  profile: Profile,
): Promise<OwnerDashboardMetrics> {
  const supabase = await createClient();
  const organizationId = profile.organization_id;
  const todayJakarta = getJakartaDateString();
  const last30DaysJakarta = getJakartaDaysAgoDateString(30);
  const threeDaysAgoIso = getLeadAgingCutoffIso(3);

  const [
    { data: leads },
    { data: followUpTasks },
    { data: orgProfiles },
    { data: bookings },
    { data: payments },
    { count: unassignedLeads },
    { data: campaigns },
    metricsByCampaignId,
    inboxMetrics,
    compliance,
    queueItems,
    { count: totalActiveLeads },
    { data: omnichannelConversations },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select(
        "id, full_name, lead_date, created_at, status, updated_at, lead_temperature, assigned_to, package_interest, budget_idr",
      )
      .eq("organization_id", organizationId)
      .is("deleted_at", null),
    supabase
      .from("follow_up_tasks")
      .select("lead_id")
      .eq("organization_id", organizationId),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("organization_id", organizationId)
      .order("full_name"),
    supabase
      .from("bookings")
      .select("id, package_name, payment_status, created_at")
      .eq("organization_id", organizationId),
    supabase
      .from("booking_payments")
      .select("amount, created_at, payment_date, bookings!inner(package_name, organization_id)")
      .eq("bookings.organization_id", organizationId),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .is("assigned_to", null),
    supabase
      .from("campaigns")
      .select("id, name")
      .eq("organization_id", organizationId),
    loadCampaignMetricsForOrganization(supabase, organizationId),
    loadInboxDashboardMetrics(supabase, organizationId),
    loadFollowUpComplianceMetrics(supabase, organizationId),
    loadFollowUpQueue(supabase, organizationId),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .not("status", "in", "(won,lost)"),
    supabase
      .from("conversations")
      .select(
        "id, customer_name, channel, status, created_at, last_message_at",
      )
      .eq("organization_id", organizationId),
  ]);

  const leadRows = (leads ?? []) as LeadRow[];
  const bookingRows = (bookings ?? []) as BookingRow[];
  const paymentRows = (payments ?? []) as PaymentRow[];
  const followUpLeadIds = new Set(
    (followUpTasks ?? [])
      .map((task) => task.lead_id)
      .filter((leadId): leadId is string => Boolean(leadId)),
  );

  const omnichannelRows = (omnichannelConversations ??
    []) as OmnichannelConversationRow[];

  const leadsToday = leadRows.filter(
    (lead) => getLeadAcquisitionDate(lead) === todayJakarta,
  ).length;

  const leadsThisMonth = leadRows.filter((lead) =>
    isSameJakartaMonth(getLeadAcquisitionDate(lead), todayJakarta),
  ).length;

  const bookingsThisMonth = bookingRows.filter((booking) =>
    isSameJakartaMonth(toJakartaDateString(booking.created_at), todayJakarta),
  ).length;

  let revenueThisMonth = 0;
  let revenuePreviousMonth = 0;
  let revenueLast30Days = 0;
  const revenueByPackageMap = new Map<string, number>();

  for (const payment of paymentRows) {
    const amount = Number(payment.amount ?? 0);
    const paymentDate = getPaymentDateString(payment);
    const packageName = getBookingPackageName(payment.bookings);

    if (isSameJakartaMonth(paymentDate, todayJakarta)) {
      revenueThisMonth += amount;
    }

    if (isPreviousJakartaMonth(paymentDate, todayJakarta)) {
      revenuePreviousMonth += amount;
    }

    if (isOnOrAfterJakartaDate(paymentDate, last30DaysJakarta)) {
      revenueLast30Days += amount;
    }

    if (isSameJakartaMonth(paymentDate, todayJakarta)) {
      revenueByPackageMap.set(
        packageName,
        (revenueByPackageMap.get(packageName) ?? 0) + amount,
      );
    }
  }

  const leadsWithoutFollowUp3Days = leadRows.filter(
    (lead) =>
      !["won", "lost"].includes(lead.status) &&
      lead.updated_at < threeDaysAgoIso &&
      !followUpLeadIds.has(lead.id),
  ).length;

  const coldLeads = leadRows.filter(
    (lead) => getEffectiveLeadTemperature(lead).value === "cold",
  ).length;

  const unpaidBookings = bookingRows.filter(
    (booking) => booking.payment_status !== "paid",
  ).length;

  const salesPerformanceRows = buildSalesPerformanceRows(
    orgProfiles ?? [],
    leadRows,
    threeDaysAgoIso,
  );

  const queueSummary = summarizeFollowUpQueue(queueItems);

  return {
    executiveKpis: {
      leadsToday,
      leadsThisMonth,
      bookingsThisMonth,
      revenueThisMonth,
    },
    pipelineFunnel: buildPipelineFunnel(leadRows),
    temperatureOverview: buildTemperatureOverview(leadRows),
    salesPerformanceRows,
    showSalesPerformanceEmptyState: shouldShowSalesPerformanceEmptyState(
      orgProfiles ?? [],
      salesPerformanceRows,
    ),
    needAttention: {
      leadsWithoutFollowUp3Days,
      coldLeads,
      unassignedLeads: unassignedLeads ?? 0,
      unpaidBookings,
    },
    revenueOverview: {
      revenueThisMonth,
      revenueLast30Days,
      revenueByPackage: [...revenueByPackageMap.entries()]
        .map(([packageName, amount]) => ({ packageName, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5),
    },
    topPackages: buildTopPackages(leadRows, bookingRows),
    topCampaigns: buildTopCampaigns(campaigns ?? [], metricsByCampaignId),
    inboxMetrics,
    omnichannel: buildOmnichannelMetrics(omnichannelRows),
    estimatedPipelineValue: buildEstimatedPipelineValue(leadRows),
    revenuePreviousMonth,
    recentActivity: buildRecentActivity(
      leadRows,
      bookingRows,
      paymentRows,
      omnichannelRows,
    ),
    followUpHealth: {
      totalLeads: totalActiveLeads ?? 0,
      overdueLeads: queueSummary.overdueLeads,
      hotLeadsOverdue: queueSummary.hotOverdueLeads,
      compliance,
    },
  };
}
