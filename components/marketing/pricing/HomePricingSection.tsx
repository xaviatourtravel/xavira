"use client";

import Link from "next/link";
import { Check } from "lucide-react";

import { marketingButtonVariants } from "@/components/marketing/design-system/button";
import { MarketingSection, MarketingSectionHeader } from "@/components/marketing/design-system/sections";
import {
  MotionSectionGroup,
  MotionSectionItem,
  MotionStagger,
  MotionStaggerItem,
} from "@/components/marketing/motion";
import { useMarketingContent } from "@/components/marketing/marketing-locale-provider";
import { marketingRoutes } from "@/lib/marketing/routes";
import { cn } from "@/lib/utils";

const PLAN_LINKS = [marketingRoutes.register, marketingRoutes.contact, marketingRoutes.demo] as const;

const PLAN_HIGHLIGHTS = [
  ["Communication workspace", "Customer CRM", "Team collaboration"],
  ["Connected operations", "Finance tracking", "Workflow automation"],
  ["Multi-team setup", "Integrations", "Custom configuration"],
] as const;

export function HomePricingSection() {
  const { content } = useMarketingContent();

  return (
    <MarketingSection id="pricing" rhythm="large">
      <MotionSectionGroup viewport="small" minimal>
        <MotionSectionItem>
          <MarketingSectionHeader
            title={content.pricing.title}
            description={content.pricing.description}
          />
        </MotionSectionItem>
      </MotionSectionGroup>

      <MotionStagger className="mt-14 grid gap-6 lg:grid-cols-3 lg:gap-8" stagger="compact" viewport="small">
        {content.pricing.plans.map((plan, index) => (
          <MotionStaggerItem key={plan.name}>
            <article
              className={cn(
                "marketing-pricing-card flex h-full flex-col rounded-[var(--marketing-radius-xl)] bg-[var(--marketing-elevated-surface)] p-7 shadow-[var(--marketing-shadow-soft)] ring-1 ring-[var(--marketing-border-default)] sm:p-8",
                index === 1 && "lg:-translate-y-2 lg:shadow-[var(--marketing-shadow-float)] lg:ring-[var(--marketing-border-accent)]",
              )}
            >
              <h3 className="text-xl font-semibold text-[var(--marketing-foreground)]">
                {plan.name}
              </h3>
              <p className="mt-4 flex-1 text-base leading-relaxed text-[var(--marketing-muted)]">
                {plan.description}
              </p>

              <ul className="mt-6 space-y-2.5">
                {(PLAN_HIGHLIGHTS[index] ?? PLAN_HIGHLIGHTS[0]).map((highlight) => (
                  <li
                    key={highlight}
                    className="flex items-start gap-2.5 text-sm text-[var(--marketing-muted)]"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--marketing-primary)]" aria-hidden />
                    {highlight}
                  </li>
                ))}
              </ul>

              <Link
                href={PLAN_LINKS[index] ?? marketingRoutes.contact}
                className={cn(
                  marketingButtonVariants({
                    variant: index === 0 ? "primary" : "outline",
                    size: "lg",
                  }),
                  "mt-8 w-full",
                )}
              >
                {plan.cta}
              </Link>
            </article>
          </MotionStaggerItem>
        ))}
      </MotionStagger>

      <p className="mt-10 text-center text-sm text-[var(--marketing-muted-foreground)]">
        {content.pricing.disclaimer}
      </p>
    </MarketingSection>
  );
}
