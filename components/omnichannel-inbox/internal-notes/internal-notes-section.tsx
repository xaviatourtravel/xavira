"use client";

import { useRef, useState } from "react";
import { NotebookPen, Plus } from "lucide-react";

import {
  AURORA_CONTEXT_CARD_CLASS,
  AURORA_INTERNAL_NOTES_ADD_BUTTON,
  AURORA_INTERNAL_NOTES_LIST_GAP,
} from "@/components/workspace/aurora-tokens";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { cn } from "@/lib/utils";

import { AddInternalNoteSheet } from "./add-internal-note-sheet";
import { InternalNoteCard } from "./internal-note-card";
import { InternalNotesEmptyState } from "./internal-notes-empty-state";
import { useInternalNotesState } from "./use-internal-notes-state";

const SECTION_ICON_CLASS = "h-4 w-4 shrink-0 text-muted-foreground/55";
const SECTION_TITLE_CLASS = "text-[13px] font-semibold tracking-tight text-foreground";

type InternalNotesSectionProps = {
  conversationId: string;
  className?: string;
};

export function InternalNotesSection({
  conversationId,
  className,
}: InternalNotesSectionProps) {
  const { ti } = useInboxTranslation();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { getNotes, addNote } = useInternalNotesState(ti("internalNotesAuthorYou"));

  const notes = getNotes(conversationId);

  function openSheet() {
    setSheetOpen(true);
  }

  function handleSave(content: string) {
    addNote({
      subjectId: conversationId,
      body: content,
    });
  }

  return (
    <>
      <section className={cn(AURORA_CONTEXT_CARD_CLASS, className)}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <NotebookPen className={SECTION_ICON_CLASS} aria-hidden strokeWidth={1.75} />
            <h3 className={SECTION_TITLE_CLASS}>
              {ti("contextPanelNotes")}
              <span className="font-normal text-muted-foreground/65">
                {" "}
                · {notes.length}
              </span>
            </h3>
          </div>

          <button
            ref={addButtonRef}
            type="button"
            aria-label={ti("internalNotesAddAria")}
            onClick={openSheet}
            className={AURORA_INTERNAL_NOTES_ADD_BUTTON}
          >
            <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </button>
        </div>

        {notes.length === 0 ? (
          <InternalNotesEmptyState onAdd={openSheet} />
        ) : (
          <div className={AURORA_INTERNAL_NOTES_LIST_GAP}>
            {notes.map((note) => (
              <InternalNoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </section>

      <AddInternalNoteSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSave={handleSave}
        returnFocusRef={addButtonRef}
      />
    </>
  );
}
