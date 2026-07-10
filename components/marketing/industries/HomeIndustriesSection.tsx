"use client";

import Link from "next/link";

import { marketingColorClasses } from "@/components/marketing/design-system/tokens/colors";
import { MarketingSection, MarketingSectionHeader } from "@/components/marketing/design-system/sections";
import { MarketingH3 } from "@/components/marketing/design-system/typography";
import { IndustryUiPreview } from "@/components/marketing/shared/IndustryUiPreview";
import { useMarketingContent } from "@/components/marketing/marketing-locale-provider";
import { marketingRoutes } from "@/lib/marketing/routes";
import { cn } from "@/lib/utils";

const GRID_SPANS = [
  "lg:col-span-1",
  "lg:col-span-1",
  "lg:col-span-1",
  "lg:col-span-2",
  "lg:col-span-1",
] as const;

export function HomeIndustriesSection() {
  const { content } = useMarketingContent();

  return (
    <MarketingSection id="industries" rhythm="large">
      <MarketingSectionHeader
        title={content.industries.title}
        description={content.industries.description}
      />

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {content.industries.items.map((industry, index) => (
          <article
            key={industry.id}
            className={cn(
              "flex h-full flex-col rounded-[var(--marketing-radius-xl)] bg-[var(--marketing-elevated-surface)] p-6 shadow-[var(--marketing-shadow-soft)] ring-1 ring-[var(--marketing-border-default)] sm:p-7",
              GRID_SPANS[index] ?? "",
              index >= 3 && "lg:flex-row lg:items-stretch lg:gap-6",
            )}
          >
            <div className={cn("min-w-0", index >= 3 && "lg:flex-1")}>
              <div className="flex items-start justify-between gap-3">
                <MarketingH3 as="h3">{industry.name}</MarketingH3>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium",
                    industry.status === "available"
                      ? marketingColorClasses.statusAvailable
                      : "bg-[var(--marketing-surface-muted)] text-[var(--marketing-muted)] ring-1 ring-[var(--marketing-border-default)]",
                  )}
                >
                  {industry.status === "available" ? "Available" : "Coming Soon"}
                </span>
              </div>

              <p className="mt-3 text-base leading-relaxed text-[var(--marketing-muted)]">
                {industry.description}
              </p>

              <p className="mt-3 text-sm font-medium text-[var(--marketing-muted-foreground)]">
                {industry.workflow}
              </p>
            </div>

            <div className={cn("mt-5", index >= 3 ? "lg:mt-0 lg:flex-1" : "")}>
              <IndustryUiPreview industryId={industry.id} size="large" />
            </div>
          </article>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link href={marketingRoutes.solutions} className={marketingColorClasses.link}>
          {content.industries.cta} →
        </Link>
      </div>
    </MarketingSection>
  );
}
