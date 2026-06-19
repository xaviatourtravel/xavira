import type { OwnerDashboardMetrics } from "@/lib/dashboard/owner-dashboard-data";

import {
  OwnerCustomerConversationsSection,
  OwnerDashboardHeader,
  OwnerExecutiveSummarySection,
  OwnerFollowUpRiskSection,
  OwnerHeroRevenueSection,
  OwnerKpiStrip,
  OwnerRecentActivitySection,
  OwnerSalesPipelineSection,
  OwnerStrategicActionsSection,
} from "@/components/dashboard/owner-dashboard-sections";

type OwnerDashboardViewProps = {
  metrics: OwnerDashboardMetrics;
};

export function OwnerDashboardView({ metrics }: OwnerDashboardViewProps) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <OwnerDashboardHeader />

      <OwnerHeroRevenueSection metrics={metrics} />

      <OwnerExecutiveSummarySection metrics={metrics} />

      <OwnerKpiStrip metrics={metrics} />

      <OwnerSalesPipelineSection metrics={metrics} />

      <div className="grid gap-6 xl:grid-cols-2">
        <OwnerCustomerConversationsSection metrics={metrics} />
        <OwnerFollowUpRiskSection metrics={metrics} />
      </div>

      <OwnerRecentActivitySection metrics={metrics} />

      <OwnerStrategicActionsSection />
    </div>
  );
}
