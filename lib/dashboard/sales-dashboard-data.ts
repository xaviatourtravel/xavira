import type { Profile } from "@/types/app-types";
import type { FollowUpTodayTask } from "@/components/dashboard/follow-up-today-card";
import { buildCriticalLeadListItems } from "@/lib/leads/critical-leads";
import { getLeadAgingCutoffIso, type MyLeadsMetrics } from "@/lib/leads/assignment";
import { getFollowUpTodayBounds } from "@/lib/follow-ups/list-filters";
import { createClient } from "@/utils/supabase/server";

export type SalesDashboardPriorityLead = {
  id: string;
  full_name: string;
  status: string;
  package_interest: string | null;
  daysSinceUpdate: number;
  score: number;
};

export type SalesDashboardMetrics = {
  totalAssignedLeads: number;
  followUpTodayCount: number;
  followUpOverdueCount: number;
  criticalLeadsCount: number;
  priorityLeads: SalesDashboardPriorityLead[];
  myLeadsMetrics: MyLeadsMetrics;
  todayFollowUps: FollowUpTodayTask[];
};

function buildPriorityLeads(
  leads: ReadonlyArray<{
    id: string;
    full_name: string;
    status: string;
    package_interest: string | null;
    updated_at: string;
  }>,
): SalesDashboardPriorityLead[] {
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

export async function loadSalesDashboardMetrics(
  profile: Profile,
): Promise<SalesDashboardMetrics> {
  const supabase = await createClient();
  const { todayStart, todayEnd } = getFollowUpTodayBounds();
  const todayIso = new Date().toISOString();
  const threeDaysAgoIso = getLeadAgingCutoffIso(3);
  const sevenDaysAgoIso = getLeadAgingCutoffIso(7);

  const myLeadsBaseQuery = () =>
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .eq("assigned_to", profile.id)
      .is("deleted_at", null);

  const [
    { count: totalAssignedLeads },
    { data: myActiveLeads },
    { data: myPriorityLeads },
    { data: followUpTasks },
    { count: myLeadsNeedFollowUp },
    { count: myLeadsCritical },
    { count: myLeadsWon },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .eq("assigned_to", profile.id)
      .is("deleted_at", null),
    supabase
      .from("leads")
      .select(
        `
        id,
        full_name,
        status,
        assigned_to,
        updated_at,
        whatsapp_number,
        phone,
        profiles!leads_assigned_to_fkey (
          full_name
        )
      `,
      )
      .eq("organization_id", profile.organization_id)
      .eq("assigned_to", profile.id)
      .is("deleted_at", null)
      .not("status", "in", "(won,lost)"),
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
      .eq("assigned_to", profile.id)
      .is("deleted_at", null),
    supabase
      .from("follow_up_tasks")
      .select("lead_id")
      .eq("organization_id", profile.organization_id),
    myLeadsBaseQuery()
      .not("status", "in", "(won,lost)")
      .lt("updated_at", threeDaysAgoIso),
    myLeadsBaseQuery()
      .not("status", "in", "(won,lost)")
      .lt("updated_at", sevenDaysAgoIso),
    myLeadsBaseQuery().eq("status", "won"),
  ]);

  const myLeadIds = (myActiveLeads ?? [])
    .map((lead) => lead.id)
    .filter((leadId): leadId is string => Boolean(leadId));

  let followUpTodayCount = 0;
  let followUpOverdueCount = 0;
  let todayFollowUps: FollowUpTodayTask[] = [];

  if (myLeadIds.length > 0) {
    const [
      { count: todayCount },
      { count: overdueCount },
      { data: myTodayFollowUps },
    ] = await Promise.all([
      supabase
        .from("follow_up_tasks")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", profile.organization_id)
        .eq("status", "pending")
        .in("lead_id", myLeadIds)
        .gte("due_date", todayStart.toISOString())
        .lte("due_date", todayEnd.toISOString()),
      supabase
        .from("follow_up_tasks")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", profile.organization_id)
        .eq("status", "pending")
        .in("lead_id", myLeadIds)
        .lt("due_date", todayIso),
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
        .in("lead_id", myLeadIds)
        .gte("due_date", todayStart.toISOString())
        .lte("due_date", todayEnd.toISOString())
        .order("due_date", { ascending: true }),
    ]);

    followUpTodayCount = todayCount ?? 0;
    followUpOverdueCount = overdueCount ?? 0;
    todayFollowUps = (myTodayFollowUps ?? []).map((task) => ({
      ...task,
      leads: Array.isArray(task.leads) ? (task.leads[0] ?? null) : task.leads,
    }));
  }

  const criticalLeadsCount = buildCriticalLeadListItems(
    myActiveLeads ?? [],
    followUpTasks ?? [],
  ).length;

  return {
    totalAssignedLeads: totalAssignedLeads ?? 0,
    followUpTodayCount,
    followUpOverdueCount,
    criticalLeadsCount,
    priorityLeads: buildPriorityLeads(myPriorityLeads ?? []),
    myLeadsMetrics: {
      totalAssigned: totalAssignedLeads ?? 0,
      needFollowUp: myLeadsNeedFollowUp ?? 0,
      criticalLeads: myLeadsCritical ?? 0,
      wonLeads: myLeadsWon ?? 0,
    },
    todayFollowUps,
  };
}
