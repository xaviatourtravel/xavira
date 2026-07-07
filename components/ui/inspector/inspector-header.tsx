import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { INSPECTOR_HEADER_GAP, INSPECTOR_ICON_CLASS, INSPECTOR_PADDING } from "./constants";
import { InspectorDivider } from "./inspector-divider";

export function InspectorHeader({
  icon: Icon,
  title,
  description,
  status,
  action,
  segmentedControl,
  hideDivider = false,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  status?: ReactNode;
  action?: ReactNode;
  segmentedControl?: ReactNode;
  hideDivider?: boolean;
  className?: string;
}) {
  return (
    <header className={cn(INSPECTOR_PADDING, "pb-4 pt-5", className)}>
      <div className={cn("flex items-start", INSPECTOR_HEADER_GAP)}>
        {Icon ? <Icon className={cn(INSPECTOR_ICON_CLASS, "mt-0.5")} aria-hidden /> : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
              {description ? (
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {status}
              {action}
            </div>
          </div>
          {segmentedControl ? <div className="mt-4">{segmentedControl}</div> : null}
        </div>
      </div>
      {!hideDivider ? <InspectorDivider className="mt-4" /> : null}
    </header>
  );
}
