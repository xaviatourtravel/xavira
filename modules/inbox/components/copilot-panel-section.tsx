"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type CopilotPanelSectionProps = {
  label?: string;
  children: ReactNode;
  hideDivider?: boolean;
  className?: string;
};

export function CopilotPanelSection({
  label,
  children,
  hideDivider = false,
  className,
}: CopilotPanelSectionProps) {
  return (
    <section className={cn("px-4 py-4", className)}>
      {label ? (
        <p className="mb-3 text-xs text-muted-foreground">{label}</p>
      ) : null}
      {children}
      {!hideDivider ? <div className="mt-4 h-px bg-border/25" aria-hidden /> : null}
    </section>
  );
}
