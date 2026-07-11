export type InternalNoteAuthor = {
  id: string;
  name: string;
};

/** Canonical internal note attached to a conversation or customer record. */
export type InternalNote = {
  id: string;
  subjectId: string;
  author: InternalNoteAuthor;
  body: string;
  createdAt: string;
  updatedAt: string;
};

/** Normalized note row shape from omnichannel tables. */
export type InternalNoteRow = {
  id: string;
  conversation_id: string;
  note: string;
  created_by: string;
  created_at: string;
};

export type CreateInternalNoteInput = {
  subjectId: string;
  body: string;
  author?: InternalNoteAuthor;
};
