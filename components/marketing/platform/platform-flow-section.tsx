import { ArrowDown } from "lucide-react";

import {
  MarketingSection,
  MarketingSectionHeader,
} from "@/components/marketing/marketing-section";
import { platformFlowSteps } from "@/lib/marketing/platform-content";
import { cn } from "@/lib/utils";

export function PlatformFlowSection() {
  return (
    <MarketingSection tone="muted">
      <MarketingSectionHeader
        eyebrow="Connected workflow"
        title="Satu alur dari percakapan hingga pertumbuhan"
        description="Setiap modul Desklabs dirancang untuk saling terhubung—bukan berdiri sendiri."
      />

      <div className="mx-auto mt-12 max-w-3xl">
        <div className="flex flex-col items-center">
          {platformFlowSteps.map((step, index) => (
            <div key={step.id} className="flex w-full max-w-md flex-col items-center">
              <article
                className={cn(
                  "w-full rounded-2xl bg-white px-6 py-4 text-center shadow-sm ring-1 ring-slate-200/70 transition-all hover:-translate-y-0.5 hover:ring-emerald-200/80",
                  index === platformFlowSteps.length - 1 &&
                    "bg-slate-950 text-white ring-slate-900",
                )}
              >
                <p
                  className={cn(
                    "text-base font-semibold",
                    index === platformFlowSteps.length - 1
                      ? "text-white"
                      : "text-slate-950",
                  )}
                >
                  {step.label}
                </p>
              </article>
              {index < platformFlowSteps.length - 1 ? (
                <div className="flex flex-col items-center py-2 text-slate-400" aria-hidden>
                  <ArrowDown className="h-5 w-5 animate-bounce [animation-duration:2s]" />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 hidden overflow-x-auto pb-2 lg:block">
        <div className="flex min-w-[960px] items-center justify-center gap-2">
          {platformFlowSteps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-2">
              <article
                className={cn(
                  "rounded-2xl px-5 py-3 text-center shadow-sm ring-1 ring-slate-200/70 transition-all hover:-translate-y-0.5 hover:ring-emerald-200/80",
                  index === platformFlowSteps.length - 1
                    ? "bg-slate-950 text-white ring-slate-900"
                    : "bg-white",
                )}
              >
                <p className="text-sm font-semibold">{step.label}</p>
              </article>
              {index < platformFlowSteps.length - 1 ? (
                <span className="text-lg text-slate-300">→</span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </MarketingSection>
  );
}
