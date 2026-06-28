import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { OwnerDashboard } from "@/components/dashboard/owner-dashboard";
import { SalesDashboard } from "@/components/dashboard/sales-dashboard";
import { SetupGuideCards } from "@/components/dashboard/setup-guide-cards";
import { resolveDashboardVariant } from "@/lib/dashboard/role-visibility";
import { loadSetupGuideCards } from "@/lib/onboarding/setup-guide";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardPage() {
  const { profile } = await requireProfile();
  const dashboardVariant = resolveDashboardVariant(profile.role);
  const supabase = await createClient();

  const { data: organization } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", profile.organization_id)
    .maybeSingle();

  const setupCards = organization
    ? await loadSetupGuideCards(supabase, profile, organization)
    : [];

  const dashboard = (() => {
    if (dashboardVariant === "owner") {
      return <OwnerDashboard profile={profile} />;
    }

    if (dashboardVariant === "admin") {
      return <AdminDashboard profile={profile} />;
    }

    return <SalesDashboard profile={profile} />;
  })();

  return (
    <div className="space-y-6">
      <SetupGuideCards cards={setupCards} />
      {dashboard}
    </div>
  );
}
