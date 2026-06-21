import type { UserRole } from "@/types/app-types";

export const TEAM_INVITE_ROLES = [
  "admin",
  "agent",
  "sales",
  "marketing",
  "finance",
] as const satisfies readonly UserRole[];

export const TEAM_ROLES = ["owner", "admin", "agent", "sales", "marketing", "finance"] as const;

export function isTeamRole(value: string): value is UserRole {
  return TEAM_ROLES.includes(value as UserRole);
}

export function parseTeamRole(value: string): UserRole | null {
  const trimmed = value.trim();
  return isTeamRole(trimmed) ? trimmed : null;
}

export function formatTeamRoleLabel(role: UserRole) {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "agent":
      return "Agent";
    case "sales":
      return "Sales";
    case "marketing":
      return "Marketing";
    case "finance":
      return "Finance";
  }
}

export const TEAM_MEMBER_STATUS_LABEL = "Active";
