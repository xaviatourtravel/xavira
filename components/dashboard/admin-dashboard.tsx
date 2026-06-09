import { AdminDashboardView } from "@/components/dashboard/admin-dashboard-view";
import { loadAdminDashboardMetrics } from "@/lib/dashboard/admin-dashboard-data";
import type { Tables } from "@/types/database";

type Profile = Tables<"profiles">;

export async function AdminDashboard({ profile }: { profile: Profile }) {
  const metrics = await loadAdminDashboardMetrics(profile);

  return <AdminDashboardView metrics={metrics} />;
}
