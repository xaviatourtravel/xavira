import type { TimelineDateGroupId } from "./types";

export function formatTimelineEventTime(
  timestamp: string,
  groupId: TimelineDateGroupId,
): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  if (groupId === "today") {
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const day = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

  const time = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${day} · ${time}`;
}
