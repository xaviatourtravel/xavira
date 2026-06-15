import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { OwnerDashboard } from "@/components/dashboard/owner-dashboard";
import { SalesDashboard } from "@/components/dashboard/sales-dashboard";
import { resolveDashboardVariant } from "@/lib/dashboard/role-visibility";
import { requireProfile } from "@/lib/auth/session";

export default async function DashboardPage() {
  const { profile } = await requireProfile();
  const dashboardVariant = resolveDashboardVariant(profile.role);

  if (dashboardVariant === "agent") {
    return <SalesDashboard profile={profile} />;
  }

  if (dashboardVariant === "admin") {
    return <AdminDashboard profile={profile} />;
  }

  return <OwnerDashboard profile={profile} />;
}
