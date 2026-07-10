"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { marketingButtonVariants } from "@/components/marketing/design-system/button";
import { MarketingSection } from "@/components/marketing/design-system/sections";
import { marketingColorClasses } from "@/components/marketing/design-system/tokens/colors";
import { MarketingBodyLarge, MarketingH2 } from "@/components/marketing/design-system/typography";
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

      <div className="relative mx-auto max-w-3xl text-center">
        <MarketingH2 className="text-[var(--marketing-background)]">{content.finalCta.title}</MarketingH2>
        <MarketingBodyLarge className="mt-5 text-[var(--marketing-muted-foreground)]">
          {content.finalCta.description}
        </MarketingBodyLarge>
        <p className="mt-4 text-sm text-[var(--marketing-muted-foreground)]">
          {content.finalCta.reassurance}
        </p>

        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:justify-center">
          <Link
            href={marketingRoutes.register}
            className={cn(
              marketingButtonVariants({ size: "lg", onDark: true }),
              "w-full sm:w-auto",
            )}
          >
            {content.finalCta.primaryCta}
            <ArrowRight className="h-4 w-4" aria-hidden />
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
      </div>
    </MarketingSection>
  );
}
