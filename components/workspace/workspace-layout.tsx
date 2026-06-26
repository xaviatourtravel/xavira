import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { workspacePageClass, workspaceStickyRegionClass, workspaceStickyShellClass } from "./styles";

type WorkspaceLayoutProps = {
  header: ReactNode;
  tabs?: ReactNode;
  main: ReactNode;
  sidebar?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function WorkspaceLayout({
  header,
  tabs,
  main,
  sidebar,
  className,
  contentClassName,
}: WorkspaceLayoutProps) {
  return (
    <div className={cn(workspacePageClass, className)}>
      <div className={cn(workspaceStickyRegionClass, workspaceStickyShellClass)}>
        {header}
        {tabs}
      </div>

      <div
        className={cn(
          "mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,32%)] lg:items-start",
          contentClassName,
        )}
      >
        <div className="min-w-0 space-y-6">{main}</div>
        {sidebar ? (
          <div className="min-w-0 space-y-4 lg:sticky lg:top-[11rem] lg:self-start">
            {sidebar}
          </div>
        ) : null}
      </div>
    </div>
  );
}
