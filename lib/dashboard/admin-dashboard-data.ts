import type { FollowUpTodayTask } from "@/components/dashboard/follow-up-today-card";
import {
  buildSalesPerformanceRows,
  shouldShowSalesPerformanceEmptyState,
  type SalesPerformanceRow,
} from "@/lib/dashboard/sales-performance";
import { getLeadAgingCutoffIso } from "@/lib/leads/assignment";
import {
  buildFollowUpCountByLeadId,
  buildLeadHealthOverviewCounts,
  type LeadHealthOverviewCounts,
} from "@/lib/leads/health-score";
import {
  buildLeadSourceStats,
  type LeadSourceStatsRow,
} from "@/lib/leads/source-tracking";
import type { Tables } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

type Profile = Tables<"profiles">;

export type AdminDashboardPriorityLead = {
  id: string;
  full_name: string;
  status: string;
  package_interest: string | null;
  daysSinceUpdate: number;
  score: number;
};

export type AdminDashboardMetrics = {
  totalLeads: number;
  leadToWonRate: number;
  proposalToWonRate: number;
  pendingFollowUps: number;
  overdueFollowUps: number;
  followUpTodayCount: number;
  needAttention: {
    overdueFollowUps: number;
    leadsInactive3Days: number;
    leadsInactive7Days: number;
    unassignedLeads: number;
  };
  leadHealthOverviewCounts: LeadHealthOverviewCounts;
  leadSourceStats: LeadSourceStatsRow[];
  salesPerformanceRows: SalesPerformanceRow[];
  showSalesPerformanceEmptyState: boolean;
  funnel: {
    new: number;
    contacted: number;
    qualified: number;
    proposal_sent: number;
    negotiating: number;
    won: number;
    lost: number;
  };
  topPackages: [string, number][];
  topSources: [string, number][];
  todayFollowUps: FollowUpTodayTask[];
  priorityLeads: AdminDashboardPriorityLead[];
};

