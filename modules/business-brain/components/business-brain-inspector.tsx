import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type BusinessBrainInspectorProps = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
  /** @deprecated Ignored — kept for unused page inspectors */
  contentKey?: string;
  className?: string;
};

export function BusinessBrainInspector({
  title,
  subtitle,
  icon: Icon,
  actions,
  children,
  className,
}: BusinessBrainInspectorProps) {
  return (
    <div
      className={cn(
        "sticky top-6 h-fit w-full xl:border-l xl:border-border/50 xl:pl-8",
        className,
      )}
    >
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              {Icon ? (
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              ) : null}
              <h3 className="text-sm font-semibold tracking-tight text-foreground">
                {title}
              </h3>
            </div>
            {subtitle ? (
              <p className="text-xs leading-relaxed text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>

        <div className="space-y-5">{children}</div>
      </div>
    </div>
  );
}
