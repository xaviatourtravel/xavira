"use client";

import { MarketingSection, MarketingSectionHeader } from "@/components/marketing/design-system/sections";
import { ProblemSolutionRow } from "@/components/marketing/problems/ProblemSolutionRow";
import { useMarketingContent } from "@/components/marketing/marketing-locale-provider";

const VISUAL_VARIANTS = ["inbox", "crm", "operations", "automation"] as const;

export function HomeProblemsSection() {
  const { content } = useMarketingContent();

  return (
    <MarketingSection tone="muted" rhythm="large">
      <MarketingSectionHeader title={content.problems.title} />

      <div className="mt-16 space-y-24 sm:space-y-28 lg:space-y-32">
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
