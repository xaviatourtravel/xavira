import { OwnerDashboardView } from "@/components/dashboard/owner-dashboard-view";
import { loadOwnerDashboardMetrics } from "@/lib/dashboard/owner-dashboard-data";
import type { Tables } from "@/types/database";

type Profile = Tables<"profiles">;

export async function OwnerDashboard({ profile }: { profile: Profile }) {
  const metrics = await loadOwnerDashboardMetrics(profile);

  return <OwnerDashboardView metrics={metrics} />;
}
