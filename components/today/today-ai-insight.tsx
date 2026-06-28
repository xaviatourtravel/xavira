import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import type { TodayAiInsight } from "@/lib/tasks/types";

type TodayAiInsightSectionProps = {
  insight: TodayAiInsight;
};

export function TodayAiInsightSection({ insight }: TodayAiInsightSectionProps) {
  return (
    <section className="rounded-2xl border border-violet-200/60 bg-[linear-gradient(to_bottom,#faf5ff,#ffffff)] p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
            AI Insight
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-700 sm:text-base">
            {insight.message}
          </p>
          <Link
            href={insight.actionHref}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-violet-700 hover:text-violet-900"
          >
            {insight.actionLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
