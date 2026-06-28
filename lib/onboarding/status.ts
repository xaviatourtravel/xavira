import { isOrganizationOnboardingCompleted } from "@/lib/onboarding/get-onboarding-state";
import { parseOrganizationProductSettings } from "@/lib/onboarding/settings";
import type { Tables } from "@/types/database";

type Profile = Pick<Tables<"profiles">, "role">;
type OrganizationSettings = Pick<Tables<"organizations">, "settings">;
type OrganizationOnboarding = Pick<
  Tables<"organizations">,
  "settings" | "onboarding_completed"
> & { id?: string };

export function shouldShowFirstRunWizard(
  profile: Profile,
  organization: OrganizationOnboarding,
): boolean {
  if (profile.role !== "owner") {
    return false;
  }

  return !isOrganizationOnboardingCompleted({
    id: organization.id ?? "",
    onboarding_completed: organization.onboarding_completed,
    industry: null,
    settings: organization.settings,
  });
}

export function getOrganizationProductFromSettings(
  organization: OrganizationSettings,
) {
  const settings = organization.settings as Record<string, unknown> | null;
  return parseOrganizationProductSettings(settings?.product);
}
