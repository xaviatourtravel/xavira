"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { AURORA_HEADER_CLASS } from "./aurora-tokens";

export type WorkspaceHeaderProps = {
  title: string;
  subtitle?: string;
  /** Search input or filter bar */
  search?: ReactNode;
  /** Primary and secondary actions */
  actions?: ReactNode;
  className?: string;
  titleClassName?: string;
};

/**
 * Aurora Workspace Header — module-level title bar with search and action slots.
 */
export function WorkspaceHeader({
  title,
  subtitle,
  search,
  actions,
  className,
  titleClassName,
}: WorkspaceHeaderProps) {
  return (
    <header className={cn(AURORA_HEADER_CLASS, "px-4 py-3 md:px-6", className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-0.5">
          <h1
            className={cn(
              "truncate text-xl font-semibold tracking-tight text-foreground md:text-2xl",
              titleClassName,
            )}
          >
            {title}
          </h1>
          {subtitle ? (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>

        {(search || actions) ? (
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            {search ? <div className="min-w-0 flex-1 sm:max-w-sm">{search}</div> : null}
            {actions ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}
