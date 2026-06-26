import type { TaskPriority, TaskStatus, TaskType } from "@/lib/tasks/constants";

export type TaskSourceType =
  | "conversation"
  | "lead"
  | "booking"
  | "payment"
  | "participant";

export type TaskSourceLink = {
  type: TaskSourceType;
  id: string;
  label: string;
  href: string;
};

export type TaskPrimaryAction =
  | { kind: "reply"; href: string; label: "Reply" }
  | { kind: "open_customer"; href: string; label: "Open Customer" }
  | { kind: "open_booking"; href: string; label: "Open Booking" }
  | { kind: "open_lead"; href: string; label: "Open Lead" }
  | { kind: "mark_done"; label: "Mark Done" };

export type WorkspaceTask = {
  id: string;
  isDerived: boolean;
  title: string;
  description: string | null;
  taskType: TaskType | string;
  status: TaskStatus | string;
  priority: TaskPriority | string;
  dueAt: string | null;
  customerName: string | null;
  customerId: string | null;
  leadId: string | null;
  conversationId: string | null;
  bookingId: string | null;
  paymentId: string | null;
  participantId: string | null;
  sourceLinks: TaskSourceLink[];
  primaryAction: TaskPrimaryAction;
  assignedTo: string | null;
};

export type TodaySummaryMetrics = {
  openTasks: number;
  overdueTasks: number;
  unreadConversations: number;
  paymentsToConfirm: number;
};

export type TodayFocusSection = {
  id: string;
  title: string;
  tasks: WorkspaceTask[];
  emptyLabel: string;
};

export type TodayWorkspaceData = {
  userName: string;
  tasks: WorkspaceTask[];
  summary: TodaySummaryMetrics;
  focusSections: TodayFocusSection[];
  usingDerivedTasks: boolean;
};
