"use client";

import { MarketingSection, MarketingSectionHeader } from "@/components/marketing/design-system/sections";
import { ProblemSolutionRow } from "@/components/marketing/problems/ProblemSolutionRow";
import { MotionSectionGroup, MotionSectionItem } from "@/components/marketing/motion";
import { useMarketingContent } from "@/components/marketing/marketing-locale-provider";

const VISUAL_VARIANTS = ["inbox", "crm", "operations", "automation"] as const;

export function HomeProblemsSection() {
  const { content } = useMarketingContent();

  return (
    <MarketingSection tone="muted" rhythm="large">
      <MotionSectionGroup>
        <MotionSectionItem>
          <MarketingSectionHeader title={content.problems.title} />
        </MotionSectionItem>
      </MotionSectionGroup>

      <div className="mt-14 space-y-20 lg:space-y-24">
        {content.problems.items.map((item, index) => (
          <ProblemSolutionRow
            key={item.problem}
            problem={item.problem}
            problemDetail={item.problemDetail}
            solution={item.solution}
            solutionDetail={item.solutionDetail}
            visualVariant={VISUAL_VARIANTS[index] ?? "inbox"}
            reverse={index % 2 === 1}
          />
        ))}
      </div>
    </MarketingSection>
  );
}
