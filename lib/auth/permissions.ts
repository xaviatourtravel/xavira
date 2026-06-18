import type { Profile, UserRole } from "@/types/app-types";

export function hasRole(profile: Profile, roles: UserRole[]): boolean {
  return roles.includes(profile.role);
}

export function isAdminOrOwner(profile: Profile): boolean {
  return hasRole(profile, ["owner", "admin"]);
}

/** Owner/admin can link Instagram posts to Content Board; agents are view-only. */
export function canLinkInstagramContent(profile: Profile): boolean {
  return isAdminOrOwner(profile);
}

export function isOwner(profile: Profile): boolean {
  return profile.role === "owner";
}
