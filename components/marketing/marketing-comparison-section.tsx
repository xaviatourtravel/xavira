import { Check, X } from "lucide-react";

import {
  MarketingSection,
  MarketingSectionHeader,
} from "@/components/marketing/marketing-section";
import { marketingContent } from "@/lib/marketing/content";

export function MarketingComparisonSection() {
  return (
    <MarketingSection>
      <MarketingSectionHeader title={marketingContent.comparison.title} />

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl bg-slate-50/80 p-6 shadow-sm ring-1 ring-slate-200/70">
          <h3 className="text-lg font-semibold text-slate-900">
            {marketingContent.comparison.traditional.title}
          </h3>
          <ul className="mt-5 space-y-3">
            {marketingContent.comparison.traditional.items.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200">
                  <X className="h-3 w-3 text-slate-600" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-emerald-200/70">
          <h3 className="text-lg font-semibold text-slate-900">
            {marketingContent.comparison.desklabs.title}
          </h3>
          <ul className="mt-5 space-y-3">
            {marketingContent.comparison.desklabs.items.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <Check className="h-3 w-3 text-emerald-700" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </MarketingSection>
  );
}
