"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { AURORA_WORKSPACE_HEADER_KPI } from "./aurora-tokens";

export type WorkspaceHeaderKpiTone =
  | "default"
  | "muted"
  | "success"
  | "warning"
  | "critical";

const KPI_TONE_CLASS: Record<WorkspaceHeaderKpiTone, string> = {
  default: "text-foreground/80",
  muted: "text-muted-foreground",
  success: "text-emerald-700 dark:text-emerald-400",
  warning: "text-amber-700 dark:text-amber-400",
  critical: "text-red-700 dark:text-red-400",
};

export type WorkspaceHeaderKpiProps = {
  children: ReactNode;
  tone?: WorkspaceHeaderKpiTone;
  className?: string;
  /** For live KPI counts that update */
  ariaLive?: "polite" | "off";
};

/**
 * Actionable workspace subtitle — status line, KPI, or count (not descriptive copy).
 */
export function WorkspaceHeaderKpi({
  children,
  tone = "muted",
  className,
  ariaLive = "off",
}: WorkspaceHeaderKpiProps) {
  return (
    <p
      className={cn(AURORA_WORKSPACE_HEADER_KPI, KPI_TONE_CLASS[tone], className)}
      aria-live={ariaLive}
    >
      {children}
    </p>
  );
}
