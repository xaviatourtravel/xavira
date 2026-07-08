"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import {
  AURORA_HEADER_CLASS,
  AURORA_WORKSPACE_HEADER_PADDING,
  AURORA_WORKSPACE_HEADER_SEARCH_MAX,
  AURORA_WORKSPACE_HEADER_TITLE,
} from "./aurora-tokens";
import { WorkspaceHeaderActions } from "./WorkspaceHeaderActions";
import { WorkspaceHeaderKpi } from "./WorkspaceHeaderKpi";

export type WorkspaceHeaderProps = {
  title: string;
  /** Actionable status / KPI line — preferred over subtitle */
  kpi?: ReactNode;
  /**
   * @deprecated Use `kpi` with {@link WorkspaceHeaderKpi} for status and counts.
   */
  subtitle?: string;
  /** Module search — use {@link WorkspaceHeaderSearch} */
  search?: ReactNode;
  /** Primary create — use {@link WorkspaceHeaderCreate} */
  create?: ReactNode;
  /** Secondary actions — use {@link WorkspaceHeaderAction} inside {@link WorkspaceHeaderActions} */
  actions?: ReactNode;
  /** Optional row below the main header (filters, tabs, etc.) */
  toolbar?: ReactNode;
  className?: string;
  titleClassName?: string;
};

/**
 * Aurora Workspace Header — reusable module header for every Desklabs workspace.
 *
 * Layout: identity (title + KPI) · global search · create + actions
 */
export function WorkspaceHeader({
  title,
  kpi,
  subtitle,
  search,
  create,
  actions,
  toolbar,
  className,
  titleClassName,
}: WorkspaceHeaderProps) {
  const statusLine =
    kpi ??
    (subtitle ? <WorkspaceHeaderKpi tone="muted">{subtitle}</WorkspaceHeaderKpi> : null);

  const hasTrailing = Boolean(create || actions || search);

  return (
    <header className={cn(AURORA_HEADER_CLASS, AURORA_WORKSPACE_HEADER_PADDING, className)}>
      <div className="flex flex-col gap-2">
        <div
          className={cn(
            "flex flex-col gap-2",
            hasTrailing && "lg:flex-row lg:items-center lg:gap-3",
          )}
        >
          <div className="min-w-0 lg:shrink-0">
            <h1 className={cn(AURORA_WORKSPACE_HEADER_TITLE, titleClassName)}>{title}</h1>
            {statusLine}
          </div>

          {search ? (
            <div
              className={cn(
                "min-w-0 w-full lg:flex-1",
                AURORA_WORKSPACE_HEADER_SEARCH_MAX,
                "lg:mx-1",
              )}
            >
              {search}
            </div>
          ) : null}

          {create || actions ? (
            <WorkspaceHeaderActions>
              {create}
              {actions}
            </WorkspaceHeaderActions>
          ) : null}
        </div>

        {toolbar ? <div className="min-w-0">{toolbar}</div> : null}
      </div>
    </header>
  );
}
