import { ArrowRight, Mail, Sheet, XCircle } from "lucide-react";

import {
  MarketingSection,
  MarketingSectionHeader,
} from "@/components/marketing/marketing-section";
import { marketingContent } from "@/lib/marketing/content";

const SOURCE_ICONS = {
  WhatsApp: "WA",
  Instagram: "IG",
  Facebook: "FB",
  Spreadsheet: "XL",
  Email: "EM",
};

export function MarketingProblemSection() {
  return (
    <MarketingSection tone="muted">
      <MarketingSectionHeader
        title={marketingContent.problem.title}
        description={marketingContent.problem.copy}
      />

      <div className="mx-auto mt-12 max-w-4xl">
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
          {marketingContent.problem.sources.map((source) => (
            <div
              key={source}
              className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200/70 sm:px-4"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                {SOURCE_ICONS[source as keyof typeof SOURCE_ICONS]}
              </span>
              {source}
            </div>
          ))}
        </div>

        <div className="my-8 flex justify-center" aria-hidden>
          <ArrowRight className="h-6 w-6 rotate-90 text-slate-400 sm:rotate-0" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {marketingContent.problem.outcomes.map((outcome) => (
            <div
              key={outcome.label}
              className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-slate-200/70"
            >
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                {outcome.label.includes("tersebar") ? (
                  <Sheet className="h-5 w-5 text-slate-600" />
                ) : outcome.label.includes("terlewat") ? (
                  <Mail className="h-5 w-5 text-slate-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900">{outcome.label}</p>
            </div>
          ))}
        </div>
      </div>
    </MarketingSection>
  );
}
