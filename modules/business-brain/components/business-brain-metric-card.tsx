import type { LucideIcon } from "lucide-react";

import { DsCardPlaceholder } from "@/components/design-system";
import { designSystemPanelClass } from "@/lib/design-system/tokens";
import type { BusinessBrainMetricCard } from "@/modules/business-brain/types";
import { cn } from "@/lib/utils";

type BusinessBrainMetricCardViewProps = {
  card: BusinessBrainMetricCard;
  icon: LucideIcon;
};

export function BusinessBrainMetricCardView({
  card,
  icon: Icon,
}: BusinessBrainMetricCardViewProps) {
  return (
    <article
      className={cn(
        designSystemPanelClass,
        "flex h-full flex-col p-5 transition-colors hover:border-border/80",
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">{card.title}</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {card.description}
          </p>
        </div>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15 dark:bg-primary/20 dark:ring-primary/25">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>

      <div className="mt-auto space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Status
        </p>
        <p className="text-sm font-medium text-foreground">{card.statusLabel}</p>
        <DsCardPlaceholder className="h-16 rounded-xl" />
      </div>
    </article>
  );
}
