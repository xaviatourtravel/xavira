import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { getWorkspaceStatusToneClass, workspaceSidebarCardClass } from "./styles";
import type { WorkspaceStatItem } from "./types";

type WorkspaceStatCardProps = {
  title?: string;
  description?: string;
  stats: WorkspaceStatItem[];
  action?: ReactNode;
  className?: string;
};

export function WorkspaceStatCard({
  title = "Current Status",
  description,
  stats,
  action,
  className,
}: WorkspaceStatCardProps) {
  return (
    <section className={cn(workspaceSidebarCardClass, className)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          {description ? (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>

      <div className="grid gap-3">
        {stats.map((stat, index) => (
          <div
            key={stat.id ?? `${stat.label}-${index}`}
            className="rounded-lg border border-border/50 bg-muted/15 px-3 py-3"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {stat.label}
            </p>
            <div className="mt-1 flex items-center gap-2">
              {typeof stat.value === "string" && stat.tone ? (
                <span className={getWorkspaceStatusToneClass(stat.tone)}>
                  {stat.value}
                </span>
              ) : (
                <p className="text-lg font-semibold tracking-tight text-foreground">
                  {stat.value}
                </p>
              )}
            </div>
            {stat.hint ? (
              <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
