import { memo } from "react";

import {
  IntelligenceEmpty,
  IntelligenceMetric,
  IntelligencePreviewBadge,
  IntelligenceSection,
} from "@/components/communication-workspace/primitives";
import type { WorkspaceIntelligencePlaceholder } from "@/lib/communication-workspace/types";

type ScoreMetricsSectionProps = {
  intelligence: WorkspaceIntelligencePlaceholder;
  revenueLabel: string | null;
};

export const ScoreMetricsSection = memo(function ScoreMetricsSection({
  intelligence,
  revenueLabel,
}: ScoreMetricsSectionProps) {
  const isPending = intelligence.state === "pending";
  const scoreDisplay =
    intelligence.leadScore != null ? String(intelligence.leadScore) : null;

  if (isPending) {
    return (
      <div className="space-y-6">
        <IntelligenceSection title="Lead Score">
          <IntelligenceEmpty>
            Lead score will be calculated from conversation signals and CRM
            history.
          </IntelligenceEmpty>
        </IntelligenceSection>
        <IntelligenceSection title="Revenue Potential">
          <IntelligenceEmpty>
            Estimated deal value based on budget signals and package interest.
          </IntelligenceEmpty>
        </IntelligenceSection>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <IntelligenceSection
        title="Lead Score"
        badge={<IntelligencePreviewBadge />}
      >
        <IntelligenceMetric
          label="Score"
          value={scoreDisplay}
          sublabel={intelligence.leadScoreLabel}
          accent="score"
        />
      </IntelligenceSection>
      <IntelligenceSection
        title="Revenue Potential"
        badge={<IntelligencePreviewBadge />}
      >
        <IntelligenceMetric
          label="Est. value"
          value={revenueLabel}
          accent="revenue"
        />
      </IntelligenceSection>
    </div>
  );
});
