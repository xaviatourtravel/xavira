import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type DsTimelineItem = {
  id: string;
  title: string;
  description: string;
  occurredAt: string;
  category: string;
  tone?: string;
  icon?: LucideIcon;
};

type DsTimelineProps = {
  items: DsTimelineItem[];
  className?: string;
};

export function DsTimeline({ items, className }: DsTimelineProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Belum ada aktivitas. Aktivitas customer akan muncul di sini.
      </p>
    );
  }

  return (
    <ol className={cn("relative space-y-0", className)}>
      <div
        aria-hidden
        className="absolute bottom-2 left-[18px] top-2 w-px bg-slate-200"
      />
      {items.map((item) => (
        <li key={item.id} className="relative flex gap-4 pb-5 last:pb-0">
          <div className="relative z-10 mt-0.5">
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-semibold",
                item.tone ?? "bg-slate-100 text-slate-700",
              )}
            >
              {item.category.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">{item.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-600">
                  {item.description}
                </p>
              </div>
              <time className="shrink-0 text-[11px] tabular-nums text-slate-400">
                {item.occurredAt}
              </time>
            </div>
            <p className="mt-1 text-[11px] font-medium text-slate-400">{item.category}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
