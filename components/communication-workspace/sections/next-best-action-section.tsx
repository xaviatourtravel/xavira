import { memo } from "react";
import { Zap } from "lucide-react";

import {
  IntelligenceEmpty,
  IntelligencePreviewBadge,
  IntelligenceSection,
  IntelligenceSurface,
} from "@/components/communication-workspace/primitives";
import type { WorkspaceIntelligencePlaceholder } from "@/lib/communication-workspace/types";

type NextBestActionSectionProps = {
  intelligence: WorkspaceIntelligencePlaceholder;
};

export const NextBestActionSection = memo(function NextBestActionSection({
  intelligence,
}: NextBestActionSectionProps) {
  const isPending = intelligence.state === "pending";

  return (
    <IntelligenceSection
      title="Next Best Action"
      badge={!isPending ? <IntelligencePreviewBadge /> : null}
    >
      {isPending ? (
        <IntelligenceEmpty>
          AI will recommend the highest-impact next step — follow up, send a
          quote, or schedule a call.
        </IntelligenceEmpty>
      ) : (
        <IntelligenceSurface className="flex gap-3 p-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Zap className="h-4 w-4" />
          </div>
          <p className="text-xs leading-[1.65] text-foreground/90">
            {intelligence.nextBestAction}
          </p>
        </IntelligenceSurface>
      )}
    </IntelligenceSection>
  );
});
