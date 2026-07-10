"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { marketingButtonVariants } from "@/components/marketing/design-system/button";
import {
  marketingContainerClass,
  marketingSpacing,
} from "@/components/marketing/design-system/tokens/spacing";
import {
  MarketingBodyLarge,
  MarketingCaption,
  MarketingEyebrow,
  MarketingH1,
} from "@/components/marketing/design-system/typography";
import { HeroWorkspaceScene } from "@/components/marketing/shared/HeroWorkspaceScene";
import { useMarketingContent } from "@/components/marketing/marketing-locale-provider";
import { marketingRoutes } from "@/lib/marketing/routes";
import { cn } from "@/lib/utils";

export function HomeHeroSection() {
  const { content } = useMarketingContent();

  return (
    <section className={cn(marketingSpacing.hero.className, marketingSpacing.scrollMargin)}>
      <div
        className={cn(
          marketingContainerClass,
          "grid items-center gap-10 lg:grid-cols-[0.44fr_0.56fr] lg:gap-12 xl:gap-16",
        )}
      >
        <div className={cn("min-w-0", marketingSpacing.maxWidth.proseNarrow)}>
          <MarketingEyebrow>{content.hero.eyebrow}</MarketingEyebrow>
          <MarketingH1 className="mt-5 sm:mt-6">{content.hero.headline}</MarketingH1>
          <MarketingBodyLarge className="mt-5 sm:mt-6">{content.hero.subheadline}</MarketingBodyLarge>

          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Link
              href={marketingRoutes.register}
              className={cn(marketingButtonVariants({ size: "lg" }), "w-full sm:w-auto")}
            >
              {content.hero.primaryCta}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href={marketingRoutes.demo}
              className={cn(
                marketingButtonVariants({ variant: "outline", size: "lg" }),
                "w-full sm:w-auto",
              )}
            >
              {content.hero.secondaryCta}
            </Link>
          </div>

          <MarketingCaption className="mt-5">{content.hero.microcopy}</MarketingCaption>
        </div>

        <HeroWorkspaceScene className="lg:scale-[1.02] lg:origin-left" />
      </div>
    </section>
  );
}
