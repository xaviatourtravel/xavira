"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type WorkspaceHeaderActionsProps = {
  children: ReactNode;
  className?: string;
};

/** Groups create + secondary actions with consistent spacing. */
export function WorkspaceHeaderActions({
  children,
  className,
}: WorkspaceHeaderActionsProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:ml-auto lg:ml-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
