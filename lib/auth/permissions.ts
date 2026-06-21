import type { Profile, UserRole } from "@/types/app-types";

import {
  getPermissionsForRole,
  normalizeEffectiveRole,
  roleHasPermission,
  type Permission,
} from "./permission-matrix";

export type { Permission } from "./permission-matrix";

export function hasRole(profile: Profile, roles: UserRole[]): boolean {
  return roles.includes(profile.role);
}

export function isAdminOrOwner(profile: Profile): boolean {
  return hasRole(profile, ["owner", "admin"]);
}

export function isOwner(profile: Profile): boolean {
  return profile.role === "owner";
}

export function hasPermission(profile: Profile, permission: Permission): boolean {
  return roleHasPermission(profile.role, permission);
}

export function hasEveryPermission(
  profile: Profile,
  permissions: Permission[],
): boolean {
  return permissions.every((permission) => hasPermission(profile, permission));
}

export function hasSomePermission(
  profile: Profile,
  permissions: Permission[],
): boolean {
  return permissions.some((permission) => hasPermission(profile, permission));
}

export function getProfilePermissions(profile: Profile): Permission[] {
  return getPermissionsForRole(profile.role);
}

export function assertPermission(
  profile: Profile,
  permission: Permission,
  message = "You do not have permission to perform this action.",
): void {
  if (!hasPermission(profile, permission)) {
    throw new Error(message);
  }
}

export function permissionDeniedMessage(permission: Permission) {
  return `Missing permission: ${permission}`;
}

/** Owner/admin can link Instagram posts to Content Board. */
export function canLinkInstagramContent(profile: Profile): boolean {
  return hasPermission(profile, "content.manage");
}

export function canManageWorkspaceSettings(profile: Profile) {
  return hasPermission(profile, "settings.manage");
}

export function canManageTeam(profile: Profile) {
  return hasPermission(profile, "team.manage");
}

export function canManageIntegrations(profile: Profile) {
  return hasPermission(profile, "integrations.manage");
}

export function getEffectiveRoleLabel(profile: Profile) {
  return normalizeEffectiveRole(profile.role);
}
