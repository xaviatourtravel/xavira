import { SalesDashboardView } from "@/components/dashboard/sales-dashboard-view";
import { loadSalesDashboardMetrics } from "@/lib/dashboard/sales-dashboard-data";
import type { Profile } from "@/types/database";

export async function SalesDashboard({ profile }: { profile: Profile }) {
  const metrics = await loadSalesDashboardMetrics(profile);

  return <SalesDashboardView metrics={metrics} />;
}
