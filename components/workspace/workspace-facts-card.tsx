import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { workspaceSidebarCardClass } from "./styles";
import type { WorkspaceFactItem } from "./types";

type WorkspaceFactsCardProps = {
  title?: string;
  description?: string;
  facts: WorkspaceFactItem[];
  action?: ReactNode;
  className?: string;
  columns?: 1 | 2;
};

export function WorkspaceFactsCard({
  title = "Quick Facts",
  description,
  facts,
  action,
  className,
  columns = 1,
}: WorkspaceFactsCardProps) {
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

      <dl
        className={cn(
          "grid gap-3",
          columns === 2 && "sm:grid-cols-2",
        )}
      >
        {facts.map((fact, index) => (
          <div key={fact.id ?? `${fact.label}-${index}`} className="min-w-0">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {fact.label}
            </dt>
            <dd className="mt-1 text-sm font-medium leading-snug text-foreground">
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
