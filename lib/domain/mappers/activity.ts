import type { Activity, ActivityRow, ActivityType } from "../activity";
import type { InternalNote, InternalNoteRow } from "../internal-note";

export function mapActivityFromRow(
  row: ActivityRow,
  subjectId: string,
  type: ActivityType = "activity",
): Activity {
  return {
    id: row.id,
    type,
    subjectId,
    title: row.title?.trim() || row.activity_type,
    description: row.body?.trim() || undefined,
    actor: row.actorName
      ? {
          id: row.id,
          name: row.actorName,
        }
      : undefined,
    occurredAt: row.occurred_at,
    metadata: row.metadata ?? undefined,
  };
}

export function mapActivityToCustomerTimelineEvent(activity: Activity) {
  return {
    id: activity.id,
    type: activity.type,
    conversationId: activity.subjectId,
    title: activity.title,
    description: activity.description,
    actor: activity.actor,
    createdAt: activity.occurredAt,
    metadata: activity.metadata,
  };
}

export function mapCustomerTimelineEventToActivity(event: {
  id: string;
  type: ActivityType;
  conversationId: string;
  title: string;
  description?: string;
  actor?: { id: string; name: string };
  createdAt: string;
  metadata?: Record<string, unknown>;
}): Activity {
  return {
    id: event.id,
    type: event.type,
    subjectId: event.conversationId,
    title: event.title,
    description: event.description,
    actor: event.actor,
    occurredAt: event.createdAt,
    metadata: event.metadata,
  };
}

export function mapInternalNoteFromRow(
  row: InternalNoteRow,
  author: { id: string; name: string },
): InternalNote {
  return {
    id: row.id,
    subjectId: row.conversation_id,
    author,
    body: row.note,
    createdAt: row.created_at,
    updatedAt: row.created_at,
  };
}

export function mapInternalNoteToLegacyShape(note: InternalNote) {
  return {
    id: note.id,
    conversationId: note.subjectId,
    author: note.author,
    content: note.body,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

export function mapLegacyInternalNoteToDomain(note: {
  id: string;
  conversationId: string;
  author: { id: string; name: string };
  content: string;
  createdAt: string;
  updatedAt: string;
}): InternalNote {
  return {
    id: note.id,
    subjectId: note.conversationId,
    author: note.author,
    body: note.content,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}
