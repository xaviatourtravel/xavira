"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { marketingButtonVariants } from "@/components/marketing/design-system/button";
import { MarketingSection } from "@/components/marketing/design-system/sections";
import { marketingColorClasses } from "@/components/marketing/design-system/tokens/colors";
import { MarketingH2 } from "@/components/marketing/design-system/typography";
import {
  MotionSectionGroup,
  MotionSectionItem,
} from "@/components/marketing/motion";
import { useMarketingContent } from "@/components/marketing/marketing-locale-provider";
import { marketingRoutes } from "@/lib/marketing/routes";
import { cn } from "@/lib/utils";

export function FinalCtaSection() {
  const { content } = useMarketingContent();

  return (
    <MarketingSection
      tone="dark"
      rhythm="none"
      className={cn("relative overflow-hidden", marketingColorClasses.finalCta)}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 opacity-90",
          marketingColorClasses.darkBandGlow,
        )}
      />

      <MotionSectionGroup className="relative mx-auto w-full max-w-3xl text-center" minimal viewport="large">
        <MotionSectionItem>
          <MarketingH2>{content.finalCta.title}</MarketingH2>
        </MotionSectionItem>
        <MotionSectionItem>
          <p className="mt-5 text-lg leading-relaxed marketing-on-dark-muted">
            {content.finalCta.description}
          </p>
        </MotionSectionItem>
        <MotionSectionItem>
          <p className="mt-4 text-sm marketing-on-dark-muted">{content.finalCta.reassurance}</p>
        </MotionSectionItem>
        <MotionSectionItem>
          <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:justify-center">
            <Link
              href={marketingRoutes.register}
              className={cn(
                marketingButtonVariants({ size: "lg", onDark: true }),
                "w-full sm:w-auto",
              )}
            >
              {content.finalCta.primaryCta}
              <ArrowRight className="marketing-btn-arrow h-4 w-4" aria-hidden />
            </Link>
            <Link
              href={marketingRoutes.demo}
              className={cn(
                marketingButtonVariants({ variant: "outline", size: "lg", onDark: true }),
                "w-full sm:w-auto",
              )}
            >
              {content.finalCta.secondaryCta}
            </Link>
          </div>
        </MotionSectionItem>
      </MotionSectionGroup>
    </MarketingSection>
  );
}
