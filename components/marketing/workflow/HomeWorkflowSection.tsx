"use client";

import { MarketingSection, MarketingSectionHeader } from "@/components/marketing/design-system/sections";
import { marketingColorClasses } from "@/components/marketing/design-system/tokens/colors";
import { useMarketingContent } from "@/components/marketing/marketing-locale-provider";
import { cn } from "@/lib/utils";

export function HomeWorkflowSection() {
  const { content } = useMarketingContent();

  return (
    <MarketingSection rhythm="large">
      <MarketingSectionHeader
        title={content.workflow.title}
        description={content.workflow.description}
      />

      <div className="mt-14 grid gap-10 lg:grid-cols-[1.4fr_0.6fr] lg:items-start lg:gap-12">
        <div>
          <div className="hidden items-stretch justify-between gap-2 lg:flex">
            {content.workflow.steps.map((step, index) => (
              <div key={step} className="flex flex-1 items-center gap-2">
                <div className="marketing-scene-panel flex min-h-[72px] flex-1 items-center justify-center px-3 py-4 text-center">
                  <p className="text-sm font-semibold text-[var(--marketing-foreground)]">
                    {step}
                  </p>
                </div>
                {index < content.workflow.steps.length - 1 ? (
                  <span className="shrink-0 text-xl text-[var(--marketing-border-strong)]" aria-hidden>
                    →
                  </span>
                ) : null}
              </div>
            ))}
          </div>

          <ol className="space-y-0 lg:hidden">
            {content.workflow.steps.map((step, index) => (
              <li key={step}>
                <div className="marketing-scene-panel flex min-h-[56px] items-center px-4 py-3">
                  <span className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--marketing-foreground)] text-xs font-semibold text-[var(--marketing-background)]">
                    {index + 1}
                  </span>
                  <p className="text-sm font-semibold text-[var(--marketing-foreground)]">{step}</p>
                </div>
                {index < content.workflow.steps.length - 1 ? (
                  <span
                    className="ml-7 my-2 block h-6 w-px bg-[var(--marketing-border-default)]"
                    aria-hidden
                  />
                ) : null}
              </li>
            ))}
          </ol>
        </div>

        <aside
          className={cn(
            marketingColorClasses.sceneFrame,
            "relative min-h-[240px] p-5 sm:p-6",
          )}
          aria-label="Customer journey context"
        >
          <div className="relative z-[1] space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--marketing-muted-foreground)]">
              Shared customer timeline
            </p>
            <div className="marketing-scene-panel p-4">
              <p className="text-sm font-semibold text-[var(--marketing-foreground)]">
                Sarah Wijaya
              </p>
              <ol className="mt-4 space-y-3 border-l-2 border-[var(--marketing-border-accent)] pl-4">
                {[
                  "Conversation started",
                  "Qualified and quoted",
                  "Operation in progress",
                  "Payment and delivery tracked",
                ].map((event) => (
                  <li key={event} className="text-sm text-[var(--marketing-muted)]">
                    {event}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </aside>
      </div>
    </MarketingSection>
  );
}
