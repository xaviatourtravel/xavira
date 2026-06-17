import { LeadSourcePerformanceCard } from "@/components/dashboard/revenue/lead-source-performance-card";
import { PackagePerformanceCard } from "@/components/dashboard/revenue/package-performance-card";
import { RevenueFunnelCard } from "@/components/dashboard/revenue/revenue-funnel-card";
import { RevenueInsightsCard } from "@/components/dashboard/revenue/revenue-insights-card";
import { SalesPerformanceCard } from "@/components/dashboard/revenue/sales-performance-card";
import type { RevenueIntelligenceMetrics } from "@/lib/dashboard/revenue-intelligence";

type RevenueIntelligenceViewProps = {
  metrics: RevenueIntelligenceMetrics;
  canGenerateInsights: boolean;
};

export function RevenueIntelligenceView({
  metrics,
  canGenerateInsights,
}: RevenueIntelligenceViewProps) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Revenue Intelligence</h1>
        <p className="text-muted-foreground">
          Pahami apa yang mendorong booking dan revenue, lalu tentukan ke mana
          waktu dan budget sebaiknya diinvestasikan.
        </p>
      </div>

      <LeadSourcePerformanceCard
        sourceRows={metrics.leadSourcePerformance}
        campaignRows={metrics.campaignPerformance}
      />

      <PackagePerformanceCard rows={metrics.packagePerformance} />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <SalesPerformanceCard rows={metrics.salesPerformance} />
        <RevenueFunnelCard funnel={metrics.funnel} />
      </div>

      <RevenueInsightsCard
        canGenerate={canGenerateInsights}
        hasData={metrics.hasData}
      />
    </div>
  );
}
