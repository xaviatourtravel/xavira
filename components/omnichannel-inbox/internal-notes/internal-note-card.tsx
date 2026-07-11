"use client";

import { ClientOnlyRelativeTime } from "@/components/omnichannel-inbox/client-only-relative-time";
import { AURORA_INTERNAL_NOTES_CARD } from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

import type { InternalNote } from "./types";

type InternalNoteCardProps = {
  note: InternalNote;
  className?: string;
};

export function InternalNoteCard({ note, className }: InternalNoteCardProps) {
  return (
    <article className={cn(AURORA_INTERNAL_NOTES_CARD, className)}>
      <header className="mb-2 flex items-baseline justify-between gap-3">
        <p className="truncate text-sm font-semibold text-foreground">{note.author.name}</p>
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
  );
}
