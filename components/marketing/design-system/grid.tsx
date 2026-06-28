import type { ReactNode } from "react";

import { marketingGrid } from "@/components/marketing/design-system/tokens/grid";
import { cn } from "@/lib/utils";

type MarketingGridProps = {
  children: ReactNode;
  variant?: keyof typeof marketingGrid;
  className?: string;
};

export function MarketingGrid({
  children,
  variant = "cards",
  className,
}: MarketingGridProps) {
  return <div className={cn(marketingGrid[variant], className)}>{children}</div>;
}

export function MarketingSplit({
  children,
  reverse = false,
  className,
}: {
  children: ReactNode;
  reverse?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        marketingGrid.split,
        reverse && "lg:[&>*:first-child]:order-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
