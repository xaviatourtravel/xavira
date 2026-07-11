"use client";

import { MarketingSection, MarketingSectionHeader } from "@/components/marketing/design-system/sections";
import {
  MotionScene,
  MotionSectionGroup,
  MotionSectionItem,
  MotionStagger,
  MotionStaggerItem,
} from "@/components/marketing/motion";
import {
  AuroraAssistScene,
  OperationsWorkspaceScene,
  sceneStyles,
  UnifiedInboxScene,
} from "@/components/marketing/product-scenes";
import { useMarketingContent } from "@/components/marketing/marketing-locale-provider";
import { marketingColorClasses } from "@/components/marketing/design-system/tokens/colors";
import { cn } from "@/lib/utils";

const FEATURED_IDS = ["communication", "operations", "aurora"] as const;
const SUPPORTING_IDS = ["crm", "finance", "automation", "analytics"] as const;

function FeaturedModuleScene({ moduleId }: { moduleId: (typeof FEATURED_IDS)[number] }) {
  const cropClass =
    "mt-auto flex h-[200px] min-h-[200px] flex-col overflow-hidden rounded-[var(--marketing-radius-lg)] border border-[var(--marketing-border-strong)] [&_.marketing-scene-frame]:border-0 [&_.marketing-scene-frame]:shadow-none [&_.marketing-dark-band-glow]:hidden";

  return (
    <MotionScene>
      {moduleId === "communication" ? (
        <div className={cropClass} aria-hidden>
          <UnifiedInboxScene compact className="scale-[1.02] origin-top" />
        </div>
      ) : moduleId === "operations" ? (
        <div className={cropClass} aria-hidden>
          <OperationsWorkspaceScene compact dark className="[&_.marketing-scene-canvas]:border-0" />
        </div>
      ) : (
        <div className={cropClass} aria-hidden>
          <AuroraAssistScene compact />
        </div>
      )}
    </MotionScene>
  );
}

function SupportingModuleBlock({
  title,
  outcome,
  metrics,
}: {
  title: string;
  outcome: string;
  metrics: Array<{ label: string; value: string }>;
}) {
  return (
    <article className="rounded-[var(--marketing-radius-lg)] border border-[var(--marketing-border-strong)] bg-[var(--marketing-foreground)]/30 p-5">
      <h3 className="text-base font-semibold text-[var(--marketing-background)]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--marketing-muted-foreground)]">
        {outcome}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2" aria-hidden>
        {metrics.map((metric) => (
          <div key={metric.label} className={cn(sceneStyles.darkSurface, "px-2.5 py-2")}>
            <p className="text-[10px] text-[color-mix(in_srgb,var(--marketing-background)_65%,transparent)]">
              {metric.label}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-[var(--marketing-background)]">{metric.value}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

const SUPPORTING_METRICS: Record<(typeof SUPPORTING_IDS)[number], Array<{ label: string; value: string }>> = {
  crm: [
    { label: "Timeline", value: "Unified" },
    { label: "Stage", value: "Proposal" },
  ],
  finance: [
    { label: "Invoice", value: "Draft" },
    { label: "Status", value: "Pending" },
  ],
  automation: [
    { label: "Rules", value: "3 active" },
    { label: "Reminders", value: "On" },
  ],
  analytics: [
    { label: "Pipeline", value: "Shared" },
    { label: "Context", value: "Live" },
  ],
};

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

      <MotionSectionGroup className="relative" viewport="large">
        <MotionSectionItem>
          <MarketingSectionHeader
            title={content.productModules.title}
            description={content.productModules.description}
            className="[&_h2]:text-[var(--marketing-background)] [&_p]:text-[var(--marketing-muted-foreground)]"
          />
        </MotionSectionItem>
      </MotionSectionGroup>

      <MotionStagger
        className="relative mt-14 grid gap-6 lg:grid-cols-3"
        stagger="featured"
        viewport="large"
      >
        {featured.map((module) => (
          <MotionStaggerItem key={module.id}>
            <article className="flex flex-col rounded-[var(--marketing-radius-xl)] border border-[var(--marketing-border-strong)] bg-[var(--marketing-foreground)]/50 p-6 sm:p-7 lg:p-8">
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
              <FeaturedModuleScene moduleId={module.id as (typeof FEATURED_IDS)[number]} />
            </article>
          </MotionStaggerItem>
        ))}
      </MotionStagger>

      <MotionStagger
        className="relative mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        stagger="compact"
        viewport="large"
        delayChildren={280}
      >
        {supporting.map((module) => (
          <MotionStaggerItem key={module.id}>
            <SupportingModuleBlock
              title={module.title}
              outcome={module.outcome}
              metrics={SUPPORTING_METRICS[module.id as (typeof SUPPORTING_IDS)[number]]}
            />
          </MotionStaggerItem>
        ))}
      </MotionStagger>
    </MarketingSection>
  );
}
