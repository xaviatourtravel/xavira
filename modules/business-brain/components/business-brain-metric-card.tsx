"use client";

import Link from "next/link";

import { useBusinessBrainWorkspaceOptional } from "@/modules/business-brain/components/business-brain-workspace-context";
import { designSystemPanelClass } from "@/lib/design-system/tokens";
import type { BusinessBrainMetricCard } from "@/modules/business-brain/types";
import { sectionSlugFromHref } from "@/modules/business-brain/types/business-brain-workspace";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type BusinessBrainMetricCardViewProps = {
  card: BusinessBrainMetricCard;
  icon: LucideIcon;
};

function MetricCardCta({ href, label }: { href: string; label: string }) {
  const workspace = useBusinessBrainWorkspaceOptional();
  const slug = sectionSlugFromHref(href);

  if (workspace && slug) {
    return (
      <button
        type="button"
        onClick={() => workspace.navigate(slug)}
        className="inline-flex text-sm font-medium text-primary hover:underline"
      >
        {label}
      </button>
    );
  }

  return (
    <Link href={href} className="inline-flex text-sm font-medium text-primary hover:underline">
      {label}
    </Link>
  );
}

export function BusinessBrainMetricCardView({
  card,
  icon: Icon,
}: BusinessBrainMetricCardViewProps) {
  const showProgress =
    typeof card.progressPercent === "number" && card.progressPercent > 0;

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
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Status
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {card.statusLabel}
          </p>
        </div>

        {showProgress ? (
          <div className="space-y-1.5">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${card.progressPercent}%` }}
              />
            </div>
          </div>
        ) : null}

        <MetricCardCta href={card.ctaHref} label={card.ctaLabel} />
      </div>
    </article>
  );
}
