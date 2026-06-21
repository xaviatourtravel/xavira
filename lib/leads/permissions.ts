import { hasPermission } from "@/lib/auth/permissions";
import type { Profile } from "@/types/app-types";

type LeadPermissionRecord = {
  organization_id: string;
  assigned_to: string | null;
};

export function canViewLead(profile: Profile) {
  return hasPermission(profile, "leads.view");
}

export function canCreateLead(profile: Profile) {
  return hasPermission(profile, "leads.create");
}

export function canDeleteLead(profile: Profile) {
  return hasPermission(profile, "leads.delete");
}

export function canEditLead(
  profile: Profile,
  lead: LeadPermissionRecord,
): boolean {
  if (lead.organization_id !== profile.organization_id) {
    return false;
  }

  if (!hasPermission(profile, "leads.edit")) {
    return false;
  }

  if (hasPermission(profile, "leads.delete")) {
    return true;
  }

  return lead.assigned_to === profile.id || lead.assigned_to === null;
}
