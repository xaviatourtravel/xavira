"use client";

import { ChevronDown, type LucideIcon } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import {
  INSPECTOR_EXPAND_CLASS,
  INSPECTOR_ICON_CLASS,
  INSPECTOR_PADDING,
  INSPECTOR_ROW_GAP,
  INSPECTOR_SECTION_GAP,
} from "./constants";
import { InspectorDivider } from "./inspector-divider";

export function InspectorSection({
  title,
  description,
  icon: Icon,
  children,
  collapsible = false,
  defaultOpen = true,
  action,
  hideDivider = false,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  action?: ReactNode;
  hideDivider?: boolean;
  className?: string;
}) {
  const contentId = useId();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={cn(INSPECTOR_PADDING, INSPECTOR_SECTION_GAP, className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {Icon ? <Icon className={cn(INSPECTOR_ICON_CLASS, "mt-0.5")} aria-hidden /> : null}
          <div className="min-w-0 flex-1">
            {collapsible ? (
              <button
                type="button"
                aria-expanded={open}
                aria-controls={contentId}
                onClick={() => setOpen((value) => !value)}
                className="group flex w-full items-start gap-2 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="min-w-0 flex-1">
                  <InspectorSectionHeading title={title} description={description} />
                </div>
                <ChevronDown
                  className={cn(
                    INSPECTOR_ICON_CLASS,
                    "mt-0.5 transition-transform duration-150",
                    open && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>
            ) : (
              <InspectorSectionHeading title={title} description={description} />
            )}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div
        id={contentId}
        className={cn(
          INSPECTOR_EXPAND_CLASS,
          "grid",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className={cn(INSPECTOR_ROW_GAP, Icon ? "pt-2" : "pt-1.5")}>{children}</div>
        </div>
      </div>

      {!hideDivider ? <InspectorDivider className="mt-3 opacity-40" /> : null}
    </section>
  );
}

function InspectorSectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <>
      <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
      {description ? (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground/90">{description}</p>
      ) : null}
    </>
  );
}
