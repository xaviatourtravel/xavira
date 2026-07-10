import type { ReactNode } from "react";
import { Check, X } from "lucide-react";

import { MarketingComparisonCard } from "@/components/marketing/design-system/cards";
import { marketingGrid } from "@/components/marketing/design-system/tokens/grid";
import { cn } from "@/lib/utils";

type ComparisonColumn = {
  title: string;
  items: string[];
  tone?: "neutral" | "accent";
};

type MarketingComparisonBlockProps = {
  columns: [ComparisonColumn, ComparisonColumn];
  className?: string;
};

function ComparisonListItem({
  children,
  positive,
}: {
  children: ReactNode;
  positive: boolean;
}) {
  return (
    <li className="flex items-start gap-3 text-sm text-slate-700">
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
          positive
            ? "bg-[var(--marketing-success-background)]"
            : "bg-slate-200",
        )}
        aria-hidden
      >
        {positive ? (
          <Check className="h-3 w-3 text-[var(--marketing-success)]" />
        ) : (
          <X className="h-3 w-3 text-slate-600" />
        )}
      </span>
      {children}
    </li>
  );
}

/** Two-column comparison — table-style layout for platform/pricing pages */
export function MarketingComparisonBlock({
  columns,
  className,
}: MarketingComparisonBlockProps) {
  const [left, right] = columns;

  return (
    <div className={cn(marketingGrid.comparison, className)}>
      <MarketingComparisonCard
        title={left.title}
        tone={left.tone ?? "neutral"}
        items={left.items.map((item) => (
          <ComparisonListItem key={item} positive={false}>
            {item}
          </ComparisonListItem>
        ))}
      />
      <MarketingComparisonCard
        title={right.title}
        tone={right.tone ?? "accent"}
        items={right.items.map((item) => (
          <ComparisonListItem key={item} positive>
            {item}
          </ComparisonListItem>
        ))}
      />
    </div>
  );
}

/** Row-based comparison table for feature matrices (Pricing, API tiers) */
export type MarketingComparisonTableRow = {
  feature: string;
  left: ReactNode;
  right: ReactNode;
};

export function MarketingComparisonTable({
  leftHeader,
  rightHeader,
  rows,
  className,
}: {
  leftHeader: string;
  rightHeader: string;
  rows: MarketingComparisonTableRow[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70",
        className,
      )}
    >
      <div className="grid grid-cols-2 border-b border-slate-100 bg-slate-50/80">
        <div className="px-4 py-4 text-sm font-semibold text-slate-700 sm:px-6 sm:text-base">
          {leftHeader}
        </div>
        <div className="border-l border-slate-100 px-4 py-4 text-sm font-semibold text-slate-950 sm:px-6 sm:text-base">
          {rightHeader}
        </div>
      </div>
      {rows.map((row) => (
        <div
          key={row.feature}
          className="grid grid-cols-2 border-b border-slate-100 last:border-b-0"
        >
          <div className="px-4 py-4 sm:px-6">
            <p className="text-sm font-medium text-slate-900">{row.feature}</p>
            <div className="mt-1 text-sm text-slate-600">{row.left}</div>
          </div>
          <div className="border-l border-slate-100 bg-[var(--marketing-primary-muted)]/30 px-4 py-4 sm:px-6">
            <p className="sr-only">{row.feature}</p>
            <div className="text-sm text-slate-800">{row.right}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
