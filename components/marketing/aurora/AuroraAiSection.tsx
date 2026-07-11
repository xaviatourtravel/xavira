"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { marketingButtonVariants } from "@/components/marketing/design-system/button";
import { MarketingSection } from "@/components/marketing/design-system/sections";
import { MarketingBodyLarge, MarketingEyebrow, MarketingH2 } from "@/components/marketing/design-system/typography";
import {
  MotionScene,
  MotionSectionGroup,
  MotionSectionItem,
} from "@/components/marketing/motion";
import { AuroraAssistScene } from "@/components/marketing/product-scenes";
import { useMarketingContent } from "@/components/marketing/marketing-locale-provider";
import { marketingRoutes } from "@/lib/marketing/routes";
import { cn } from "@/lib/utils";

export function AuroraAiSection() {
  const { content } = useMarketingContent();

  return (
    <MarketingSection id="aurora" tone="muted" rhythm="large">
      <div className="grid items-center gap-12 lg:grid-cols-[0.4fr_0.6fr] lg:gap-16 xl:gap-20">
        <MotionSectionGroup className="min-w-0 lg:py-4">
          <MotionSectionItem>
            <MarketingEyebrow>{content.aurora.eyebrow}</MarketingEyebrow>
          </MotionSectionItem>
          <MotionSectionItem>
            <MarketingH2 className="mt-4">{content.aurora.title}</MarketingH2>
          </MotionSectionItem>
          <MotionSectionItem>
            <MarketingBodyLarge className="mt-5">{content.aurora.description}</MarketingBodyLarge>
          </MotionSectionItem>
          <MotionSectionItem>
            <p className="mt-4 text-sm font-medium text-[var(--marketing-muted-foreground)]">
              {content.aurora.reassurance}
            </p>
          </MotionSectionItem>
          <MotionSectionItem>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {content.aurora.capabilities.map((capability) => (
                <li
                  key={capability}
                  className="flex items-start gap-2.5 text-sm text-[var(--marketing-muted)]"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--marketing-primary)]" aria-hidden />
                  {capability}
                </li>
              ))}
            </ul>
          </MotionSectionItem>
          <MotionSectionItem>
            <Link
              href={marketingRoutes.demo}
              className={cn(marketingButtonVariants({ variant: "outline", size: "lg" }), "mt-10")}
            >
              {content.aurora.cta}
              <ArrowRight className="marketing-btn-arrow h-4 w-4" aria-hidden />
            </Link>
          </MotionSectionItem>
        </MotionSectionGroup>

        <MotionScene>
          <AuroraAssistScene />
        </MotionScene>
      </div>
    </MarketingSection>
  );
}
