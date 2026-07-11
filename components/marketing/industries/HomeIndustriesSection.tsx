"use client";

import Link from "next/link";

import { marketingColorClasses } from "@/components/marketing/design-system/tokens/colors";
import { MarketingSection, MarketingSectionHeader } from "@/components/marketing/design-system/sections";
import { MarketingH3 } from "@/components/marketing/design-system/typography";
import {
  MotionSectionGroup,
  MotionSectionItem,
  MotionStagger,
  MotionStaggerItem,
} from "@/components/marketing/motion";
import { IndustryScene } from "@/components/marketing/product-scenes";
import { useMarketingContent } from "@/components/marketing/marketing-locale-provider";
import { marketingRoutes } from "@/lib/marketing/routes";
import { cn } from "@/lib/utils";

export function HomeIndustriesSection() {
  const { content } = useMarketingContent();
  const firstRow = content.industries.items.slice(0, 3);
  const secondRow = content.industries.items.slice(3);

  return (
    <MarketingSection id="industries" rhythm="large">
      <MotionSectionGroup>
        <MotionSectionItem>
          <MarketingSectionHeader
            title={content.industries.title}
            description={content.industries.description}
          />
        </MotionSectionItem>
      </MotionSectionGroup>

      <MotionStagger className="mt-14 grid gap-5 lg:grid-cols-3 lg:gap-6" stagger="compact">
        {firstRow.map((industry) => (
          <MotionStaggerItem key={industry.id}>
            <article className="marketing-card-hover flex h-full flex-col rounded-[var(--marketing-radius-xl)] bg-[var(--marketing-elevated-surface)] p-6 shadow-[var(--marketing-shadow-soft)] ring-1 ring-[var(--marketing-border-default)] sm:p-7">
              <IndustryCardContent industry={industry} />
              <div className="mt-5 flex-1">
                <IndustryScene industryId={industry.id} size="large" />
              </div>
            </article>
          </MotionStaggerItem>
        ))}
      </MotionStagger>

      <MotionStagger className="mt-5 grid gap-5 lg:grid-cols-2 lg:gap-6" stagger="compact" delayChildren={60}>
        {secondRow.map((industry) => (
          <MotionStaggerItem key={industry.id}>
            <article className="marketing-card-hover grid h-full gap-5 rounded-[var(--marketing-radius-xl)] bg-[var(--marketing-elevated-surface)] p-6 shadow-[var(--marketing-shadow-soft)] ring-1 ring-[var(--marketing-border-default)] sm:p-7 lg:grid-cols-2 lg:items-stretch">
              <IndustryCardContent industry={industry} />
              <div className="min-h-[200px]">
                <IndustryScene industryId={industry.id} size="large" className="h-full" />
              </div>
            </article>
          </MotionStaggerItem>
        ))}
      </MotionStagger>

      <div className="mt-12 text-center">
        <Link href={marketingRoutes.solutions} className={marketingColorClasses.link}>
          {content.industries.cta} →
        </Link>
      </div>
    </MarketingSection>
  );
}

function IndustryCardContent({
  industry,
}: {
  industry: {
    id: string;
    name: string;
    description: string;
    workflow: string;
    status: "available" | "coming_soon";
  };
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-start justify-between gap-3">
        <MarketingH3 as="h3">{industry.name}</MarketingH3>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium",
            industry.status === "available"
              ? "bg-[var(--marketing-primary-muted)] text-[var(--marketing-primary-muted-foreground)]"
              : "bg-[var(--marketing-surface-muted)] text-[var(--marketing-muted-foreground)]",
          )}
        >
          {industry.status === "available" ? "Available" : "Coming soon"}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[var(--marketing-muted)] sm:text-base">
        {industry.description}
      </p>
      <p className="mt-3 text-xs font-medium text-[var(--marketing-muted-foreground)]">
        {industry.workflow}
      </p>
    </div>
  );
}
