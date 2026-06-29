import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { designSystemTypography } from "@/lib/design-system/tokens";

type AccountPageShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function AccountPageShell({
  title,
  description,
  children,
  className,
}: AccountPageShellProps) {
  return (
    <div className={cn("mx-auto w-full max-w-3xl space-y-6 pb-10", className)}>
      <header className="space-y-2">
        <p className="text-sm font-medium text-slate-500">Akun</p>
        <h1 className={designSystemTypography.h2}>{title}</h1>
        {description ? (
          <p className={designSystemTypography.body}>{description}</p>
        ) : null}
      </header>
      {children}
    </div>
  );
}
