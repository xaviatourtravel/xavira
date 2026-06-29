import { Bot, Sparkles } from "lucide-react";

import { TodayActionButton } from "@/components/today/today-action-button";
import type { TodayMorningBrief, NextBestAction } from "@/lib/tasks/types";
import { formatEstimatedDuration } from "@/lib/tasks/today-intelligence";

type TodayHeroSectionProps = {
  userName: string;
  brief: TodayMorningBrief;
  hasNextAction: boolean;
};

export function TodayHeroSection({
  userName,
  brief,
  hasNextAction,
}: TodayHeroSectionProps) {
  const firstName = userName.split(" ")[0] ?? userName;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-[linear-gradient(to_bottom_right,#ffffff,#f8fafc)] p-4 shadow-sm sm:p-6 md:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-emerald-100/50 blur-3xl"
      />

      <div className="relative space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-emerald-700">Ruang Kerja Hari Ini</p>
          <h1 className="break-words text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl md:text-3xl">
            {brief.greeting}, {firstName}.
          </h1>
        </div>

        <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white">
              <Bot className="h-4 w-4" />
            </span>
            <div className="min-w-0 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">
                Ringkasan AI Hari Ini
              </p>
              <p className="text-sm leading-relaxed text-slate-700 sm:text-base">
                {brief.brief}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Objective hari ini
            </p>
            <p className="max-w-2xl text-sm font-medium text-slate-900 sm:text-base">
              {brief.dailyObjective}
            </p>
          </div>

          {hasNextAction ? (
            <a
              href="#next-best-action"
              className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-md bg-slate-950 px-6 text-sm font-medium text-white transition-colors hover:bg-slate-800 sm:w-auto"
            >
              <Sparkles className="h-4 w-4" />
              Mulai Hari Ini
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

type TodayNextBestActionProps = {
  action: NextBestAction | null;
};

export function TodayNextBestActionSection({ action }: TodayNextBestActionProps) {
  if (!action) {
    return (
      <section
        id="next-best-action"
        className="scroll-mt-24 rounded-2xl border border-dashed border-emerald-200/80 bg-emerald-50/30 p-6 text-center sm:p-8"
      >
        <p className="text-sm font-medium text-emerald-800">Antrian clear</p>
        <p className="mt-2 text-base font-semibold text-slate-950">
          Tidak ada aksi urgent. Hari ini under control.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Gunakan waktu untuk review pipeline atau persiapkan follow up besok.
        </p>
      </section>
    );
  }

  const { task, reason, estimatedMinutes, businessImpact } = action;

  return (
    <section id="next-best-action" className="scroll-mt-24">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Prioritas Berikutnya
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-950">
          Apa yang harus Anda lakukan sekarang
        </h2>
      </div>

      <article className="rounded-2xl border border-emerald-200/70 bg-white p-6 shadow-[0_20px_60px_-40px_rgba(16,185,129,0.35)] sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                Pelanggan
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-950">
                {task.customerName ?? "Customer"}
              </p>
              <p className="mt-1 text-sm text-slate-600">{task.title}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 px-3 py-3 ring-1 ring-slate-200/60">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Alasan
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{reason}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-3 ring-1 ring-slate-200/60">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Estimasi waktu
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatEstimatedDuration(estimatedMinutes)}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50/80 px-3 py-3 ring-1 ring-emerald-200/60">
                <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">
                  Dampak bisnis
                </p>
                <p className="mt-1 text-sm font-medium text-emerald-900">
                  {businessImpact}
                </p>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <TodayActionButton task={task} size="lg" className="w-full sm:w-auto" />
          </div>
        </div>
      </article>
    </section>
  );
}
