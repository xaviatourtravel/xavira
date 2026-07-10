"use client";

import { marketingColorClasses } from "@/components/marketing/design-system/tokens/colors";
import { MarketingEyebrow, MarketingH3 } from "@/components/marketing/design-system/typography";
import {
  AuroraAssistScene,
  CustomerTimelineScene,
  OperationsWorkspaceScene,
  UnifiedInboxScene,
} from "@/components/marketing/product-scenes";
import { cn } from "@/lib/utils";

type ProblemVisualVariant = "inbox" | "crm" | "operations" | "automation";

const SCENES = {
  inbox: UnifiedInboxScene,
  crm: CustomerTimelineScene,
  operations: OperationsWorkspaceScene,
  automation: AuroraAssistScene,
} as const;

function ProblemVisual({ variant }: { variant: ProblemVisualVariant }) {
  const Scene = SCENES[variant];

  return (
    <div className={cn("min-h-[280px] sm:min-h-[340px] lg:min-h-[400px]")}>
      <Scene compact />
    </div>
  );
}

export type ProblemSolutionRowProps = {
  problem: string;
  problemDetail: string;
  solution: string;
  solutionDetail: string;
  visualVariant: ProblemVisualVariant;
  reverse?: boolean;
};

export function ProblemSolutionRow({
  problem,
  problemDetail,
  solution,
  solutionDetail,
  visualVariant,
  reverse = false,
}: ProblemSolutionRowProps) {
  return (
    <div
      className={cn(
        "grid items-center gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-20",
        reverse && "lg:[&>*:first-child]:order-2",
      )}
    >
      <div className="min-w-0 lg:py-4">
        <MarketingEyebrow className="text-[var(--marketing-error)]/80">
          Problem
        </MarketingEyebrow>
        <MarketingH3 as="h3" className="mt-3">
          {problem}
        </MarketingH3>
        <p className="mt-4 text-base leading-relaxed text-[var(--marketing-muted)] sm:text-lg">
          {problemDetail}
        </p>

        <div className={cn("mt-8 p-5 sm:p-6", marketingColorClasses.solutionCallout)}>
          <p className="text-base font-semibold text-[var(--marketing-primary-muted-foreground)]">
            {solution}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--marketing-muted)] sm:text-base">
            {solutionDetail}
          </p>
        </div>
      </div>

      <ProblemVisual variant={visualVariant} />
    </div>
  );
}
