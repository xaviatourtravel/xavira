"use client";

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
  baseId: string;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within Tabs");
  }
  return context;
}

export function Tabs({
  value,
  onValueChange,
  children,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}) {
  const baseId = useId();
  const context = useMemo(
    () => ({ value, onValueChange, baseId }),
    [value, onValueChange, baseId],
  );

  return (
    <TabsContext.Provider value={context}>
      <div className={cn("flex min-h-0 flex-1 flex-col", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  children,
  className,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  const { baseId } = useTabsContext();

  return (
    <div
      id={`${baseId}-tablist`}
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex w-full shrink-0 gap-1 border-b border-border/40 bg-background px-2 py-1.5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
  icon,
}: {
  value: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}) {
  const { value: activeValue, onValueChange, baseId } = useTabsContext();
  const selected = activeValue === value;

  const focusSibling = useCallback(
    (direction: 1 | -1) => {
      const list = document.getElementById(`${baseId}-tablist`);
      if (!list) return;
      const tabs = Array.from(
        list.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
      );
      const index = tabs.findIndex((tab) => tab.getAttribute("data-value") === value);
      if (index < 0) return;
      const next = tabs[(index + direction + tabs.length) % tabs.length];
      next?.focus();
      const nextValue = next?.getAttribute("data-value");
      if (nextValue) onValueChange(nextValue);
    },
    [baseId, onValueChange, value],
  );

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      focusSibling(1);
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      focusSibling(-1);
    }
    if (event.key === "Home") {
      event.preventDefault();
      const list = document.getElementById(`${baseId}-tablist`);
      const first = list?.querySelector<HTMLButtonElement>('[role="tab"]');
      first?.focus();
      const firstValue = first?.getAttribute("data-value");
      if (firstValue) onValueChange(firstValue);
    }
    if (event.key === "End") {
      event.preventDefault();
      const list = document.getElementById(`${baseId}-tablist`);
      const tabs = list?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      const last = tabs?.[tabs.length - 1];
      last?.focus();
      const lastValue = last?.getAttribute("data-value");
      if (lastValue) onValueChange(lastValue);
    }
  }

  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      data-value={value}
      aria-selected={selected}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      onClick={() => onValueChange(value)}
      onKeyDown={handleKeyDown}
      className={cn(
        "inline-flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-1 py-1 text-[10px] font-medium leading-tight transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "bg-muted/60 text-foreground"
          : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
        className,
      )}
    >
      {icon ? (
        <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:stroke-[1.75]">{icon}</span>
      ) : null}
      <span className="truncate">{children}</span>
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
  hidden,
}: {
  value: string;
  children: ReactNode;
  className?: string;
  hidden?: boolean;
}) {
  const { value: activeValue, baseId } = useTabsContext();
  const selected = activeValue === value;

  if (!selected && hidden) return null;

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      hidden={!selected}
      className={cn(!selected && "hidden", className)}
    >
      {selected ? children : null}
    </div>
  );
}
