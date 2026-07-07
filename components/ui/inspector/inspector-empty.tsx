import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { INSPECTOR_ICON_CLASS } from "./constants";

export function InspectorEmpty({
  title,
  description,
  icon: Icon,
  action,
  className,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-5 text-center",
        className,
      )}
    >
      {Icon ? <Icon className={cn(INSPECTOR_ICON_CLASS, "mb-3")} aria-hidden /> : null}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description !== title ? (
        <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
