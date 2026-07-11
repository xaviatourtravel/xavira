"use client";

import { Check, X } from "lucide-react";

import { MarketingSection, MarketingSectionHeader } from "@/components/marketing/design-system/sections";
import {
  MotionReveal,
  MotionScene,
  MotionSectionGroup,
  MotionSectionItem,
  MotionStagger,
  MotionStaggerItem,
} from "@/components/marketing/motion";
import { ComparisonWorkspaceScene } from "@/components/marketing/product-scenes";
import { useMarketingContent } from "@/components/marketing/marketing-locale-provider";

export function HomeProofSection() {
  const { content } = useMarketingContent();

  return (
    <MarketingSection tone="muted" rhythm="large">
      <MotionSectionGroup viewport="default">
        <MotionSectionItem>
          <MarketingSectionHeader title={content.proof.title} />
        </MotionSectionItem>
      </MotionSectionGroup>

      <div className="mt-14 grid items-stretch gap-8 lg:grid-cols-2 lg:gap-10">
        <MotionReveal direction="left" viewport="default">
          <article className="flex h-full flex-col rounded-[var(--marketing-radius-xl)] bg-[var(--marketing-surface-muted)] p-7 ring-1 ring-[var(--marketing-border-default)] sm:p-8">
            <h3 className="text-xl font-semibold text-[var(--marketing-foreground)]">
              {content.proof.disconnected.title}
            </h3>
            <ul className="mt-8 space-y-3">
              {content.proof.disconnected.items.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-[var(--marketing-muted)] sm:text-base">
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--marketing-border-default)]"
                    aria-hidden
                  >
                    <X className="h-3.5 w-3.5 text-[var(--marketing-muted-foreground)]" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </MotionReveal>

        <MotionReveal direction="right" delay={60} viewport="default">
          <article className="flex h-full flex-col rounded-[var(--marketing-radius-xl)] bg-[var(--marketing-elevated-surface)] p-7 shadow-[var(--marketing-shadow-soft)] ring-1 ring-[var(--marketing-border-accent)] sm:p-8">
            <h3 className="text-xl font-semibold text-[var(--marketing-foreground)]">
              {content.proof.desklabs.title}
            </h3>
            <ul className="mt-8 space-y-3">
              {content.proof.desklabs.items.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-[var(--marketing-muted)] sm:text-base">
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--marketing-primary-muted)]"
                    aria-hidden
                  >
                    <Check className="h-3.5 w-3.5 text-[var(--marketing-primary)]" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </MotionReveal>
      </div>

      <MotionScene className="mt-8">
        <ComparisonWorkspaceScene />
      </MotionScene>

      <MotionStagger className="mt-10 flex flex-wrap justify-center gap-3" stagger="compact" viewport="small">
        {content.proof.outcomes.map((outcome) => (
          <MotionStaggerItem key={outcome}>
            <span className="marketing-industry-label inline-flex px-5 py-2.5 text-sm text-[var(--marketing-muted)]">
              {outcome}
            </span>
          </MotionStaggerItem>
        ))}
      </MotionStagger>
    </MarketingSection>
  );
}
