import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { marketingRadius } from "@/components/marketing/design-system/tokens/radius";
import { cn } from "@/lib/utils";

const marketingBadgeVariants = cva(
  ["inline-flex shrink-0 items-center font-medium", marketingRadius.full].join(
    " ",
  ),
  {
    variants: {
      variant: {
        default: "bg-slate-100 text-slate-600 ring-1 ring-slate-200/70",
        success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70",
        warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/70",
        danger: "bg-red-50 text-red-700 ring-1 ring-red-200/70",
        dark: "bg-slate-950 text-white ring-1 ring-slate-900",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-2.5 py-0.5 text-[11px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export type MarketingBadgeProps = VariantProps<typeof marketingBadgeVariants> & {
  children: ReactNode;
  className?: string;
};

export function MarketingBadge({
  children,
  variant,
  size,
  className,
}: MarketingBadgeProps) {
  return (
    <span className={cn(marketingBadgeVariants({ variant, size, className }))}>
      {children}
    </span>
  );
}

export { marketingBadgeVariants };

/** Convenience status badges used across industry/platform pages */
export function MarketingStatusBadge({
  status,
}: {
  status: "available" | "coming_soon" | "beta";
}) {
  const labels = {
    available: "Available",
    coming_soon: "Coming Soon",
    beta: "Beta",
  } as const;

  const variants = {
    available: "success",
    coming_soon: "default",
    beta: "warning",
  } as const;

  return (
    <MarketingBadge variant={variants[status]}>{labels[status]}</MarketingBadge>
  );
}
