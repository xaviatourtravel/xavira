import { isAdminOrOwner } from "@/lib/auth/permissions";
import type { Profile } from "@/types/app-types";

type LeadPermissionRecord = {
  organization_id: string;
  assigned_to: string | null;
};

export function canEditLead(
  profile: Profile,
  lead: LeadPermissionRecord,
): boolean {
  if (lead.organization_id !== profile.organization_id) {
    return false;
  }

  if (isAdminOrOwner(profile)) {
    return true;
  }

  return lead.assigned_to === profile.id || lead.assigned_to === null;
}
