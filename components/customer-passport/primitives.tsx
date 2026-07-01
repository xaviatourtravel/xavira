import type { ReactNode } from "react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { cn } from "@/lib/utils";

export function PassportShell({
  children,
  className,
  compact = false,
}: {
  children: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-soft bg-[linear-gradient(180deg,#fffef8_0%,#ffffff_42%,#fafafa_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.04)] dark:bg-[linear-gradient(180deg,#171717_0%,#0a0a0a_100%)]",
        compact ? "p-0" : "p-1",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.12),transparent_55%)]"
      />
      {children}
    </div>
  );
}

export function PassportHeader({
  title = "Customer Passport",
  subtitle,
  stamp,
}: {
  title?: string;
  subtitle?: string;
  stamp?: ReactNode;
}) {
  return (
    <div className="relative border-b border-dashed border-soft px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <BrandLogo variant="icon" size="sm" className="opacity-90" />
          <h3 className="mt-1 text-sm font-semibold tracking-tight text-foreground">
            {title}
          </h3>
          {subtitle ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {stamp}
      </div>
    </div>
  );
}

export function PassportSection({
  number,
  title,
  children,
  className,
}: {
  number: number;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("px-4 py-4", className)}>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
          {number}
        </span>
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {title}
        </h4>
      </div>
      {children}
    </section>
  );
}

export function PassportField({
  label,
  value,
  empty = "—",
}: {
  label: string;
  value: string | null | undefined;
  empty?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm text-foreground">
        {value?.trim() ? value : empty}
      </p>
    </div>
  );
}

export function PassportChip({
  children,
  active = false,
  className,
}: {
  children: ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
        active
          ? "bg-foreground text-background"
          : "bg-muted text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function PassportEmptyHint({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-soft bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
      {children}
    </p>
  );
}

export function PassportPerforation() {
  return (
    <div
      aria-hidden
      className="border-t border-dashed border-soft"
    />
  );
}
