import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { designSystemTypography } from "@/lib/design-system/tokens";

type TypographyProps = {
  children: ReactNode;
  className?: string;
};

export function DsDisplay({ children, className }: TypographyProps) {
  return <p className={cn(designSystemTypography.display, className)}>{children}</p>;
}

export function DsH1({ children, className }: TypographyProps) {
  return <h1 className={cn(designSystemTypography.h1, className)}>{children}</h1>;
}

export function DsH2({ children, className }: TypographyProps) {
  return <h2 className={cn(designSystemTypography.h2, className)}>{children}</h2>;
}

export function DsH3({ children, className }: TypographyProps) {
  return <h3 className={cn(designSystemTypography.h3, className)}>{children}</h3>;
}

export function DsBody({ children, className }: TypographyProps) {
  return <p className={cn(designSystemTypography.body, className)}>{children}</p>;
}

export function DsCaption({ children, className }: TypographyProps) {
  return <p className={cn(designSystemTypography.caption, className)}>{children}</p>;
}

export function DsColorSwatch({
  label,
  description,
  hex,
  swatchClass,
  textClass,
}: {
  label: string;
  description: string;
  hex: string;
  swatchClass: string;
  textClass: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className={cn("h-16 rounded-lg ring-1 ring-inset ring-black/5", swatchClass)} />
      <p className={cn("mt-3 text-sm font-semibold", textClass)}>{label}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
      <p className="mt-2 font-mono text-xs text-slate-400">{hex}</p>
    </div>
  );
}

export function DsSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function DsShowcaseGrid({
  children,
  columns = 2,
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
}) {
  const gridClass =
    columns === 1
      ? "grid-cols-1"
      : columns === 3
        ? "grid-cols-1 md:grid-cols-3"
        : columns === 4
          ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
          : "grid-cols-1 md:grid-cols-2";

  return <div className={cn("grid gap-4", gridClass)}>{children}</div>;
}

export function DsShowcaseRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}
