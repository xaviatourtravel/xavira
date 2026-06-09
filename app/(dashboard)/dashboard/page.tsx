import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";
import { AiUsageCard } from "@/components/dashboard/ai-usage-card";
import { BookingOverviewSection } from "@/components/dashboard/booking-overview-section";
import { ContentMediaOverviewCard } from "@/components/dashboard/content-media-overview-card";
import { NeedAttentionCard } from "@/components/dashboard/need-attention-card";
import { LeadHealthOverviewCard } from "@/components/dashboard/lead-health-overview-card";
import { LeadSourcesCard } from "@/components/dashboard/lead-sources-card";
import { RevenueBySourceCard } from "@/components/dashboard/revenue-by-source-card";
import { SalesPerformanceCard } from "@/components/dashboard/sales-performance-card";
import { PipelineSummaryCard } from "@/components/dashboard/pipeline-summary-card";
import {
  PaketTerlarisCard,
  SumberLeadCard,
} from "@/components/dashboard/business-analytics-card";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { SalesDashboard } from "@/components/dashboard/sales-dashboard";
import { loadBookingOverviewMetrics } from "@/lib/dashboard/booking-overview";
import { loadContentOverviewMetrics } from "@/lib/dashboard/content-overview";
import {
  buildSalesPerformanceRows,
  shouldShowSalesPerformanceEmptyState,
} from "@/lib/dashboard/sales-performance";
import { getLeadAgingCutoffIso } from "@/lib/leads/assignment";
import {
  buildFollowUpCountByLeadId,
  buildLeadHealthOverviewCounts,
} from "@/lib/leads/health-score";
import { buildLeadSourceStats } from "@/lib/leads/source-tracking";
import { buildLeadSourceRevenueStats } from "@/lib/leads/source-revenue";
import { resolveDashboardVariant } from "@/lib/dashboard/role-visibility";

