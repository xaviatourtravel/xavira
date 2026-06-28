import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Standard inner layout for every Desklabs workspace.
 * Header → Toolbar → Content → optional Context Panel
 */
export type AppWorkspaceFrameProps = {
  header: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  contextPanel?: ReactNode;
  className?: string;
};

export function AppWorkspaceFrame({
  header,
  toolbar,
  children,
  contextPanel,
  className,
}: AppWorkspaceFrameProps) {
  return (
    <div className={cn("mx-auto w-full max-w-[1440px] space-y-0", className)}>
      <header className="space-y-4 border-b border-slate-200/80 pb-5">
        {header}
        {toolbar ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">{toolbar}</div>
        ) : null}
      </header>

      <div
        className={cn(
          "grid gap-6 pt-6",
          contextPanel
            ? "lg:grid-cols-[minmax(0,1fr)_minmax(280px,32%)] lg:items-start"
            : "",
        )}
      >
        <div className="min-w-0 space-y-6">{children}</div>
        {contextPanel ? (
          <aside className="min-w-0 space-y-4 lg:sticky lg:top-36 lg:self-start">
            {contextPanel}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
