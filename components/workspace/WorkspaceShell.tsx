"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { AURORA_SHELL_CLASS } from "./aurora-tokens";

export type WorkspaceShellProps = {
  /** Sticky workspace header region */
  header?: ReactNode;
  children: ReactNode;
  /** Optional footer region (e.g. composer dock) */
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
};

/**
 * Aurora Workspace Shell — full-viewport layout foundation shared by every major workspace.
 * Provides consistent spacing, responsive flex columns, and transition-safe structure.
 */
export function WorkspaceShell({
  header,
  children,
  footer,
  className,
  contentClassName,
}: WorkspaceShellProps) {
  return (
    <div className={cn(AURORA_SHELL_CLASS, "h-full", className)}>
      {header}
      <div className={cn("flex min-h-0 flex-1 flex-col", contentClassName)}>{children}</div>
      {footer ? <div className="shrink-0">{footer}</div> : null}
    </div>
  );
}
