"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { DsEmptyState } from "@/components/design-system";
import { designSystemPanelClass } from "@/lib/design-system/tokens";
import { useBbTranslation } from "@/modules/business-brain/hooks/use-bb-translation";
import type {
  BusinessBrainRecentChange,
  BusinessBrainSuggestion,
} from "@/modules/business-brain/types";
import { cn } from "@/lib/utils";

function SidePanelSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className={cn(designSystemPanelClass, "p-5")}>
      <div className="mb-4 space-y-1">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

type BusinessBrainSidePanelProps = {
  suggestions: BusinessBrainSuggestion[];
  recentChanges: BusinessBrainRecentChange[];
};

export function BusinessBrainSidePanel({
  suggestions,
  recentChanges,
}: BusinessBrainSidePanelProps) {
  const { bb } = useBbTranslation();

  return (
    <div className="space-y-4">
      <SidePanelSection
        title={bb("suggestions")}
        description={bb("suggestionsDescription")}
      >
        {suggestions.length > 0 ? (
          <ul className="space-y-3">
            {suggestions.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-border bg-muted/30 p-3"
              >
                {item.href ? (
                  <Link href={item.href} className="block hover:opacity-90">
                    <p className="text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </Link>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <DsEmptyState
            title={bb("noSuggestionsYet")}
            description={bb("noSuggestionsDescription")}
            className="border-dashed bg-muted/20 py-8"
          />
        )}
      </SidePanelSection>

      <SidePanelSection
        title={bb("sidePanelRecentChanges")}
        description={bb("sidePanelRecentChangesDescription")}
      >
        {recentChanges.length > 0 ? (
          <ul className="space-y-2">
            {recentChanges.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span className="font-medium text-foreground">{item.label}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {item.timestampLabel}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <DsEmptyState
            title={bb("noRecentChanges")}
            description={bb("noRecentChangesSidePanelDescription")}
            className="border-dashed bg-muted/20 py-8"
          />
        )}
      </SidePanelSection>
    </div>
  );
}
