import type { AssignmentHistoryEntry } from "@/types/omnichannel-inbox";

import type { AssignmentEvent, OwnershipHistoryEntry } from "../owner";

export function mapAssignmentEventFromHistoryEntry(
  entry: AssignmentHistoryEntry,
): AssignmentEvent {
  return {
    id: entry.id,
    assignedFromId: entry.assignedFromId,
    assignedFromName: entry.assignedFromName,
    assignedToId: entry.assignedToId,
    assignedToName: entry.assignedToName,
    assignedByName: entry.assignedByName,
    createdAt: entry.createdAt,
  };
}

export function mapOwnershipHistoryFromAssignmentEvent(
  event: AssignmentEvent,
): OwnershipHistoryEntry {
  const assigneeName = event.assignedToName ?? "Unassigned";
  const label = event.assignedFromName
    ? `Transferred to ${assigneeName}`
    : `Assigned to ${assigneeName}`;

  return {
    id: event.id,
    label,
    timestamp: new Date(event.createdAt).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }),
    createdAt: event.createdAt,
    assignedAt: event.createdAt,
    assignedBy: event.assignedByName,
  };
}

export function mapAssignmentEventsFromHistoryEntries(
  entries: AssignmentHistoryEntry[],
): AssignmentEvent[] {
  return entries.map(mapAssignmentEventFromHistoryEntry);
}

export function mapOwnershipHistoryFromAssignmentEvents(
  events: AssignmentEvent[],
): OwnershipHistoryEntry[] {
  return events.map(mapOwnershipHistoryFromAssignmentEvent);
}
