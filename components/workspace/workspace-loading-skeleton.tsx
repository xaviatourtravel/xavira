import { cn } from "@/lib/utils";

import { workspaceCardClass, workspaceSidebarCardClass } from "./styles";

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

type WorkspaceLoadingSkeletonProps = {
  showSidebar?: boolean;
  tabCount?: number;
  sidebarSections?: number;
  mainSections?: number;
  className?: string;
};

export function WorkspaceLoadingSkeleton({
  showSidebar = true,
  tabCount = 6,
  sidebarSections = 4,
  mainSections = 2,
  className,
}: WorkspaceLoadingSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)} aria-busy="true" aria-label="Loading workspace">
      <div className="space-y-5 border-b border-border/60 pb-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <SkeletonBlock className="h-14 w-14 rounded-2xl" />
            <div className="space-y-3">
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="h-8 w-56 max-w-full" />
              <div className="flex flex-wrap gap-3">
                <SkeletonBlock className="h-6 w-24 rounded-full" />
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-4 w-32" />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <SkeletonBlock className="h-9 w-20 rounded-md" />
            <SkeletonBlock className="h-9 w-28 rounded-md" />
            <SkeletonBlock className="h-9 w-24 rounded-md" />
            <SkeletonBlock className="h-9 w-9 rounded-md" />
          </div>
        </div>

        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: tabCount }).map((_, index) => (
            <SkeletonBlock key={index} className="h-10 w-24 shrink-0 rounded-md" />
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,32%)]">
        <div className="space-y-4">
          {Array.from({ length: mainSections }).map((_, index) => (
            <div key={index} className={cn(workspaceCardClass, "space-y-4 p-5")}>
              <SkeletonBlock className="h-5 w-40" />
              <SkeletonBlock className="h-4 w-full max-w-xl" />
              <SkeletonBlock className="h-24 w-full rounded-xl" />
              <SkeletonBlock className="h-24 w-full rounded-xl" />
            </div>
          ))}
        </div>

        {showSidebar ? (
          <div className="space-y-4">
            {Array.from({ length: sidebarSections }).map((_, index) => (
              <div key={index} className={cn(workspaceSidebarCardClass, "space-y-3")}>
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-3 w-full" />
                <SkeletonBlock className="h-3 w-5/6" />
                <SkeletonBlock className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function WorkspacePanelLoadingSkeleton({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn(workspaceCardClass, "space-y-3 p-5", className)}>
      <SkeletonBlock className="h-5 w-32" />
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonBlock key={index} className="h-4 w-full" />
      ))}
    </div>
  );
}

export function WorkspaceSidebarLoadingSkeleton({
  sections = 3,
  className,
}: {
  sections?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: sections }).map((_, index) => (
        <div key={index} className={cn(workspaceSidebarCardClass, "space-y-3")}>
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="h-3 w-full" />
          <SkeletonBlock className="h-10 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}
