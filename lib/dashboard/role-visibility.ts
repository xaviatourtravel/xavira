import type { Enums } from "@/types/database";

export type DashboardVariant = "owner" | "admin" | "sales" | "marketing" | "finance";

export function resolveDashboardVariant(
  role: Enums<"user_role"> | string,
): DashboardVariant {
  switch (role) {
    case "owner":
      return "owner";
    case "admin":
      return "admin";
    case "sales":
    case "agent":
      return "sales";
    case "marketing":
      return "marketing";
    case "finance":
      return "finance";
    default:
      return "sales";
  }
}

export function isOwnerDashboardVariant(variant: DashboardVariant): boolean {
  return variant === "owner";
}

export function isAdminDashboardVariant(variant: DashboardVariant): boolean {
  return variant === "admin";
}

export function isSalesDashboardVariant(variant: DashboardVariant): boolean {
  return variant === "sales";
}

/** @deprecated Use isSalesDashboardVariant */
export function isAgentDashboardVariant(variant: DashboardVariant): boolean {
  return isSalesDashboardVariant(variant);
}
