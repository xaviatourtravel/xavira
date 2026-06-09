import { AiSalesCopilotCard } from "@/components/dashboard/ai-sales-copilot-card";
import { FollowUpTodayCard } from "@/components/dashboard/follow-up-today-card";
import { LeadHealthOverviewCard } from "@/components/dashboard/lead-health-overview-card";
import { LeadSourcesCard } from "@/components/dashboard/lead-sources-card";
import { NeedAttentionCard } from "@/components/dashboard/need-attention-card";
import {
  PaketTerlarisCard,
  SumberLeadCard,
} from "@/components/dashboard/business-analytics-card";
import { PipelineSummaryCard } from "@/components/dashboard/pipeline-summary-card";
import { SalesPerformanceCard } from "@/components/dashboard/sales-performance-card";
import type { AdminDashboardMetrics } from "@/lib/dashboard/admin-dashboard-data";

type AdminDashboardViewProps = {
  metrics: AdminDashboardMetrics;
};

export function AdminDashboardView({ metrics }: AdminDashboardViewProps) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Ringkasan operasional tim dan performa sales organisasi.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">Total Leads</p>
          <h2 className="mt-2 text-3xl font-bold">{metrics.totalLeads}</h2>
        </div>
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">Lead → Won</p>
          <h2 className="mt-2 text-3xl font-bold">{metrics.leadToWonRate}%</h2>
        </div>
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">Proposal → Won</p>
          <h2 className="mt-2 text-3xl font-bold">{metrics.proposalToWonRate}%</h2>
        </div>
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">Follow Up Pending</p>
          <h2 className="mt-2 text-3xl font-bold">{metrics.pendingFollowUps}</h2>
        </div>
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">Follow Up Terlambat</p>
          <h2 className="mt-2 text-3xl font-bold text-red-600">
            {metrics.overdueFollowUps}
          </h2>
        </div>
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">Follow Up Hari Ini</p>
          <h2 className="mt-2 text-3xl font-bold text-blue-600">
            {metrics.followUpTodayCount}
          </h2>
        </div>
      </div>

      <NeedAttentionCard metrics={metrics.needAttention} />

      <LeadHealthOverviewCard counts={metrics.leadHealthOverviewCounts} />

      <LeadSourcesCard rows={metrics.leadSourceStats} />

      <SalesPerformanceCard
        rows={metrics.salesPerformanceRows}
        showEmptyState={metrics.showSalesPerformanceEmptyState}
      />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6">
          <FollowUpTodayCard todayFollowUps={metrics.todayFollowUps} />
          <PipelineSummaryCard funnel={metrics.funnel} />
          <PaketTerlarisCard topPackages={metrics.topPackages} />
        </div>

        <div className="space-y-6">
          <AiSalesCopilotCard leads={metrics.priorityLeads} />
          <SumberLeadCard topSources={metrics.topSources} />
        </div>
      </div>
    </div>
  );
}
