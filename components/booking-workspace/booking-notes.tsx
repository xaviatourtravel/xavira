"use client";

import { ClientOnlyRelativeTime } from "@/components/omnichannel-inbox/client-only-relative-time";
import {
  AURORA_BOOKING_CARD,
  AURORA_BOOKING_CARD_BODY,
  AURORA_BOOKING_CARD_HEADER,
  AURORA_BOOKING_CARD_TITLE,
  AURORA_BOOKING_NOTE_CARD,
} from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

import type { BookingNote, BookingWorkspaceLabels } from "./types";

type BookingNotesProps = {
  notes: BookingNote[];
  labels: BookingWorkspaceLabels;
  className?: string;
};

export function BookingNotes({ notes, labels, className }: BookingNotesProps) {
  return (
    <section className={cn(AURORA_BOOKING_CARD, className)}>
      <header className={AURORA_BOOKING_CARD_HEADER}>
        <h2 className={AURORA_BOOKING_CARD_TITLE}>{labels.internalNotes}</h2>
      </header>
      <div className={cn(AURORA_BOOKING_CARD_BODY, "space-y-3")}>
        {notes.map((note) => (
          <article key={note.id} className={AURORA_BOOKING_NOTE_CARD}>
            <header className="mb-2 flex items-baseline justify-between gap-3">
              <p className="truncate text-sm font-semibold text-foreground">{note.author}</p>
              <ClientOnlyRelativeTime
                date={note.createdAt}
                className="shrink-0 text-xs text-muted-foreground/70"
                emptyLabel="—"
              />
            </header>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
              {note.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
