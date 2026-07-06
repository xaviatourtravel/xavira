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
    <div className={cn(!flush && "px-6", "pb-6", className)}>
      <div
        className={cn(
          "rounded-lg border border-border/60 bg-card p-4 shadow-sm",
          "dark:border-border/50 dark:bg-card/80",
        )}
      >
        {children}
      </div>
    </div>
  );
}
