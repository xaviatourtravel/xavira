"use client";

import { useMarketingContent } from '@/components/marketing/marketing-locale-provider';
import {
  MarketingSection,
  MarketingSectionHeader,
} from "@/components/marketing/marketing-section";
export function MarketingJourneySection() {
  const { content } = useMarketingContent();

  return (
    <MarketingSection tone="muted">
      <MarketingSectionHeader title={content.journey.title} />

      <ol className="relative mx-auto mt-14 max-w-3xl space-y-0">
        {content.journey.steps.map((step, index) => (
          <li key={step} className="relative flex gap-4 pb-8 last:pb-0">
            {index < content.journey.steps.length - 1 ? (
              <span
                aria-hidden
                className="absolute left-4 top-8 h-[calc(100%-1rem)] w-px bg-slate-200"
              />
            ) : null}

            <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
              {index + 1}
            </span>

            <div className="min-w-0 flex-1 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
              <p className="text-sm font-medium leading-relaxed text-slate-800">{step}</p>
            </div>
          </li>
        ))}
      </ol>
    </MarketingSection>
  );
}
