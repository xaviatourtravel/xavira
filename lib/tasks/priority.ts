import type { TaskPriority } from "@/lib/tasks/constants";

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1,
};

export function getPriorityWeight(priority: string) {
  if (priority in PRIORITY_WEIGHT) {
    return PRIORITY_WEIGHT[priority as TaskPriority];
  }

  return 0;
}

export function compareTasksByPriority<
  T extends { priority: string; dueAt: string | null },
>(a: T, b: T) {
  const priorityDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
  if (priorityDiff !== 0) {
    return priorityDiff;
  }

  if (a.dueAt && b.dueAt) {
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  }

  if (a.dueAt) {
    return -1;
  }

  if (b.dueAt) {
    return 1;
  }

  return 0;
}

export function isTaskOverdue(dueAt: string | null, status: string) {
  if (!dueAt) {
    return false;
  }

  if (status === "completed" || status === "skipped") {
    return false;
  }

  return new Date(dueAt).getTime() < Date.now();
}

export function resolveDisplayStatus(status: string, dueAt: string | null) {
  if (status === "completed" || status === "skipped") {
    return status;
  }

  if (isTaskOverdue(dueAt, status)) {
    return "overdue";
  }

  return status;
}
