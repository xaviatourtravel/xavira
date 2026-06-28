import { redirect } from "next/navigation";

import { completeOnboardingIfNeeded } from "@/actions/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { enforceOnboardingForPath } from "@/lib/onboarding/enforce-onboarding";
import { loadNavAttentionBadges } from "@/lib/navigation/load-attention-badges";
import { buildWorkspaceSwitcherContext } from "@/lib/workspace/load-workspace-switcher";
import { requireOrganizationProfile } from "@/lib/auth/session";
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

  await enforceOnboardingForPath("/today");

  const { user, profile } = await requireOrganizationProfile();

  const supabase = await createClient();
  const { data: organization } = await supabase
    .from("organizations")
    .select("id, name, slug, timezone, settings")
    .eq("id", profile.organization_id)
    .maybeSingle();

  if (!organization) {
    redirect("/onboarding");
  }

  const attentionBadges = await loadNavAttentionBadges(supabase, profile);
  const workspaceContext = buildWorkspaceSwitcherContext(organization);

  return (
    <DashboardShell
      profile={profile}
      email={user.email}
      attentionBadges={attentionBadges}
      workspaceContext={workspaceContext}
    >
      {children}
    </DashboardShell>
  );
}
