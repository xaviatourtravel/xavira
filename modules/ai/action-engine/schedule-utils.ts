import type { AIAction } from "@/modules/ai/action-engine/types";

export function resolveScheduledFor(action: AIAction): Date | null {
  const raw =
    (typeof action.payload.scheduledFor === "string"
      ? action.payload.scheduledFor
      : null) ??
    (typeof (action as AIAction & { scheduledFor?: string }).scheduledFor ===
    "string"
      ? (action as AIAction & { scheduledFor?: string }).scheduledFor
      : null);

  if (!raw?.trim()) {
    return null;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isScheduledInFuture(action: AIAction, now = new Date()): boolean {
  const scheduled = resolveScheduledFor(action);
  return scheduled !== null && scheduled.getTime() > now.getTime();
}

export function formatScheduledActionTime(scheduledFor: string): string {
  const date = new Date(scheduledFor);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatScheduledFollowUpLabel(scheduledFor: string): string {
  const date = new Date(scheduledFor);
  if (Number.isNaN(date.getTime())) {
    return "AI follow-up scheduled";
  }

  const now = new Date();
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfTarget = new Date(date);
  startOfTarget.setHours(0, 0, 0, 0);

  const dayDiff = Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (dayDiff === 0) {
    return `AI follow-up scheduled today at ${time}`;
  }
  if (dayDiff === 1) {
    return `AI follow-up scheduled tomorrow at ${time}`;
  }

  const dayLabel = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);

  return `AI follow-up scheduled ${dayLabel} at ${time}`;
}
