"use client";

import { memo } from "react";

import { IntelligenceCardRenderer } from "@/components/communication-workspace/intelligence-cards/snapshot-cards";
import { IntelligenceDivider } from "@/components/communication-workspace/primitives";
import type { WorkspaceTimelineEntry } from "@/lib/communication-workspace/types";
import type { IntelligenceSnapshot } from "@/lib/intelligence/types/snapshot";
import { getIntelligenceUiCards } from "@/lib/intelligence/ui/card-registry";
import type { ExtractedEntityField } from "@/lib/intelligence/entities/types";

type IntelligenceCardListLayoutProps = {
  snapshot: IntelligenceSnapshot;
  timeline: WorkspaceTimelineEntry[];
  editedFields: Record<string, string>;
  onFieldChange: (field: ExtractedEntityField, value: string) => void;
};

export const IntelligenceCardListLayout = memo(function IntelligenceCardListLayout({
  snapshot,
  timeline,
  editedFields,
  onFieldChange,
}: IntelligenceCardListLayoutProps) {
  const cards = getIntelligenceUiCards();
  let scoreRowRendered = false;

  return (
    <>
      {cards.map((card) => {
        if (card.type === "lead_score") {
          if (scoreRowRendered) {
            return null;
          }
          scoreRowRendered = true;
          return (
            <div
              key="score-metrics-row"
              className="grid grid-cols-1 gap-6 sm:grid-cols-2"
            >
              <IntelligenceCardRenderer
                cardType="lead_score"
                snapshot={snapshot}
                timeline={timeline}
                editedFields={editedFields}
                onFieldChange={onFieldChange}
              />
              <IntelligenceCardRenderer
                cardType="revenue_potential"
                snapshot={snapshot}
                timeline={timeline}
                editedFields={editedFields}
                onFieldChange={onFieldChange}
              />
            </div>
          );
        }

        if (card.type === "revenue_potential") {
          return null;
        }

        return (
          <div key={card.type}>
            <IntelligenceCardRenderer
              cardType={card.type}
              snapshot={snapshot}
              timeline={timeline}
              editedFields={editedFields}
              onFieldChange={onFieldChange}
            />
            {card.type === "memory" ? (
              <div className="mt-6">
                <IntelligenceDivider />
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
});
