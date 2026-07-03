import type { ReactNode } from "react";

import { BusinessBrainNav } from "@/modules/business-brain/components/business-brain-nav";

type BusinessBrainLayoutShellProps = {
  children: ReactNode;
};

export function BusinessBrainLayoutShell({
  children,
}: BusinessBrainLayoutShellProps) {
  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-0">
      <header className="space-y-4 border-b border-border pb-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-lg ring-1 ring-primary/15 dark:bg-primary/20">
            🧠
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Business Brain
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Teach your business. Let AI do the rest.
            </p>
          </div>
        </div>
        <BusinessBrainNav />
      </header>
      <div className="pt-6">{children}</div>
    </div>
  );
}
