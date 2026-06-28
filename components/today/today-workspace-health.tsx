import Link from "next/link";
import { AlertTriangle, CheckCircle2, Circle } from "lucide-react";

import type { WorkspaceHealthIndicator, WorkspaceHealthStatus } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TodayWorkspaceHealthProps = {
  indicators: WorkspaceHealthIndicator[];
};

const STATUS_CONFIG: Record<
  WorkspaceHealthStatus,
  { label: string; icon: typeof CheckCircle2; dot: string; text: string }
> = {
  healthy: {
    label: "Sehat",
    icon: CheckCircle2,
    dot: "bg-emerald-500",
    text: "text-emerald-700",
  },
  attention: {
    label: "Perlu perhatian",
    icon: Circle,
    dot: "bg-amber-400",
    text: "text-amber-700",
  },
  critical: {
    label: "Prioritas",
    icon: AlertTriangle,
    dot: "bg-red-500",
    text: "text-red-700",
  },
};

export function TodayWorkspaceHealthSection({
  indicators,
}: TodayWorkspaceHealthProps) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Workspace Health
        </p>
        <h2 className="mt-1 text-base font-semibold text-slate-950">
          Kondisi operasional hari ini
        </h2>
      </div>

      <ul className="space-y-2">
        {indicators.map((indicator) => {
          const config = STATUS_CONFIG[indicator.status];
          const Icon = config.icon;

          return (
            <li key={indicator.id}>
              <Link
                href={indicator.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50"
              >
                <span
                  className={cn("h-2 w-2 shrink-0 rounded-full", config.dot)}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{indicator.label}</p>
                  <p className="truncate text-xs text-slate-500">{indicator.detail}</p>
                </div>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 text-[11px] font-medium",
                    config.text,
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {config.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
