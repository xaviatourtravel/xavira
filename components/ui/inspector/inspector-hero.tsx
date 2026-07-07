import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Optional elevated surface — maximum one per inspector panel.
 * Used for Conversation Health, AI Readiness, Customer Summary, etc.
 */
export function InspectorHero({
  children,
  className,
  flush = false,
}: {
  children: ReactNode;
  className?: string;
  /** When true, hero spans full width without horizontal inset */
  flush?: boolean;
}) {
  return (
    <div className={cn(!flush && "px-5", "pb-4", className)}>
      <div
        className={cn(
          "rounded-lg border border-border/50 bg-muted/20 p-4",
          "dark:border-border/40 dark:bg-muted/10",
        )}
      >
        {children}
      </div>
    </div>
  );
}
