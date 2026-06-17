import { LeadTemperatureOverviewCard } from "@/components/dashboard/lead-temperature-overview-card";
import { OwnerCampaignPerformanceCard } from "@/components/dashboard/owner-campaign-performance-card";
import { OwnerExecutiveKpiSection } from "@/components/dashboard/owner-executive-kpi-section";
import { OwnerNeedAttentionCard } from "@/components/dashboard/owner-need-attention-card";
import { OwnerPipelineFunnelCard } from "@/components/dashboard/owner-pipeline-funnel-card";
import { OwnerRevenueOverviewCard } from "@/components/dashboard/owner-revenue-overview-card";
import { OwnerSalesPerformanceCard } from "@/components/dashboard/owner-sales-performance-card";
import { OwnerTopPackagesCard } from "@/components/dashboard/owner-top-packages-card";
import { OwnerFollowUpHealthCard } from "@/components/dashboard/owner-follow-up-health-card";
import { InboxOverviewCard } from "@/components/inbox/inbox-overview-card";
import type { OwnerDashboardMetrics } from "@/lib/dashboard/owner-dashboard-data";

type OwnerDashboardViewProps = {
  metrics: OwnerDashboardMetrics;
};

export function OwnerDashboardView({ metrics }: OwnerDashboardViewProps) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Owner Dashboard</h1>
        <p className="text-muted-foreground">
          Executive control room untuk memantau pipeline, performa sales, dan
          pendapatan organisasi.
        </p>
      </div>

      <OwnerExecutiveKpiSection {...metrics.executiveKpis} />

      <OwnerPipelineFunnelCard funnel={metrics.pipelineFunnel} />

      <InboxOverviewCard metrics={metrics.inboxMetrics} />

      <OwnerFollowUpHealthCard
        totalLeads={metrics.followUpHealth.totalLeads}
        overdueLeads={metrics.followUpHealth.overdueLeads}
        hotLeadsOverdue={metrics.followUpHealth.hotLeadsOverdue}
        compliance={metrics.followUpHealth.compliance}
      />

      <LeadTemperatureOverviewCard overview={metrics.temperatureOverview} />

      <OwnerSalesPerformanceCard
        rows={metrics.salesPerformanceRows}
        showEmptyState={metrics.showSalesPerformanceEmptyState}
      />

      <OwnerNeedAttentionCard metrics={metrics.needAttention} />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <OwnerRevenueOverviewCard overview={metrics.revenueOverview} />
        <OwnerTopPackagesCard rows={metrics.topPackages} />
      </div>

      <OwnerCampaignPerformanceCard rows={metrics.topCampaigns} />
    </div>
  );
}
