"use client";

import { PASSPORT_TIMELINE_KIND_LABELS } from "@/lib/customer-passport/constants";
import { PassportSection } from "@/components/customer-passport/primitives";
import type { CustomerPassport } from "@/lib/customer-passport/types";
import { cn } from "@/lib/utils";

function formatWhen(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const TIMELINE_TONES: Record<
  CustomerPassport["timeline"][number]["kind"],
  string
> = {
  message: "border-emerald-200 bg-emerald-50/50",
  booking: "border-violet-200 bg-violet-50/50",
  invoice: "border-amber-200 bg-amber-50/50",
  payment: "border-teal-200 bg-teal-50/50",
  note: "border-zinc-200 bg-zinc-50/50",
  task: "border-indigo-200 bg-indigo-50/50",
  assignment: "border-sky-200 bg-sky-50/50",
  system: "border-neutral-200 bg-neutral-50/50",
};

export function PassportTimelineSection({
  passport,
  limit = 12,
}: {
  passport: CustomerPassport;
  limit?: number;
}) {
  const entries = passport.timeline.slice(0, limit);

  return (
    <PassportSection number={8} title="Timeline">
      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Activity will appear here — messages, bookings, payments, notes, and
          tasks in one feed.
        </p>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className={cn(
                "rounded-lg border px-3 py-2",
                TIMELINE_TONES[entry.kind],
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {PASSPORT_TIMELINE_KIND_LABELS[entry.kind]}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-foreground">
                    {entry.label}
                  </p>
                  {entry.detail ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {entry.detail}
                    </p>
                  ) : null}
                </div>
                <time className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                  {formatWhen(entry.timestamp)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PassportSection>
  );
}
