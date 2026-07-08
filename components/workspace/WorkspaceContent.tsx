"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { AURORA_CONTENT_LANE_CLASS, AURORA_FLAT_SURFACE_CLASS } from "./aurora-tokens";

export type WorkspaceContentProps = {
  children: ReactNode;
  /** Constrain content to the reading lane (default) or allow full bleed */
  variant?: "lane" | "full";
  className?: string;
};

/**
 * Aurora Workspace Content — centered reading lane with flat surfaces.
 * Avoid nested cards; use spacing and subtle dividers instead.
 */
export function WorkspaceContent({
  children,
  variant = "lane",
  className,
}: WorkspaceContentProps) {
  return (
    <main
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain",
        AURORA_FLAT_SURFACE_CLASS,
        variant === "lane" && AURORA_CONTENT_LANE_CLASS,
        "px-4 py-4 md:px-6 md:py-5",
        className,
      )}
    >
      <div className="space-y-4 md:space-y-5">{children}</div>
    </main>
  );
}
