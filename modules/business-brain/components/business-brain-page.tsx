"use client";

import { BusinessBrainOverviewContent } from "@/modules/business-brain/components/business-brain-overview-content";
import { BusinessBrainSectionHeader } from "@/modules/business-brain/components/business-brain-workspace";
import type { BusinessBrainOverviewSummary } from "@/modules/business-brain/types";
import type { KnowledgeCoverageResult } from "@/modules/business-brain/types/knowledge-coverage";
import {
  translateBusinessBrainSectionDescription,
  translateBusinessBrainSectionTitle,
} from "@/lib/i18n/business-brain-labels";
import { useTranslation } from "@/lib/i18n/use-translation";

type BusinessBrainPageProps = {
  overview: BusinessBrainOverviewSummary;
  knowledgeCoverage: KnowledgeCoverageResult;
};

export function BusinessBrainPage({
  overview,
  knowledgeCoverage,
}: BusinessBrainPageProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <BusinessBrainSectionHeader
        title={translateBusinessBrainSectionTitle(t, "overview")}
        iconSlug="overview"
        description={translateBusinessBrainSectionDescription(t, "overview")}
      />
      <BusinessBrainOverviewContent
        health={overview.health}
        initialCoach={overview.coach}
        initialTimeline={overview.timeline}
        initialCoverage={knowledgeCoverage}
      />
    </div>
  );
}
