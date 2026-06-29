import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  designSystemCardSizes,
  designSystemPanelClass,
} from "@/lib/design-system/tokens";

type DsCardProps = {
  size?: keyof typeof designSystemCardSizes;
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
};

export function DsCard({
  size = "md",
  title,
  description,
  children,
  className,
}: DsCardProps) {
  return (
    <div className={cn(designSystemPanelClass, designSystemCardSizes[size], className)}>
      {title ? (
        <div className="mb-4 space-y-1">
          <h3 className="text-base font-semibold text-slate-950">{title}</h3>
          {description ? (
            <p className="text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
