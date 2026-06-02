import type { Profile, UserRole } from "@/types/database";

export function hasRole(profile: Profile, roles: UserRole[]): boolean {
  return roles.includes(profile.role);
}

export function isAdminOrOwner(profile: Profile): boolean {
  return hasRole(profile, ["owner", "admin"]);
}

export function isOwner(profile: Profile): boolean {
  return profile.role === "owner";
}
