import { Check, X } from "lucide-react";

import {
  MarketingSection,
  MarketingSectionHeader,
} from "@/components/marketing/marketing-section";
import { platformComparison } from "@/lib/marketing/platform-content";

export function PlatformComparisonSection() {
  const rowCount = Math.max(
    platformComparison.traditional.items.length,
    platformComparison.desklabs.items.length,
  );

  return (
    <MarketingSection tone="muted">
      <MarketingSectionHeader
        eyebrow="Why Desklabs"
        title="Traditional software vs Desklabs Platform"
        description="Perbedaan bukan hanya fitur—melainkan bagaimana pekerjaan operasional customer benar-benar berjalan."
      />

      <div className="mt-12 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
        <div className="grid grid-cols-2 border-b border-slate-100 bg-slate-50/80">
          <div className="px-4 py-4 text-sm font-semibold text-slate-700 sm:px-6 sm:text-base">
            {platformComparison.traditional.title}
          </div>
          <div className="border-l border-slate-100 px-4 py-4 text-sm font-semibold text-slate-950 sm:px-6 sm:text-base">
            {platformComparison.desklabs.title}
          </div>
        </div>

        {Array.from({ length: rowCount }).map((_, index) => {
          const traditional = platformComparison.traditional.items[index];
          const desklabs = platformComparison.desklabs.items[index];

          return (
            <div
              key={index}
              className="grid grid-cols-2 border-b border-slate-100 last:border-b-0"
            >
              <div className="flex items-start gap-3 px-4 py-4 sm:px-6">
                {traditional ? (
                  <>
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100">
                      <X className="h-3 w-3 text-slate-500" />
                    </span>
                    <span className="text-sm text-slate-600">{traditional}</span>
                  </>
                ) : null}
              </div>
              <div className="flex items-start gap-3 border-l border-slate-100 bg-emerald-50/20 px-4 py-4 sm:px-6">
                {desklabs ? (
                  <>
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <Check className="h-3 w-3 text-emerald-700" />
                    </span>
                    <span className="text-sm text-slate-800">{desklabs}</span>
                  </>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </MarketingSection>
  );
}
