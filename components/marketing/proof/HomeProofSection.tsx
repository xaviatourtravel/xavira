"use client";

import { Check, X } from "lucide-react";

import { MarketingSection, MarketingSectionHeader } from "@/components/marketing/design-system/sections";
import { ComparisonWorkspaceScene } from "@/components/marketing/product-scenes";
import { useMarketingContent } from "@/components/marketing/marketing-locale-provider";

export function HomeProofSection() {
  const { content } = useMarketingContent();

  return (
    <MarketingSection tone="muted" rhythm="large">
      <MarketingSectionHeader title={content.proof.title} />

      <div className="mt-14 grid items-stretch gap-8 lg:grid-cols-2 lg:gap-10">
        <article className="flex flex-col rounded-[var(--marketing-radius-xl)] bg-[var(--marketing-surface-muted)] p-7 ring-1 ring-[var(--marketing-border-default)] sm:p-8">
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

        <article className="flex flex-col rounded-[var(--marketing-radius-xl)] bg-[var(--marketing-elevated-surface)] p-7 shadow-[var(--marketing-shadow-soft)] ring-1 ring-[var(--marketing-border-accent)] sm:p-8">
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
      </div>

      <ComparisonWorkspaceScene className="mt-8" />

      <ul className="mt-10 flex flex-wrap justify-center gap-3">
        {content.proof.outcomes.map((outcome) => (
          <li
            key={outcome}
            className="marketing-industry-label px-5 py-2.5 text-sm text-[var(--marketing-muted)]"
          >
            {outcome}
          </li>
        ))}
      </ul>
    </MarketingSection>
  );
}
