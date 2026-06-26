import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { workspaceCardClass } from "./styles";

type WorkspaceMainPanelProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  padded?: boolean;
};

export function WorkspaceMainPanel({
  title,
  description,
  children,
  action,
  className,
  padded = true,
}: WorkspaceMainPanelProps) {
  return (
    <section className={cn(workspaceCardClass, padded && "p-5", className)}>
      {title || description || action ? (
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            {title ? (
              <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}
