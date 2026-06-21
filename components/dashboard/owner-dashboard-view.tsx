import type { OwnerDashboardMetrics } from "@/lib/dashboard/owner-dashboard-data";

import {
  OwnerDashboardHeader,
  OwnerExecutiveSummaryCard,
  OwnerHeroKpiRow,
  OwnerPerformanceSection,
  OwnerTodaysPriorities,
} from "@/components/dashboard/owner-dashboard-sections";

type OwnerDashboardViewProps = {
  metrics: OwnerDashboardMetrics;
};

export function OwnerDashboardView({ metrics }: OwnerDashboardViewProps) {
  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 overflow-x-hidden pb-8 md:space-y-8">
      <OwnerDashboardHeader />

      <OwnerHeroKpiRow metrics={metrics} />

      <OwnerTodaysPriorities metrics={metrics} />

      <OwnerExecutiveSummaryCard metrics={metrics} />

      <OwnerPerformanceSection metrics={metrics} />
    </div>
  );
}
