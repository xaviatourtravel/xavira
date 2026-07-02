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
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card bg-[linear-gradient(to_bottom_right,#ffffff,#f8fafc)] p-4 shadow-sm dark:bg-none sm:p-6 md:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-primary">Ruang Kerja Hari Ini</p>
          <h1 className="break-words text-xl font-semibold tracking-tight text-foreground sm:text-2xl md:text-3xl">
            {brief.greeting}, {firstName}.
          </h1>
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 dark:border-primary/30 dark:bg-primary/10 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </span>
            <div className="min-w-0 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Ringkasan AI Hari Ini
              </p>
              <p className="text-sm leading-relaxed text-foreground/80 sm:text-base">
                {brief.brief}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Objective hari ini
            </p>
            <p className="max-w-2xl text-sm font-medium text-foreground sm:text-base">
              {brief.dailyObjective}
            </p>
          </div>

          {hasNextAction ? (
            <a
              href="#next-best-action"
              className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
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
        className="scroll-mt-24 rounded-2xl border border-dashed border-emerald-200/80 bg-emerald-50/30 p-6 text-center dark:border-emerald-500/30 dark:bg-emerald-500/10 sm:p-8"
      >
        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Antrian clear</p>
        <p className="mt-2 text-base font-semibold text-foreground">
          Tidak ada aksi urgent. Hari ini under control.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Gunakan waktu untuk review pipeline atau persiapkan follow up besok.
        </p>
      </section>
    );
  }

  const { task, reason, estimatedMinutes, businessImpact } = action;

  return (
    <section id="next-best-action" className="scroll-mt-24">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Prioritas Berikutnya
        </p>
        <h2 className="mt-1 text-lg font-semibold text-foreground">
          Apa yang harus Anda lakukan sekarang
        </h2>
      </div>

      <article className="rounded-2xl border border-primary/20 bg-card p-6 shadow-[0_20px_60px_-40px_hsl(var(--primary)/0.25)] dark:border-primary/30 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                Pelanggan
              </p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                {task.customerName ?? "Customer"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{task.title}</p>
            </div>

            <p className="max-w-2xl text-sm leading-relaxed text-foreground/85">
              {reason}
            </p>

            <p className="text-[13px] text-muted-foreground">
              <span className="font-medium text-foreground/80">
                {formatEstimatedDuration(estimatedMinutes)}
              </span>
              <span className="mx-2 text-border">·</span>
              <span>{businessImpact}</span>
            </p>
          </div>

          <div className="shrink-0 lg:pl-4">
            <TodayActionButton
              task={task}
              size="lg"
              variant="priority"
              className="w-full sm:w-auto"
            />
          </div>
        </div>
      </article>
    </section>
  );
}
