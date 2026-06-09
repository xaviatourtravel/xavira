import type { Enums } from "@/types/database";

export type DashboardVariant = "owner" | "admin" | "agent";

export function resolveDashboardVariant(
  role: Enums<"user_role"> | string,
): DashboardVariant {
  switch (role) {
    case "owner":
      return "owner";
    case "admin":
      return "admin";
    case "agent":
      return "agent";
    default:
      return "agent";
  }
}

export function isOwnerDashboardVariant(variant: DashboardVariant): boolean {
  return variant === "owner";
}

export function isAdminDashboardVariant(variant: DashboardVariant): boolean {
  return variant === "admin";
}

export function isAgentDashboardVariant(variant: DashboardVariant): boolean {
  return variant === "agent";
}
