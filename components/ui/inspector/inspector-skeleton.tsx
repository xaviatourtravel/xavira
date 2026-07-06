import { cn } from "@/lib/utils";

import { INSPECTOR_PADDING } from "./constants";

export function InspectorSkeleton({
  rows = 4,
  showHero = false,
  showFooter = false,
  ariaLabel = "Loading",
  className,
}: {
  rows?: number;
  showHero?: boolean;
  showFooter?: boolean;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("space-y-6", INSPECTOR_PADDING, className)}
      aria-busy="true"
      aria-label={ariaLabel}
    >
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-4 w-4 animate-pulse rounded bg-muted/70" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-40 animate-pulse rounded bg-muted/80" />
            <div className="h-4 w-full max-w-xs animate-pulse rounded bg-muted/60" />
          </div>
        </div>
        <div className="h-px bg-border/50" />
      </div>

      {showHero ? (
        <div className="rounded-lg border border-border/40 p-4">
          <div className="space-y-3">
            <div className="h-4 w-32 animate-pulse rounded bg-muted/70" />
            <div className="h-20 w-full animate-pulse rounded bg-muted/50" />
            <div className="flex gap-2">
              <div className="h-7 w-16 animate-pulse rounded-full bg-muted/60" />
              <div className="h-7 w-20 animate-pulse rounded-full bg-muted/60" />
            </div>
          </div>
        </div>
      ) : null}

      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 animate-pulse rounded bg-muted/70" />
            <div className="h-3.5 w-28 animate-pulse rounded bg-muted/70" />
          </div>
          <div className="space-y-2 pl-7">
            <div className="flex justify-between gap-3">
              <div className="h-3.5 w-20 animate-pulse rounded bg-muted/50" />
              <div className="h-3.5 w-24 animate-pulse rounded bg-muted/60" />
            </div>
            <div className="flex justify-between gap-3">
              <div className="h-3.5 w-16 animate-pulse rounded bg-muted/50" />
              <div className="h-3.5 w-20 animate-pulse rounded bg-muted/60" />
            </div>
          </div>
          {index === 0 ? (
            <div className="flex items-center gap-2 pl-7">
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted/60" />
              <div className="h-3 w-24 animate-pulse rounded bg-muted/50" />
            </div>
          ) : null}
          <div className="h-px bg-border/40" />
        </div>
      ))}

      {showFooter ? (
        <div className="border-t border-border/50 pt-4">
          <div className="flex gap-2">
            <div className="h-9 flex-1 animate-pulse rounded-md bg-muted/60" />
            <div className="h-9 flex-1 animate-pulse rounded-md bg-muted/50" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
