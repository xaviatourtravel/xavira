"use client";

import { Check, MessageSquare, Table, X } from "lucide-react";

import { MarketingSection, MarketingSectionHeader } from "@/components/marketing/design-system/sections";
import { marketingColorClasses } from "@/components/marketing/design-system/tokens/colors";
import { useMarketingContent } from "@/components/marketing/marketing-locale-provider";
import { cn } from "@/lib/utils";

function DisconnectedPreview() {
  return (
    <div className="grid gap-3 sm:grid-cols-2" aria-hidden>
      <div className="marketing-scene-panel p-3">
        <MessageSquare className="h-4 w-4 text-[var(--marketing-muted)]" />
        <p className="mt-2 text-xs text-[var(--marketing-muted)]">WhatsApp thread A</p>
      </div>
      <div className="marketing-scene-panel p-3">
        <Table className="h-4 w-4 text-[var(--marketing-muted)]" />
        <p className="mt-2 text-xs text-[var(--marketing-muted)]">Spreadsheet tracker</p>
      </div>
      <div className="marketing-scene-panel p-3 sm:col-span-2">
        <p className="text-xs text-[var(--marketing-muted)]">
          Customer data copied manually · reminders in separate notes
        </p>
      </div>
    </div>
  );
}

function ConnectedPreview() {
  return (
    <div className="space-y-3" aria-hidden>
      <div className="marketing-scene-panel p-4">
        <p className="text-sm font-semibold text-[var(--marketing-foreground)]">
          Sarah Wijaya · unified workspace
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg bg-[var(--marketing-surface)] px-3 py-2 text-xs text-[var(--marketing-muted)]">
            Inbox + CRM context
          </div>
          <div className="rounded-lg bg-[var(--marketing-surface)] px-3 py-2 text-xs text-[var(--marketing-muted)]">
            Operations linked
          </div>
        </div>
      </div>
      <div className={cn("p-3 text-xs", marketingColorClasses.solutionCallout)}>
        Aurora follow-up suggested · awaiting review
      </div>
    </div>
  );
}

export function HomeProofSection() {
  const { content } = useMarketingContent();

  return (
    <MarketingSection tone="muted" rhythm="large">
      <MarketingSectionHeader title={content.proof.title} />

      <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:gap-10">
        <article className="rounded-[var(--marketing-radius-xl)] bg-[var(--marketing-surface-muted)] p-7 ring-1 ring-[var(--marketing-border-default)] sm:p-8">
          <h3 className="text-xl font-semibold text-[var(--marketing-foreground)]">
            {content.proof.disconnected.title}
          </h3>
          <div className="mt-6">
            <DisconnectedPreview />
          </div>
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

        <article className="rounded-[var(--marketing-radius-xl)] bg-[var(--marketing-elevated-surface)] p-7 shadow-[var(--marketing-shadow-soft)] ring-1 ring-[var(--marketing-border-accent)] sm:p-8">
          <h3 className="text-xl font-semibold text-[var(--marketing-foreground)]">
            {content.proof.desklabs.title}
          </h3>
          <div className="mt-6">
            <ConnectedPreview />
          </div>
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

      <ul className="mt-12 flex flex-wrap justify-center gap-3">
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
