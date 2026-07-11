"use client";

import { MarketingSection, MarketingSectionHeader } from "@/components/marketing/design-system/sections";
import { marketingColorClasses } from "@/components/marketing/design-system/tokens/colors";
import { MotionSectionGroup, MotionSectionItem } from "@/components/marketing/motion";
import { useMarketingContent } from "@/components/marketing/marketing-locale-provider";
import { cn } from "@/lib/utils";

export function MarketingFaqSection() {
  const { content } = useMarketingContent();

  return (
    <MarketingSection id="faq" tone="muted" rhythm="compact">
      <MotionSectionGroup minimal viewport="small">
        <MotionSectionItem>
          <MarketingSectionHeader title={content.faq.title} />
        </MotionSectionItem>
      </MotionSectionGroup>

      <div
        className={cn(
          "mx-auto mt-12 divide-y divide-[var(--marketing-border-default)] rounded-[var(--marketing-radius-xl)] bg-[var(--marketing-elevated-surface)] ring-1 ring-[var(--marketing-border-default)]",
          marketingColorClasses.faqShell,
        )}
      >
        {content.faq.items.map((item) => (
          <details key={item.question} className="group px-6 py-1 sm:px-8">
            <summary
              className={cn(
                "flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-5 text-left text-base font-semibold text-[var(--marketing-foreground)] sm:text-lg",
                marketingColorClasses.focusRing,
                "[&::-webkit-details-marker]:hidden",
              )}
            >
              {item.question}
              <span
                className="shrink-0 text-xl text-[var(--marketing-muted-foreground)] transition-transform duration-[var(--marketing-duration-fast)] ease-[var(--marketing-ease-standard)] group-open:rotate-45"
                aria-hidden
              >
                +
              </span>
            </summary>
            <p className="pb-5 text-sm leading-relaxed text-[var(--marketing-muted)] sm:text-base sm:leading-relaxed">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </MarketingSection>
  );
}
