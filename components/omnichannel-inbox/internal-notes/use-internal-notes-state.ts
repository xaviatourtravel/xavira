"use client";

import { useCallback, useState } from "react";

import type { CreateInternalNoteInput, InternalNote, InternalNoteAuthor } from "./types";

const DEFAULT_AUTHOR: InternalNoteAuthor = {
  id: "local-user",
  name: "You",
};

function createLocalNote(
  input: CreateInternalNoteInput,
  authorName: string,
): InternalNote {
  const timestamp = new Date().toISOString();
  const author = input.author ?? {
    ...DEFAULT_AUTHOR,
    name: authorName,
  };

  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `note-${Date.now()}`,
    subjectId: input.subjectId,
    author,
    body: input.body.trim(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function useInternalNotesState(authorName = DEFAULT_AUTHOR.name) {
  const [notesByConversation, setNotesByConversation] = useState<
    Record<string, InternalNote[]>
  >({});

  const getNotes = useCallback(
    (conversationId: string) => notesByConversation[conversationId] ?? [],
    [notesByConversation],
  );

  const addNote = useCallback(
    (input: CreateInternalNoteInput) => {
      const note = createLocalNote(input, authorName);

      setNotesByConversation((current) => ({
        ...current,
        [input.subjectId]: [note, ...(current[input.subjectId] ?? [])],
      }));

      return note;
    },
    [authorName],
  );

  return {
    getNotes,
    addNote,
  };
}
