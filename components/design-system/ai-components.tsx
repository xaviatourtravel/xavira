import { Bot, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { designSystemPanelClass } from "@/lib/design-system/tokens";

type DsAiSummaryProps = {
  items: { label: string; value: string }[];
  disclaimer?: string;
  className?: string;
};

export function DsAiSummary({ items, disclaimer, className }: DsAiSummaryProps) {
  return (
    <div className={cn(designSystemPanelClass, "overflow-hidden", className)}>
      <div className="border-b border-violet-100 bg-violet-50/50 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-700 text-white">
            <Bot className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-950">Ringkasan AI</p>
            <p className="text-xs text-slate-500">Konteks customer otomatis</p>
          </div>
        </div>
      </div>
      <dl className="space-y-3 px-5 py-4">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-violet-700">
              {item.label}
            </dt>
            <dd className="mt-0.5 text-sm leading-relaxed text-slate-700">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
      {disclaimer ? (
        <p className="border-t border-violet-100 px-5 py-3 text-xs text-slate-500">
          {disclaimer}
        </p>
      ) : null}
    </div>
  );
}

type DsAiRecommendationProps = {
  title: string;
  detail: string;
  priority?: "tinggi" | "sedang" | "rendah";
  action?: ReactNode;
  className?: string;
};

const priorityClass = {
  tinggi: "bg-red-100 text-red-800",
  sedang: "bg-amber-100 text-amber-800",
  rendah: "bg-emerald-100 text-emerald-800",
} as const;

export function DsAiRecommendation({
  title,
  detail,
  priority = "sedang",
  action,
  className,
}: DsAiRecommendationProps) {
  return (
    <div
      className={cn(
        designSystemPanelClass,
        "border-emerald-200/70 bg-emerald-50/40 p-5",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-950">Rekomendasi AI</p>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-medium",
                priorityClass[priority],
              )}
            >
              Prioritas {priority}
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-emerald-950">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-emerald-900/90">{detail}</p>
          {action ? <div className="mt-4">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}

type DsAiInsightProps = {
  label: string;
  value: string;
  trend?: "naik" | "turun" | "stabil";
  className?: string;
};

const trendLabel = {
  naik: "Naik",
  turun: "Turun",
  stabil: "Stabil",
} as const;

export function DsAiInsight({ label, value, trend = "stabil", className }: DsAiInsightProps) {
  return (
    <div className={cn(designSystemPanelClass, "p-4", className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-cyan-700">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">Tren {trendLabel[trend]}</p>
    </div>
  );
}
