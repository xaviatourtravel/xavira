import { redirect } from "next/navigation";

import type { Profile } from "@/types/app-types";

import { hasPermission } from "./permissions";
import type { Permission } from "./permission-matrix";

const ROUTE_PERMISSION_RULES: Array<{ prefix: string; permission: Permission }> =
  [
    { prefix: "/settings/team", permission: "settings.view" },
    { prefix: "/settings/integrations", permission: "settings.view" },
    { prefix: "/settings", permission: "settings.view" },
    { prefix: "/knowledge", permission: "knowledge.view" },
    { prefix: "/content", permission: "content.view" },
    { prefix: "/campaigns", permission: "content.view" },
    { prefix: "/bookings", permission: "bookings.view" },
    { prefix: "/packages", permission: "bookings.view" },
    { prefix: "/follow-ups", permission: "followups.view" },
    { prefix: "/inbox", permission: "inbox.view" },
    { prefix: "/leads", permission: "leads.view" },
    { prefix: "/customers", permission: "leads.view" },
    { prefix: "/revenue", permission: "dashboard.view" },
    { prefix: "/scripts", permission: "leads.view" },
    { prefix: "/today", permission: "today.view" },
    { prefix: "/dashboard", permission: "dashboard.view" },
  ];

export function getRequiredPermissionForPath(pathname: string): Permission | null {
  const normalizedPath =
    pathname.endsWith("/") && pathname.length > 1
      ? pathname.slice(0, -1)
      : pathname;

  for (const rule of ROUTE_PERMISSION_RULES) {
    if (
      normalizedPath === rule.prefix ||
      normalizedPath.startsWith(`${rule.prefix}/`)
    ) {
      return rule.permission;
    }
  }

  return null;
}

export function assertRoutePermission(profile: Profile, permission: Permission) {
  if (!hasPermission(profile, permission)) {
    redirect(
      `/dashboard?error=${encodeURIComponent("You do not have access to this area.")}`,
    );
  }
}

export async function enforceRoutePermission(
  profile: Profile,
  permission: Permission,
) {
  assertRoutePermission(profile, permission);
}

export function canAccessPath(profile: Profile, pathname: string) {
  const permission = getRequiredPermissionForPath(pathname);

  if (!permission) {
    return true;
  }

  return hasPermission(profile, permission);
}
