import { redirect } from "next/navigation";

import { completeOnboardingIfNeeded } from "@/actions/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { shouldShowFirstRunWizard } from "@/lib/onboarding/status";
import { loadNavAttentionBadges } from "@/lib/navigation/load-attention-badges";
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

  const attentionBadges = await loadNavAttentionBadges(supabase, profile);
  const workspaceName =
    typeof organization?.settings === "object" &&
    organization.settings !== null &&
    "firstRun" in organization.settings &&
    typeof (organization.settings as { firstRun?: { workspaceName?: string } })
      .firstRun?.workspaceName === "string"
      ? (organization.settings as { firstRun: { workspaceName: string } }).firstRun
          .workspaceName
      : undefined;

  return (
    <DashboardShell
      profile={profile}
      attentionBadges={attentionBadges}
      workspaceName={workspaceName}
    >
      {children}
    </DashboardShell>
  );
}