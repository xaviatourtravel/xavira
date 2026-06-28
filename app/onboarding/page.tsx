import { redirect } from "next/navigation";

import { FirstRunWizard } from "@/components/onboarding/first-run-wizard";
import { shouldShowFirstRunWizard } from "@/lib/onboarding/status";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";

export default async function OnboardingPage() {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const { data: organization } = await supabase
    .from("organizations")
    .select("id, name, settings")
    .eq("id", profile.organization_id)
    .maybeSingle();

  if (!organization) {
    redirect("/login?error=profile_missing");
  }

  if (!shouldShowFirstRunWizard(profile, organization)) {
    redirect("/dashboard");
  }

  const ownerName = profile.full_name?.trim() || "there";

  return (
    <FirstRunWizard
      defaultCompanyName={organization.name}
      defaultWorkspaceName={organization.name}
      ownerName={ownerName}
    />
  );
}
