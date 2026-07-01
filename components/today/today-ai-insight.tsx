import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import type { TodayAiInsight } from "@/lib/tasks/types";

type TodayAiInsightSectionProps = {
  insight: TodayAiInsight;
};

export function TodayAiInsightSection({ insight }: TodayAiInsightSectionProps) {
  return (
    <section className="rounded-2xl border border-primary/20 bg-[linear-gradient(to_bottom,hsl(var(--primary)/0.06),hsl(var(--card)))] p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Insight AI
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-700 sm:text-base">
            {insight.message}
          </p>
          <Link
            href={insight.actionHref}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80"
          >
            {insight.actionLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
