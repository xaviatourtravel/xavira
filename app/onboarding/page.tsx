import { redirect } from "next/navigation";

import { FirstRunExperience } from "@/components/onboarding/first-run-experience";
import { FirstRunWizard } from "@/components/onboarding/first-run-wizard";
import {
  getOnboardingStateForCurrentUser,
  resolveOnboardingRedirect,
} from "@/lib/onboarding/get-onboarding-state";
import { requireProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/utils/supabase/admin";

export default async function OnboardingPage() {
  const { profile } = await requireProfile({ allowPending: true });
  const state = await getOnboardingStateForCurrentUser();

  if (state) {
    const destination = resolveOnboardingRedirect("/onboarding", state);
    if (destination && destination !== "/onboarding") {
      redirect(destination);
    }
  }

  const ownerName = profile.full_name?.trim() || "there";

  if (state?.shouldRunFirstSetup && profile.organization_id) {
    const admin = createAdminClient();
    const { data: organization } = await admin
      .from("organizations")
      .select("id, name")
      .eq("id", profile.organization_id)
      .maybeSingle();

    if (organization) {
      return (
        <FirstRunWizard
          defaultCompanyName={organization.name}
          defaultWorkspaceName={organization.name}
          ownerName={ownerName}
        />
      );
    }
  }

  return <FirstRunExperience ownerName={ownerName} />;
}