function buildPriorityLeads(
  leads: ReadonlyArray<{
    id: string;
    full_name: string;
    status: string;
    package_interest: string | null;
    updated_at: string;
  }>,
): AdminDashboardPriorityLead[] {
  return leads
    .map((lead) => {
      let score = 0;

      if (lead.status === "negotiating") score += 50;
      if (lead.status === "proposal_sent") score += 40;
      if (lead.status === "qualified") score += 30;
      if (lead.status === "contacted") score += 20;

      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(lead.updated_at).getTime()) / (1000 * 60 * 60 * 24),
      );

      score += Math.min(daysSinceUpdate * 2, 20);

      return {
        ...lead,
        score,
        daysSinceUpdate,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export async function loadAdminDashboardMetrics(
  profile: Profile,
): Promise<AdminDashboardMetrics> {
  const supabase = await createClient();
  const today = new Date();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const threeDaysAgoIso = getLeadAgingCutoffIso(3);
  const sevenDaysAgoIso = getLeadAgingCutoffIso(7);

  const orgLeadsBaseQuery = () =>
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null);

  const [
    { count: totalLeads },
    { count: pendingFollowUps },
    { count: overdueFollowUps },
    { data: todayFollowUps },
    { data: pipelineLeads },
    { data: packageLeads },
    { data: sourceLeads },
    { data: leadSourceAnalyticsLeads },
    { data: priorityLeads },
    { count: leadsInactive3Days },
    { count: leadsInactive7Days },
    { count: unassignedLeads },
    { data: orgProfiles },
    { data: assignedLeadsForPerformance },
    { data: activeLeadsForHealth },
    { data: orgFollowUpTasksForHealth },
  ] = await Promise.all([
    orgLeadsBaseQuery(),
    supabase
      .from("follow_up_tasks")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .eq("status", "pending"),
    supabase
      .from("follow_up_tasks")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .eq("status", "pending")
      .lt("due_date", today.toISOString()),
    supabase
      .from("follow_up_tasks")
      .select(`
        id,
        title,
        due_date,
        lead_id,
        leads (
          full_name,
          package_interest,
          whatsapp_number,
          phone
        )
      `)
      .eq("organization_id", profile.organization_id)
      .eq("status", "pending")
      .gte("due_date", todayStart.toISOString())
      .lte("due_date", todayEnd.toISOString())
      .order("due_date", { ascending: true }),
    supabase
      .from("leads")
      .select("status")
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null),
    supabase
      .from("leads")
      .select("package_interest")
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null),
    supabase
      .from("leads")
      .select("source")
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null),
    supabase
      .from("leads")
      .select("source, status")
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null),
    supabase
      .from("leads")
      .select(`
        id,
        full_name,
        status,
        package_interest,
        updated_at
      `)
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null),
    orgLeadsBaseQuery()
      .not("status", "in", "(won,lost)")
      .lt("updated_at", threeDaysAgoIso),
    orgLeadsBaseQuery()
      .not("status", "in", "(won,lost)")
      .lt("updated_at", sevenDaysAgoIso),
    orgLeadsBaseQuery().is("assigned_to", null),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("organization_id", profile.organization_id)
      .order("full_name"),
    supabase
      .from("leads")
      .select("assigned_to, status, updated_at")
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null)
      .not("assigned_to", "is", null),
    supabase
      .from("leads")
      .select("id, assigned_to, updated_at, status")
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null)
      .not("status", "in", "(won,lost)"),
    supabase
      .from("follow_up_tasks")
      .select("lead_id")
      .eq("organization_id", profile.organization_id),
  ]);

  const funnel = {
    new: 0,
    contacted: 0,
    qualified: 0,
    proposal_sent: 0,
    negotiating: 0,
    won: 0,
    lost: 0,
  };

  for (const lead of pipelineLeads ?? []) {
    const status = lead.status as keyof typeof funnel;

    if (status in funnel) {
      funnel[status]++;
    }
  }

  const packageStats: Record<string, number> = {};
  for (const lead of packageLeads ?? []) {
    if (!lead.package_interest) continue;
    packageStats[lead.package_interest] =
      (packageStats[lead.package_interest] ?? 0) + 1;
  }

  const sourceStats: Record<string, number> = {};
  for (const lead of sourceLeads ?? []) {
    if (!lead.source) continue;
    sourceStats[lead.source] = (sourceStats[lead.source] ?? 0) + 1;
  }

  const leadToWonRate =
    totalLeads && totalLeads > 0
      ? Math.round((funnel.won / totalLeads) * 100)
      : 0;

  const proposalTotal =
    funnel.proposal_sent + funnel.negotiating + funnel.won + funnel.lost;

  const proposalToWonRate =
    proposalTotal > 0 ? Math.round((funnel.won / proposalTotal) * 100) : 0;

  const salesPerformanceRows = buildSalesPerformanceRows(
    orgProfiles ?? [],
    assignedLeadsForPerformance ?? [],
    threeDaysAgoIso,
  );

  return {
    totalLeads: totalLeads ?? 0,
    leadToWonRate,
    proposalToWonRate,
    pendingFollowUps: pendingFollowUps ?? 0,
    overdueFollowUps: overdueFollowUps ?? 0,
    followUpTodayCount: todayFollowUps?.length ?? 0,
    needAttention: {
      overdueFollowUps: overdueFollowUps ?? 0,
      leadsInactive3Days: leadsInactive3Days ?? 0,
      leadsInactive7Days: leadsInactive7Days ?? 0,
      unassignedLeads: unassignedLeads ?? 0,
    },
    leadHealthOverviewCounts: buildLeadHealthOverviewCounts(
      activeLeadsForHealth ?? [],
      buildFollowUpCountByLeadId(orgFollowUpTasksForHealth ?? []),
    ),
    leadSourceStats: buildLeadSourceStats(leadSourceAnalyticsLeads ?? []),
    salesPerformanceRows,
    showSalesPerformanceEmptyState: shouldShowSalesPerformanceEmptyState(
      orgProfiles ?? [],
      salesPerformanceRows,
    ),
    funnel,
    topPackages: Object.entries(packageStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5),
    topSources: Object.entries(sourceStats).sort((a, b) => b[1] - a[1]),
    todayFollowUps: (todayFollowUps ?? []) as FollowUpTodayTask[],
    priorityLeads: buildPriorityLeads(priorityLeads ?? []),
  };
}
