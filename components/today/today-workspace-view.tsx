import {
  TodayHeroSection,
  TodayNextBestActionSection,
} from "@/components/today/today-hero-section";
import { TodayAiInsightSection } from "@/components/today/today-ai-insight";
import { TodayActivityTimelineSection } from "@/components/today/today-activity-timeline";
import { TodayPriorityQueueSection } from "@/components/today/today-priority-queue";
import { TodayProgressSection } from "@/components/today/today-progress-section";
import { TodayWorkspaceHealthSection } from "@/components/today/today-workspace-health";
import type { TodayWorkspaceData } from "@/lib/tasks/types";

type TodayWorkspaceViewProps = {
  data: TodayWorkspaceData;
};

export function TodayWorkspaceView({ data }: TodayWorkspaceViewProps) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-10">
      <TodayHeroSection
        userName={data.userName}
        brief={data.morningBrief}
        hasNextAction={data.nextBestAction != null}
      />

      <TodayNextBestActionSection action={data.nextBestAction} />

      <div className="grid gap-6 lg:grid-cols-2">
        <TodayProgressSection progress={data.progress} />
        <TodayWorkspaceHealthSection indicators={data.healthIndicators} />
      </div>

      <TodayPriorityQueueSection groups={data.priorityQueue} />

      <div className="grid gap-6 lg:grid-cols-2">
        <TodayAiInsightSection insight={data.aiInsight} />
        <TodayActivityTimelineSection items={data.activityTimeline} />
      </div>

      {data.usingDerivedTasks ? (
        <p className="text-center text-xs text-slate-400">
          Task dihitung dari data live — akan tersinkron saat task engine aktif penuh.
        </p>
      ) : null}
    </div>
  );
}
