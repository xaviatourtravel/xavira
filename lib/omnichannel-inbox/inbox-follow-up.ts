import { getTodayLeadDateValue } from "@/lib/leads/lead-date";

export const INBOX_FOLLOW_UP_PRIORITIES = ["low", "normal", "high"] as const;

export type InboxFollowUpPriority = (typeof INBOX_FOLLOW_UP_PRIORITIES)[number];

export type InboxFollowUpTaskMetadata = {
  follow_up_task_id: string;
  priority: InboxFollowUpPriority;
  assigned_to: string | null;
  omnichannel_conversation_id: string | null;
  source: "inbox";
};

const DEFAULT_DUE_TIME = "10:00";

export function getTomorrowDateValue(): string {
  const today = getTodayLeadDateValue();
  const [year, month, day] = today.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day + 1));

  return parsed.toISOString().slice(0, 10);
}

export function getDefaultInboxFollowUpDueTime() {
  return DEFAULT_DUE_TIME;
}

export function parseInboxFollowUpPriority(
  value: string,
): InboxFollowUpPriority {
  const normalized = value.trim().toLowerCase();
  if (
    INBOX_FOLLOW_UP_PRIORITIES.includes(normalized as InboxFollowUpPriority)
  ) {
    return normalized as InboxFollowUpPriority;
  }

  return "normal";
}

export function formatInboxFollowUpPriorityLabel(
  priority: InboxFollowUpPriority,
) {
  switch (priority) {
    case "low":
      return "Low";
    case "high":
      return "High";
    default:
      return "Normal";
  }
}

export function combineInboxFollowUpDueDateTime(
  dueDate: string,
  dueTime: string,
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate.trim())) {
    return null;
  }

  const normalizedTime = dueTime.trim() || DEFAULT_DUE_TIME;
  if (!/^\d{2}:\d{2}$/.test(normalizedTime)) {
    return null;
  }

  const parsed = new Date(`${dueDate.trim()}T${normalizedTime}:00+07:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

export function buildInboxFollowUpDefaultTitle(customerName: string) {
  const name = customerName.trim() || "customer";
  return `Follow up with ${name}`;
}

export function buildInboxFollowUpDefaultNotes(
  channelLabel: string,
  lastMessagePreview: string | null | undefined,
) {
  const lines = [`Source: ${channelLabel}`];

  if (lastMessagePreview?.trim()) {
    lines.push(`Latest message: ${lastMessagePreview.trim()}`);
  }

  return lines.join("\n");
}

export function formatInboxFollowUpDueDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function parseInboxFollowUpTaskMetadata(
  metadata: unknown,
): Partial<InboxFollowUpTaskMetadata> | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const record = metadata as Record<string, unknown>;
  const followUpTaskId = record.follow_up_task_id;

  if (typeof followUpTaskId !== "string" || !followUpTaskId) {
    return null;
  }

  return {
    follow_up_task_id: followUpTaskId,
    priority: parseInboxFollowUpPriority(String(record.priority ?? "normal")),
    assigned_to:
      typeof record.assigned_to === "string" ? record.assigned_to : null,
    omnichannel_conversation_id:
      typeof record.omnichannel_conversation_id === "string"
        ? record.omnichannel_conversation_id
        : null,
    source: "inbox",
  };
}
