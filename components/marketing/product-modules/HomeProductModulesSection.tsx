"use client";

import {
  BarChart3,
  Bot,
  CreditCard,
  LayoutGrid,
  MessageSquare,
  Users,
  Workflow,
} from "lucide-react";

import { MarketingSection, MarketingSectionHeader } from "@/components/marketing/design-system/sections";
import { marketingColorClasses } from "@/components/marketing/design-system/tokens/colors";
import { useMarketingContent } from "@/components/marketing/marketing-locale-provider";
import { cn } from "@/lib/utils";

const MODULE_ICONS = {
  communication: MessageSquare,
  crm: Users,
  operations: LayoutGrid,
  finance: CreditCard,
  automation: Workflow,
  aurora: Bot,
  analytics: BarChart3,
} as const;

const FEATURED_IDS = ["communication", "operations", "aurora"] as const;
const SUPPORTING_IDS = ["crm", "finance", "automation", "analytics"] as const;

function FeaturedModuleScene({ moduleId }: { moduleId: keyof typeof MODULE_ICONS }) {
  const Icon = MODULE_ICONS[moduleId];

  return (
    <div
      className="mt-6 min-h-[160px] rounded-[var(--marketing-radius-lg)] border border-[var(--marketing-border-strong)] bg-[var(--marketing-foreground)]/40 p-5"
      aria-hidden
    >
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-[var(--marketing-accent-secondary)]" />
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--marketing-muted-foreground)]">
          Product preview
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-[var(--marketing-foreground)]/60 p-3">
          <div className="h-2 w-full rounded bg-[var(--marketing-border-strong)]" />
          <div className="mt-2 h-2 w-[70%] rounded bg-[var(--marketing-primary)]/50" />
        </div>
        <div className="rounded-lg bg-[var(--marketing-foreground)]/60 p-3">
          <div className="h-2 w-full rounded bg-[var(--marketing-border-strong)]" />
          <div className="mt-2 h-2 w-[55%] rounded bg-[var(--marketing-border-strong)]" />
        </div>
      </div>
    </div>
  );
}

function SupportingModuleBlock({
  title,
  outcome,
}: {
  title: string;
  outcome: string;
}) {
  return (
    <article className="rounded-[var(--marketing-radius-lg)] border border-[var(--marketing-border-strong)] bg-[var(--marketing-foreground)]/30 p-5">
      <h3 className="text-base font-semibold text-[var(--marketing-background)]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--marketing-muted-foreground)]">
        {outcome}
      </p>
    </article>
  );
}

export function HomeProductModulesSection() {
  const { content } = useMarketingContent();

  const featured = content.productModules.items.filter((item) =>
    FEATURED_IDS.includes(item.id as (typeof FEATURED_IDS)[number]),
  );
  const supporting = content.productModules.items.filter((item) =>
    SUPPORTING_IDS.includes(item.id as (typeof SUPPORTING_IDS)[number]),
  );

  return (
    <MarketingSection tone="dark" rhythm="large" className="relative overflow-hidden">
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 opacity-80",
          marketingColorClasses.darkBandGlow,
        )}
      />

      <MarketingSectionHeader
        title={content.productModules.title}
        description={content.productModules.description}
        className="relative [&_h2]:text-[var(--marketing-background)] [&_p]:text-[var(--marketing-muted-foreground)]"
      />

      <div className="relative mt-14 grid gap-6 lg:grid-cols-3">
        {featured.map((module) => (
          <article
            key={module.id}
            className="rounded-[var(--marketing-radius-xl)] border border-[var(--marketing-border-strong)] bg-[var(--marketing-foreground)]/50 p-6 sm:p-7 lg:p-8"
          >
            <h3 className="text-xl font-semibold text-[var(--marketing-background)]">
              {module.title}
            </h3>
            <p className="mt-3 text-base leading-relaxed text-[var(--marketing-muted-foreground)]">
              {module.outcome}
            </p>
            <ul className="mt-5 space-y-2">
              {module.capabilities.map((capability) => (
                <li key={capability} className="text-sm text-[var(--marketing-muted-foreground)]">
                  · {capability}
                </li>
              ))}
            </ul>
            <FeaturedModuleScene moduleId={module.id} />
          </article>
        ))}
      </div>

      <div className="relative mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {supporting.map((module) => (
          <SupportingModuleBlock key={module.id} title={module.title} outcome={module.outcome} />
        ))}
      </div>
    </MarketingSection>
  );
}