export default async function DashboardPage() {
  const { profile } = await requireProfile();
  const dashboardVariant = resolveDashboardVariant(profile.role);

  if (dashboardVariant === "agent") {
    return <SalesDashboard profile={profile} />;
  }

  if (dashboardVariant === "admin") {
    return <AdminDashboard profile={profile} />;
  }

  const supabase = await createClient();

  const today = new Date();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const threeDaysAgoIso = getLeadAgingCutoffIso(3);

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
    { data: aiLogs },
    { data: sourceRevenuePayments },
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
      .select("id")
      .eq("organization_id", profile.organization_id)
      .eq("status", "pending")
      .gte("due_date", todayStart.toISOString())
      .lte("due_date", todayEnd.toISOString()),
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
      .from("ai_generation_logs")
      .select("input_tokens, output_tokens, estimated_cost_usd")
      .eq("organization_id", profile.organization_id),
    supabase
      .from("booking_payments")
      .select(`
        amount,
        bookings!inner (
          organization_id,
          lead_id,
          leads (
            source
          )
        )
      `)
      .eq("bookings.organization_id", profile.organization_id),
    orgLeadsBaseQuery()
      .not("status", "in", "(won,lost)")
      .lt("updated_at", threeDaysAgoIso),
    orgLeadsBaseQuery()
      .not("status", "in", "(won,lost)")
      .lt("updated_at", getLeadAgingCutoffIso(7)),
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
  const packageStats: Record<string, number> = {};

  for (const lead of packageLeads ?? []) {
    if (!lead.package_interest) continue;

    packageStats[lead.package_interest] =
      (packageStats[lead.package_interest] ?? 0) + 1;
  }

  const topPackages = Object.entries(packageStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const sourceStats: Record<string, number> = {};

  for (const lead of sourceLeads ?? []) {
    if (!lead.source) continue;

    sourceStats[lead.source] = (sourceStats[lead.source] ?? 0) + 1;
  }

  const topSources = Object.entries(sourceStats).sort((a, b) => b[1] - a[1]);

  for (const lead of pipelineLeads ?? []) {
    const status = lead.status as keyof typeof funnel;

    if (status in funnel) {
      funnel[status]++;
    }
  }

  const leadToWonRate =
    totalLeads && totalLeads > 0
      ? Math.round((funnel.won / totalLeads) * 100)
      : 0;

  const proposalTotal =
    funnel.proposal_sent + funnel.negotiating + funnel.won + funnel.lost;

  const proposalToWonRate =
    proposalTotal > 0 ? Math.round((funnel.won / proposalTotal) * 100) : 0;

  const aiUsage = {
    totalGenerations: aiLogs?.length ?? 0,
    inputTokens: 0,
    outputTokens: 0,
    estimatedCostUsd: 0,
  };

  for (const log of aiLogs ?? []) {
    aiUsage.inputTokens += log.input_tokens ?? 0;
    aiUsage.outputTokens += log.output_tokens ?? 0;
    aiUsage.estimatedCostUsd += Number(log.estimated_cost_usd ?? 0);
  }

  const totalAiTokens = aiUsage.inputTokens + aiUsage.outputTokens;

  const salesPerformanceRows = buildSalesPerformanceRows(
    orgProfiles ?? [],
    assignedLeadsForPerformance ?? [],
    threeDaysAgoIso,
  );
  const showSalesPerformanceEmptyState = shouldShowSalesPerformanceEmptyState(
    orgProfiles ?? [],
    salesPerformanceRows,
  );
  const leadHealthOverviewCounts = buildLeadHealthOverviewCounts(
    activeLeadsForHealth ?? [],
    buildFollowUpCountByLeadId(orgFollowUpTasksForHealth ?? []),
  );
  const leadSourceStats = buildLeadSourceStats(leadSourceAnalyticsLeads ?? []);
  const leadSourceRevenueStats = buildLeadSourceRevenueStats(
    leadSourceAnalyticsLeads ?? [],
    sourceRevenuePayments ?? [],
  );

  const [bookingOverview, contentOverview] = await Promise.all([
    loadBookingOverviewMetrics(profile.organization_id),
    loadContentOverviewMetrics(profile.organization_id),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Ringkasan aktivitas CRM Xavira.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">Total Leads</p>
          <h2 className="mt-2 text-3xl font-bold">{totalLeads ?? 0}</h2>
        </div>
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">Lead → Won</p>
          <h2 className="mt-2 text-3xl font-bold">{leadToWonRate}%</h2>
        </div>
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">Proposal → Won</p>
          <h2 className="mt-2 text-3xl font-bold">{proposalToWonRate}%</h2>
        </div>
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">Follow Up Pending</p>
          <h2 className="mt-2 text-3xl font-bold">{pendingFollowUps ?? 0}</h2>
        </div>
        <div id="follow-up-overdue" className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">Follow Up Terlambat</p>
          <h2 className="mt-2 text-3xl font-bold text-red-600">
            {overdueFollowUps ?? 0}
          </h2>
        </div>
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">Follow Up Hari Ini</p>
          <h2 className="mt-2 text-3xl font-bold text-blue-600">
            {todayFollowUps?.length ?? 0}
          </h2>
        </div>
      </div>

      <NeedAttentionCard
        metrics={{
          overdueFollowUps: overdueFollowUps ?? 0,
          leadsInactive3Days: leadsInactive3Days ?? 0,
          leadsInactive7Days: leadsInactive7Days ?? 0,
          unassignedLeads: unassignedLeads ?? 0,
        }}
      />

      <LeadHealthOverviewCard counts={leadHealthOverviewCounts} />

      <SalesPerformanceCard
        rows={salesPerformanceRows}
        showEmptyState={showSalesPerformanceEmptyState}
      />

      <BookingOverviewSection metrics={bookingOverview} />

      <PipelineSummaryCard funnel={funnel} />

      <LeadSourcesCard rows={leadSourceStats} />

      <RevenueBySourceCard rows={leadSourceRevenueStats} />

      <ContentMediaOverviewCard metrics={contentOverview} />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <PaketTerlarisCard topPackages={topPackages} />

        <div className="space-y-6">
          <AiUsageCard
            totalGenerations={aiUsage.totalGenerations}
            inputTokens={aiUsage.inputTokens}
            outputTokens={aiUsage.outputTokens}
            estimatedCostUsd={aiUsage.estimatedCostUsd}
            totalAiTokens={totalAiTokens}
          />
          <SumberLeadCard topSources={topSources} />
        </div>
      </div>
    </div>
  );
}
