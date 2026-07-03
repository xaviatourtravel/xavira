import type { ReactNode } from "react";

import { DsEmptyState } from "@/components/design-system";
import { designSystemPanelClass } from "@/lib/design-system/tokens";
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
  return (
    <div className="space-y-4">
      <SidePanelSection
        title="Suggestions"
        description="Recommended next steps to improve AI understanding of your business."
      >
        {suggestions.length > 0 ? (
          <ul className="space-y-3">
            {suggestions.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-border bg-muted/30 p-3"
              >
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.description}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <DsEmptyState
            title="No suggestions yet"
            description="Connect knowledge, products, and documents to unlock tailored recommendations."
            className="border-dashed bg-muted/20 py-8"
          />
        )}
      </SidePanelSection>

      <SidePanelSection
        title="Recent Changes"
        description="Latest updates to your business brain configuration."
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
            title="No recent changes"
            description="Updates to knowledge, products, and publish status will appear here."
            className="border-dashed bg-muted/20 py-8"
          />
        )}
      </SidePanelSection>
    </div>
  );
}
