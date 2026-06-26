import Link from "next/link";

import { TodayEmptyState, TodaySummaryCards } from "@/components/today/today-summary-cards";
import { TodayFocusSidebar } from "@/components/today/today-focus-sidebar";
import { TodayTaskCard } from "@/components/today/today-task-card";
import type { TodayWorkspaceData } from "@/lib/tasks/types";

type TodayWorkspaceViewProps = {
  data: TodayWorkspaceData;
};

export function TodayWorkspaceView({ data }: TodayWorkspaceViewProps) {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary">Today Workspace</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Good morning, {data.userName}
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Here&apos;s what needs your attention today.
          {data.usingDerivedTasks
            ? " Tasks are derived from your live customer data until saved task records exist."
            : null}
        </p>
      </header>

      <TodaySummaryCards summary={data.summary} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section id="priority-queue" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Priority Queue</h2>
              <p className="text-sm text-muted-foreground">
                Work through the highest-impact customer actions first.
              </p>
            </div>
            <Link
              href="/inbox"
              className="text-sm font-medium text-primary hover:underline"
            >
              Open Communication Workspace
            </Link>
          </div>

          {data.tasks.length === 0 ? (
            <TodayEmptyState />
          ) : (
            <div className="space-y-4">
              {data.tasks.map((task) => (
                <TodayTaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </section>

        <TodayFocusSidebar sections={data.focusSections} />
      </div>
    </div>
  );
}
