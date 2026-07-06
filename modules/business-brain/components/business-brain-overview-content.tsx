"use client";

import { useEffect, useRef, useState } from "react";

import { loadBusinessBrainCoachAction } from "@/modules/business-brain/actions/coach-actions";
import { loadKnowledgeCoverageAction } from "@/modules/business-brain/actions/knowledge-coverage-actions";
import { loadBusinessBrainTimelineAction } from "@/modules/business-brain/actions/timeline-actions";
import { BusinessBrainCoachSection } from "@/modules/business-brain/components/business-brain-coach-section";
import { BusinessBrainHealthDashboard } from "@/modules/business-brain/components/business-brain-health-dashboard";
import { BusinessBrainKnowledgeCoverageSection } from "@/modules/business-brain/components/business-brain-knowledge-coverage-section";
import { BusinessBrainTimelineSection } from "@/modules/business-brain/components/business-brain-timeline-section";
import { useBusinessBrainWorkspace } from "@/modules/business-brain/components/business-brain-workspace-context";
import type { BusinessBrainCoachResult } from "@/modules/business-brain/types/business-brain-coach";
import type { BusinessBrainHealth } from "@/modules/business-brain/types/business-brain-health";
import type { BusinessBrainTimelineResult } from "@/modules/business-brain/types/business-brain-timeline";
import type { KnowledgeCoverageResult } from "@/modules/business-brain/types/knowledge-coverage";

type BusinessBrainOverviewContentProps = {
  health: BusinessBrainHealth;
  initialCoach: BusinessBrainCoachResult;
  initialTimeline: BusinessBrainTimelineResult;
  initialCoverage: KnowledgeCoverageResult;
};

export function BusinessBrainOverviewContent({
  health,
  initialCoach,
  initialTimeline,
  initialCoverage,
}: BusinessBrainOverviewContentProps) {
  const { section } = useBusinessBrainWorkspace();
  const [coach, setCoach] = useState(initialCoach);
  const [timeline, setTimeline] = useState(initialTimeline);
  const [coverage, setCoverage] = useState(initialCoverage);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const skipNextOverviewRefresh = useRef(true);

  useEffect(() => {
    setCoach(initialCoach);
  }, [initialCoach]);

  useEffect(() => {
    setTimeline(initialTimeline);
  }, [initialTimeline]);

  useEffect(() => {
    setCoverage(initialCoverage);
  }, [initialCoverage]);

  useEffect(() => {
    if (section !== "overview") return;

    if (skipNextOverviewRefresh.current) {
      skipNextOverviewRefresh.current = false;
      return;
    }

    let cancelled = false;
    setIsRefreshing(true);

    void Promise.all([
      loadBusinessBrainCoachAction(),
      loadBusinessBrainTimelineAction(),
      loadKnowledgeCoverageAction(),
    ])
      .then(([coachResult, timelineResult, coverageResult]) => {
        if (!cancelled) {
          setCoach(coachResult);
          setTimeline(timelineResult);
          setCoverage(coverageResult);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsRefreshing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [section]);

  return (
    <div className="space-y-6">
      <BusinessBrainHealthDashboard health={health} />
      <BusinessBrainCoachSection coach={coach} />
      <BusinessBrainTimelineSection timeline={timeline} />
      <BusinessBrainKnowledgeCoverageSection
        coverage={coverage}
        isRefreshing={isRefreshing}
      />
    </div>
  );
}
