"use client";

import Link from "next/link";
import { useCallback, useRef } from "react";

import { cn } from "@/lib/utils";

import type { WorkspaceTabDefinition } from "./types";

type WorkspaceTabsProps = {
  tabs: WorkspaceTabDefinition[];
  activeTab: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
  ariaLabel?: string;
};

export function WorkspaceTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
  ariaLabel = "Workspace sections",
}: WorkspaceTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const visibleTabs = tabs.filter((tab) => !tab.hidden);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!scrollRef.current) {
        return;
      }

      const currentIndex = visibleTabs.findIndex((tab) => tab.id === activeTab);
      if (currentIndex === -1) {
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        const next = visibleTabs[currentIndex + 1];
        if (next) {
          onTabChange?.(next.id);
        }
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        const previous = visibleTabs[currentIndex - 1];
        if (previous) {
          onTabChange?.(previous.id);
        }
      }
    },
    [activeTab, onTabChange, visibleTabs],
  );

  if (visibleTabs.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label={ariaLabel}
      className={cn("border-t border-border/50", className)}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={scrollRef}
        className="-mb-px flex gap-1 overflow-x-auto pb-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {visibleTabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;
          const content = (
            <>
              {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
              <span>{tab.label}</span>
              {tab.badge ? (
                <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {tab.badge}
                </span>
              ) : null}
            </>
          );

          const tabClassName = cn(
            "inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3.5 text-sm font-medium transition-colors",
            isActive
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
          );

          if (tab.href) {
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={tabClassName}
                aria-current={isActive ? "page" : undefined}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={tab.id}
              type="button"
              className={tabClassName}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onTabChange?.(tab.id)}
            >
              {content}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function buildDefaultWorkspaceTabs(
  overrides?: Partial<Record<string, Pick<WorkspaceTabDefinition, "hidden" | "href" | "badge">>>,
): WorkspaceTabDefinition[] {
  const defaults: WorkspaceTabDefinition[] = [
    { id: "overview", label: "Overview" },
    { id: "timeline", label: "Timeline" },
    { id: "tasks", label: "Tasks" },
    { id: "documents", label: "Documents" },
    { id: "notes", label: "Notes" },
    { id: "ai", label: "AI" },
  ];

  return defaults.map((tab) => ({
    ...tab,
    ...overrides?.[tab.id],
  }));
}
