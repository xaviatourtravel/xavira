"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { workspaceSidebarCardClass } from "./styles";

type WorkspaceSidebarProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
  collapsibleOnMobile?: boolean;
};

export function WorkspaceSidebar({
  children,
  title = "Context",
  description,
  className,
  collapsibleOnMobile = true,
}: WorkspaceSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!collapsibleOnMobile) {
    return (
      <aside className={cn("space-y-4", className)} aria-label="Workspace context">
        {children}
      </aside>
    );
  }

  return (
    <aside className={cn("space-y-4", className)} aria-label="Workspace context">
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className={cn(
            workspaceSidebarCardClass,
            "flex w-full items-center justify-between px-4 py-3 text-left",
          )}
          aria-expanded={mobileOpen}
        >
          <div>
            <p className="text-sm font-semibold">{title}</p>
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              mobileOpen && "rotate-180",
            )}
          />
        </button>

        {mobileOpen ? <div className="space-y-4 pt-1">{children}</div> : null}
      </div>

      <div className="hidden space-y-4 lg:block">{children}</div>
    </aside>
  );
}

type WorkspaceSidebarSectionProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function WorkspaceSidebarSection({
  title,
  description,
  action,
  children,
  className,
}: WorkspaceSidebarSectionProps) {
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
      {children}
    </section>
  );
}
