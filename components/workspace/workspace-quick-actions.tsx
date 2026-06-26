"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { WorkspaceQuickAction, WorkspaceQuickActionGroup } from "./types";

type WorkspaceQuickActionsProps = {
  actions: WorkspaceQuickAction[];
  moreActions?: WorkspaceQuickAction[];
  moreGroups?: WorkspaceQuickActionGroup[];
  className?: string;
  mobileIconOnly?: boolean;
};

function ActionControl({
  action,
  mobileIconOnly,
}: {
  action: WorkspaceQuickAction;
  mobileIconOnly?: boolean;
}) {
  const Icon = action.icon;
  const content = (
    <>
      {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
      <span className={cn(mobileIconOnly && "sr-only sm:not-sr-only")}>{action.label}</span>
    </>
  );

  const className = cn(
    buttonVariants({
      variant: action.variant ?? "outline",
      size: "sm",
    }),
    mobileIconOnly && "px-2.5 sm:px-3",
  );

  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <Button
      type="button"
      variant={action.variant ?? "outline"}
      size="sm"
      className={cn(mobileIconOnly && "px-2.5 sm:px-3")}
      onClick={action.onClick}
    >
      {content}
    </Button>
  );
}

export function WorkspaceQuickActions({
  actions,
  moreActions = [],
  moreGroups = [],
  className,
  mobileIconOnly = true,
}: WorkspaceQuickActionsProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const visibleActions = actions.filter((action) => !action.hidden);
  const visibleMoreActions = moreActions.filter((action) => !action.hidden);
  const hasOverflow =
    visibleMoreActions.length > 0 || moreGroups.some((group) => group.actions.length > 0);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (visibleActions.length === 0 && !hasOverflow) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {visibleActions.map((action) => (
        <ActionControl
          key={action.id}
          action={action}
          mobileIconOnly={mobileIconOnly}
        />
      ))}

      {hasOverflow ? (
        <div ref={menuRef} className="relative">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="px-2.5"
            aria-label="More actions"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">More</span>
          </Button>

          {open ? (
            <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border bg-popover p-1 shadow-lg">
              {visibleMoreActions.map((action) => {
                const Icon = action.icon;

                if (action.href) {
                  return (
                    <Link
                      key={action.id}
                      href={action.href}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
                      onClick={() => setOpen(false)}
                    >
                      {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
                      {action.label}
                    </Link>
                  );
                }

                return (
                  <button
                    key={action.id}
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      action.onClick?.();
                      setOpen(false);
                    }}
                  >
                    {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
                    {action.label}
                  </button>
                );
              })}

              {moreGroups.map((group) => (
                <div key={group.id} className="border-t py-1">
                  <p className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </p>
                  {group.actions
                    .filter((action) => !action.hidden)
                    .map((action) => {
                      const Icon = action.icon;

                      if (action.href) {
                        return (
                          <Link
                            key={action.id}
                            href={action.href}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
                            onClick={() => setOpen(false)}
                          >
                            {Icon ? (
                              <Icon className="h-4 w-4 text-muted-foreground" />
                            ) : null}
                            {action.label}
                          </Link>
                        );
                      }

                      return (
                        <button
                          key={action.id}
                          type="button"
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
                          onClick={() => {
                            action.onClick?.();
                            setOpen(false);
                          }}
                        >
                          {Icon ? (
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          ) : null}
                          {action.label}
                        </button>
                      );
                    })}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
