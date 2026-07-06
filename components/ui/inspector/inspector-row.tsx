import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { INSPECTOR_HOVER_CLASS } from "./constants";

export function InspectorRow({
  label,
  value,
  className,
  interactive = false,
}: {
  label: string;
  value: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 py-1",
        interactive && cn("rounded-md px-1 -mx-1 hover:bg-muted/40", INSPECTOR_HOVER_CLASS),
        className,
      )}
    >
      <span className="shrink-0 text-[13px] text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export function InspectorRows({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-2", className)}>{children}</div>;
}

/** Timeline / file list row */
export function InspectorListItem({
  label,
  detail,
  meta,
  action,
  className,
}: {
  label: ReactNode;
  detail?: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <li
      className={cn(
        "flex items-start justify-between gap-3 rounded-md px-1 py-2",
        INSPECTOR_HOVER_CLASS,
        "hover:bg-muted/40",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {detail ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{detail}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {meta ? <span className="text-xs text-muted-foreground">{meta}</span> : null}
        {action}
      </div>
    </li>
  );
}
