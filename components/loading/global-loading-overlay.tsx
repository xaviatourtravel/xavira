"use client";

import { DesklabsSpinner } from "@/components/ui/desklabs-loading";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

type GlobalLoadingOverlayProps = {
  active: boolean;
};

export function GlobalLoadingOverlay({ active }: GlobalLoadingOverlayProps) {
  const { tStrict } = useTranslation();
  if (!active) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      aria-busy="true"
      aria-label={tStrict("common.loading")}
      className={cn(
        "fixed inset-0 z-[80] flex items-center justify-center",
        "bg-neutral-950/30 dark:bg-black/45",
        "backdrop-blur-[2px] motion-reduce:backdrop-blur-none",
        "pointer-events-auto",
      )}
    >
      <DesklabsSpinner
        size="sm"
        label={tStrict("common.loading")}
        className="h-5 w-5 border-white/30 border-t-white"
      />
    </div>
  );
}
