import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { designSystemPanelClass } from "@/lib/design-system/tokens";

type AccountCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function AccountCard({
  title,
  description,
  children,
  className,
}: AccountCardProps) {
  return (
    <section className={cn(designSystemPanelClass, "p-5 sm:p-6", className)}>
      <div className="mb-4 space-y-1">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {description ? (
          <p className="text-sm leading-relaxed text-slate-500">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
