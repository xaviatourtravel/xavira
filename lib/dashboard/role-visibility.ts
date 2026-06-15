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

/**
 * Section visibility by dashboard variant:
 * - owner: executive org-wide KPIs, health, sales, booking, pipeline, sources, analytics, AI usage, content
 * - admin: need attention, sales performance, booking, content, follow-up overview, pipeline
 * - agent: personal leads, follow-ups, critical leads, shortcuts, AI sales assistant
 */
