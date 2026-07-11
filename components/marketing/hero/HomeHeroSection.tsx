"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { m, useReducedMotion } from "framer-motion";

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
import {
  HeroMotionContext,
  heroSceneEnterVariants,
  motionTransition,
} from "@/components/marketing/motion";
import { HeroWorkspaceScene } from "@/components/marketing/product-scenes";
import { useMarketingContent } from "@/components/marketing/marketing-locale-provider";
import { marketingRoutes } from "@/lib/marketing/routes";
import { marketingMotionDurations } from "@/components/marketing/motion/motion-tokens";
import { cn } from "@/lib/utils";

export function HomeHeroSection() {
  const { content } = useMarketingContent();
  const reducedMotion = useReducedMotion();

  return (
    <HeroMotionContext.Provider
      value={{ active: true, reducedMotion: Boolean(reducedMotion) }}
    >
      <section className={cn(marketingSpacing.hero.className, marketingSpacing.scrollMargin)}>
        <div
          className={cn(
            marketingContainerClass,
            "grid items-center gap-10 lg:grid-cols-[0.47fr_0.53fr] lg:gap-12 xl:gap-14",
          )}
        >
          {/* LCP copy — always visible in SSR/hydration; no opacity-0 initial state */}
          <div className="min-w-0 lg:max-w-none">
            <MarketingEyebrow>{content.hero.eyebrow}</MarketingEyebrow>
            <MarketingH1 className="marketing-hero-headline mt-5 sm:mt-6">
              {content.hero.headline}
            </MarketingH1>
            <MarketingBodyLarge className="mt-5 max-w-xl sm:mt-6">
              {content.hero.subheadline}
            </MarketingBodyLarge>
            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <Link
                href={marketingRoutes.register}
                className={cn(marketingButtonVariants({ size: "lg" }), "w-full sm:w-auto")}
              >
                {content.hero.primaryCta}
                <ArrowRight className="marketing-btn-arrow h-4 w-4" aria-hidden />
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

          {reducedMotion ? (
            <HeroWorkspaceScene className="lg:min-h-[540px]" />
          ) : (
            <m.div
              className="min-w-0"
              variants={heroSceneEnterVariants}
              initial="hidden"
              animate="visible"
              transition={motionTransition(marketingMotionDurations.scene, 60)}
            >
              <HeroWorkspaceScene className="lg:min-h-[540px]" />
            </m.div>
          )}
        </div>
      </section>
    </HeroMotionContext.Provider>
  );
}
