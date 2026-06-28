import { CheckCircle2, Clock3 } from "lucide-react";

import type { TodayProgressMetrics } from "@/lib/tasks/types";
import { formatEstimatedDuration } from "@/lib/tasks/today-intelligence";

type TodayProgressSectionProps = {
  progress: TodayProgressMetrics;
};

export function TodayProgressSection({ progress }: TodayProgressSectionProps) {
  const isComplete = progress.remainingTasks === 0 && progress.completedTasks > 0;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Progress Hari Ini
          </p>
          <h2 className="mt-1 text-base font-semibold text-slate-950">
            {isComplete ? "Semua selesai hari ini" : "Progress hari ini"}
          </h2>
        </div>
        <span className="text-2xl font-semibold tabular-nums text-emerald-700">
          {progress.progressPercent}%
        </span>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-600 transition-all duration-700 ease-out"
          style={{ width: `${progress.progressPercent}%` }}
        />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-slate-50 px-3 py-3">
          <div className="flex items-center gap-1.5 text-slate-500">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <p className="text-[11px] font-medium uppercase tracking-wide">Selesai</p>
          </div>
          <p className="mt-1 text-lg font-semibold tabular-nums text-slate-950">
            {progress.completedTasks}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-3">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock3 className="h-3.5 w-3.5" />
            <p className="text-[11px] font-medium uppercase tracking-wide">Tersisa</p>
          </div>
          <p className="mt-1 text-lg font-semibold tabular-nums text-slate-950">
            {progress.remainingTasks}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Estimasi sisa
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-950">
            {progress.remainingTasks === 0
              ? "-"
              : formatEstimatedDuration(progress.estimatedMinutesRemaining)}
          </p>
        </div>
      </div>
    </section>
  );
}
