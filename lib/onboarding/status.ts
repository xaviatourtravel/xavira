import {
  parseFirstRunSettings,
  parseOrganizationProductSettings,
} from "@/lib/onboarding/settings";
import type { Tables } from "@/types/database";

type Profile = Pick<Tables<"profiles">, "role">;
type Organization = Pick<Tables<"organizations">, "settings">;

export function shouldShowFirstRunWizard(
  profile: Profile,
  organization: Organization,
): boolean {
  if (profile.role !== "owner") {
    return false;
  }

  const firstRun = parseFirstRunSettings(
    (organization.settings as Record<string, unknown> | null)?.firstRun,
  );

  if (!firstRun) {
    return false;
  }

  if (firstRun.completedAt) {
    return false;
  }

  return firstRun.pending;
}

export function getOrganizationProductFromSettings(
  organization: Organization,
) {
  const settings = organization.settings as Record<string, unknown> | null;
  return parseOrganizationProductSettings(settings?.product);
}
