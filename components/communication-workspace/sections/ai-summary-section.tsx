import { memo } from "react";

import {
  IntelligenceEmpty,
  IntelligencePreviewBadge,
  IntelligenceSection,
  IntelligenceSurface,
} from "@/components/communication-workspace/primitives";
import type { WorkspaceIntelligencePlaceholder } from "@/lib/communication-workspace/types";

type AiSummarySectionProps = {
  intelligence: WorkspaceIntelligencePlaceholder;
};

export const AiSummarySection = memo(function AiSummarySection({
  intelligence,
}: AiSummarySectionProps) {
  const isPending = intelligence.state === "pending";

  return (
    <IntelligenceSection
      title="AI Summary"
      badge={!isPending ? <IntelligencePreviewBadge /> : null}
    >
      {isPending ? (
        <IntelligenceEmpty>
          Once the customer sends a message, a concise summary of intent and
          context will appear here.
        </IntelligenceEmpty>
      ) : (
        <IntelligenceSurface className="p-4">
          <p className="text-xs leading-[1.65] text-foreground/90">
            {intelligence.summary}
          </p>
        </IntelligenceSurface>
      )}
    </IntelligenceSection>
  );
});
