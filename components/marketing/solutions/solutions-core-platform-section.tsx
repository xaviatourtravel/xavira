import { ArrowRight } from "lucide-react";

import {
  MarketingSection,
  MarketingSectionHeader,
} from "@/components/marketing/marketing-section";
import {
  corePlatformLayers,
  industryPackLabels,
} from "@/lib/marketing/solutions-content";
import { cn } from "@/lib/utils";

export function SolutionsCorePlatformSection() {
  return (
    <MarketingSection tone="muted">
      <MarketingSectionHeader
        title="Satu core platform. Banyak cara kerja."
        description="Industry packs menambahkan workflow dan terminologi yang relevan. Core platform tetap sama untuk semua tim."
      />

      <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[var(--marketing-border-default)]">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
            Core Platform
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {corePlatformLayers.map((layer) => (
              <li
                key={layer}
                className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 ring-1 ring-slate-200/60"
              >
                {layer}
              </li>
            ))}
          </ul>
        </div>

        <div
          className="hidden flex-col items-center gap-1 text-slate-400 lg:flex"
          aria-hidden
        >
          <span className="text-xs font-medium uppercase tracking-wider">powers</span>
          <ArrowRight className="h-5 w-5" />
        </div>

        <div className="rounded-2xl bg-[linear-gradient(to_bottom,var(--marketing-background),var(--marketing-primary-muted))] p-6 shadow-sm ring-1 ring-[var(--marketing-border-accent)]">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--marketing-primary)]">
            Industry Packs
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {industryPackLabels.map((pack, index) => (
              <li
                key={pack}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium ring-1",
                  index === 0
                    ? "bg-[var(--marketing-primary)] text-white ring-[var(--marketing-primary-hover)]"
                    : "bg-white text-slate-800 ring-slate-200/70",
                )}
              >
                {pack}
                {index === 0 ? (
                  <span className="ml-2 text-[10px] font-normal text-white/80">
                    Available
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </MarketingSection>
  );
}
