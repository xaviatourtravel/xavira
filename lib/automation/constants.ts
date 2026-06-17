export const QUEUE_PRIORITIES = ["critical", "high", "medium", "low"] as const;

export type QueuePriority = (typeof QUEUE_PRIORITIES)[number];

const QUEUE_PRIORITY_LABELS: Record<QueuePriority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const QUEUE_PRIORITY_ORDER: Record<QueuePriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function formatQueuePriorityLabel(priority: QueuePriority) {
  return QUEUE_PRIORITY_LABELS[priority];
}

export function getQueuePrioritySortOrder(priority: QueuePriority) {
  return QUEUE_PRIORITY_ORDER[priority];
}

export function getQueuePriorityBadgeClass(priority: QueuePriority) {
  switch (priority) {
    case "critical":
      return "bg-red-100 text-red-800";
    case "high":
      return "bg-orange-100 text-orange-800";
    case "medium":
      return "bg-amber-100 text-amber-800";
    case "low":
      return "bg-slate-100 text-slate-700";
  }
}

export const TEMPERATURE_OVERDUE_THRESHOLDS = {
  hot: 1,
  warm: 3,
  cold: 7,
} as const;
