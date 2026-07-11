"use client";

import {
  AURORA_ASSIGNMENT_HISTORY_DOT,
  AURORA_ASSIGNMENT_HISTORY_ITEM,
  AURORA_ASSIGNMENT_HISTORY_LABEL,
  AURORA_ASSIGNMENT_HISTORY_LINE,
  AURORA_ASSIGNMENT_HISTORY_TIME,
} from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

import type { OwnershipHistoryEntry } from "./types";

type OwnershipHistoryProps = {
  history: OwnershipHistoryEntry[];
  title: string;
  className?: string;
};

export function OwnershipHistory({ history, title, className }: OwnershipHistoryProps) {
  if (history.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="ownership-history-heading" className={cn("mt-4", className)}>
      <h4
        id="ownership-history-heading"
        className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/50"
      >
        {title}
      </h4>
      <ol className="relative mt-3">
        {history.map((entry, index) => (
          <li key={entry.id} className={AURORA_ASSIGNMENT_HISTORY_ITEM}>
            <div className="relative flex w-4 shrink-0 flex-col items-center self-stretch">
              <span className={AURORA_ASSIGNMENT_HISTORY_DOT} aria-hidden />
              {index < history.length - 1 ? (
                <span className={AURORA_ASSIGNMENT_HISTORY_LINE} aria-hidden />
              ) : null}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <p className={AURORA_ASSIGNMENT_HISTORY_LABEL}>{entry.label}</p>
              <p className={AURORA_ASSIGNMENT_HISTORY_TIME}>{entry.timestamp}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
