"use client";

import { useMarketingContent } from '@/components/marketing/marketing-locale-provider';
import {
  MarketingSection,
  MarketingSectionHeader,
} from "@/components/marketing/marketing-section";
export function MarketingTrustSection() {
  const { content } = useMarketingContent();

  return (
    <MarketingSection id="resources" tone="muted">
      <MarketingSectionHeader
        title={content.trust.title}
        description={content.trust.copy}
      />

      <div className="mt-14 grid gap-4 sm:grid-cols-2">
        {content.trust.highlights.map((item) => (
          <article
            key={item.title}
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70"
          >
            <h3 className="text-base font-semibold text-slate-950">{item.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {item.description}
            </p>
          </article>
        ))}
      </div>
    </MarketingSection>
  );
}
