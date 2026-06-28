import { redirect } from "next/navigation";

import { completeOnboardingIfNeeded } from "@/actions/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { shouldShowFirstRunWizard } from "@/lib/onboarding/status";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const onboardingError = await completeOnboardingIfNeeded();

  if (onboardingError) {
    redirect(`/login?error=${encodeURIComponent(onboardingError)}`);
  }

  const { profile } = await requireProfile();

  const supabase = await createClient();
  const { data: organization } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", profile.organization_id)
    .maybeSingle();

  if (organization && shouldShowFirstRunWizard(profile, organization)) {
    redirect("/onboarding");
  }

  return (
    <DashboardShell profile={profile}>
      {children}
    </DashboardShell>
  );
}