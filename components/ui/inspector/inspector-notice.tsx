import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Inline notice block (warnings, hints) — transparent section background */
export function InspectorNotice({
  children,
  tone = "warning",
  className,
}: {
  children: ReactNode;
  tone?: "warning" | "neutral" | "info";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md px-3 py-2 text-[13px] leading-relaxed",
        tone === "warning" &&
          "bg-amber-500/10 text-amber-950 dark:text-amber-100",
        tone === "neutral" && "bg-muted/40 text-muted-foreground",
        tone === "info" && "bg-sky-500/10 text-sky-950 dark:text-sky-100",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function InspectorProgress({
  value,
  indeterminate = false,
  className,
}: {
  value: number;
  indeterminate?: boolean;
  className?: string;
}) {
  if (indeterminate) {
    return (
      <div
        className={cn("h-1 overflow-hidden rounded-full bg-muted", className)}
        role="progressbar"
        aria-busy="true"
        aria-valuetext="Uploading"
      >
        <div className="h-full w-1/3 animate-pulse rounded-full bg-emerald-500 dark:bg-emerald-400" />
      </div>
    );
  }

  return (
    <div
      className={cn("h-1 overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      aria-valuenow={Math.min(100, Math.max(0, value))}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-emerald-500 transition-all duration-150 dark:bg-emerald-400"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
