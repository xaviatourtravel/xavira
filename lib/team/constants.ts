import type { UserRole } from "@/types/app-types";

export const TEAM_ROLES = ["owner", "admin", "agent"] as const;

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
  }
}

export const TEAM_MEMBER_STATUS_LABEL = "Active";
