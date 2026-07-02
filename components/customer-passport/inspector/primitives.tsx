import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function InspectorShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "divide-y divide-border/50 bg-background shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function InspectorSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4 px-5 py-5", className)}>{children}</section>
  );
}

export function InspectorSectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function InspectorMutedText({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-xs leading-relaxed text-muted-foreground", className)}>
      {children}
    </p>
  );
}

export function InspectorSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-background p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] ring-1 ring-border/40",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function InspectorField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate text-sm text-foreground">
        {value?.trim() || "—"}
      </p>
    </div>
  );
}

/** @deprecated Use InspectorSection */
export const InspectorCard = InspectorSection;
