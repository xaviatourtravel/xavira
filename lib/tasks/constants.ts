export const TASK_TYPES = [
  "reply_conversation",
  "follow_up_customer",
  "confirm_payment",
  "request_passport",
  "complete_participant_data",
  "create_booking",
  "send_payment_reminder",
  "review_ai_suggestion",
  "resolve_inbox_unread",
  "custom",
] as const;

export type TaskType = (typeof TASK_TYPES)[number];

export const TASK_STATUSES = [
  "open",
  "in_progress",
  "completed",
  "skipped",
  "overdue",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const ACTIVE_TASK_STATUSES: TaskStatus[] = ["open", "in_progress", "overdue"];

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  reply_conversation: "Reply Customer",
  follow_up_customer: "Follow Up",
  confirm_payment: "Confirm Payment",
  request_passport: "Request Passport",
  complete_participant_data: "Complete Data",
  create_booking: "Create Booking",
  send_payment_reminder: "Payment Reminder",
  review_ai_suggestion: "AI Suggestion",
  resolve_inbox_unread: "Unread Inbox",
  custom: "Custom",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
  skipped: "Skipped",
  overdue: "Overdue",
};

export function isTaskType(value: string): value is TaskType {
  return TASK_TYPES.includes(value as TaskType);
}

export function isTaskStatus(value: string): value is TaskStatus {
  return TASK_STATUSES.includes(value as TaskStatus);
}

export function isTaskPriority(value: string): value is TaskPriority {
  return TASK_PRIORITIES.includes(value as TaskPriority);
}

export function formatTaskTypeLabel(taskType: string) {
  if (isTaskType(taskType)) {
    return TASK_TYPE_LABELS[taskType];
  }

  return taskType.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatTaskPriorityLabel(priority: string) {
  if (isTaskPriority(priority)) {
    return TASK_PRIORITY_LABELS[priority];
  }

  return priority;
}

export function formatTaskStatusLabel(status: string) {
  if (isTaskStatus(status)) {
    return TASK_STATUS_LABELS[status];
  }

  return status;
}
