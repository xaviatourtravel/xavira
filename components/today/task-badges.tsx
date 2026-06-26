import { cn } from "@/lib/utils";
import {
  formatTaskPriorityLabel,
  formatTaskTypeLabel,
  type TaskPriority,
  type TaskType,
} from "@/lib/tasks/constants";

type TaskTypeBadgeProps = {
  taskType: string;
  className?: string;
};

type TaskPriorityBadgeProps = {
  priority: string;
  className?: string;
};

const TYPE_STYLES: Partial<Record<TaskType, string>> = {
  reply_conversation: "bg-violet-100 text-violet-800",
  resolve_inbox_unread: "bg-violet-100 text-violet-800",
  follow_up_customer: "bg-blue-100 text-blue-800",
  confirm_payment: "bg-amber-100 text-amber-800",
  send_payment_reminder: "bg-amber-100 text-amber-800",
  request_passport: "bg-orange-100 text-orange-800",
  complete_participant_data: "bg-orange-100 text-orange-800",
  review_ai_suggestion: "bg-emerald-100 text-emerald-800",
  create_booking: "bg-sky-100 text-sky-800",
  custom: "bg-slate-100 text-slate-800",
};

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: "bg-slate-100 text-slate-700",
  normal: "bg-slate-100 text-slate-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

export function TaskTypeBadge({ taskType, className }: TaskTypeBadgeProps) {
  const style =
    TYPE_STYLES[taskType as TaskType] ?? "bg-slate-100 text-slate-800";

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        style,
        className,
      )}
    >
      {formatTaskTypeLabel(taskType)}
    </span>
  );
}

export function TaskPriorityBadge({ priority, className }: TaskPriorityBadgeProps) {
  const style =
    PRIORITY_STYLES[priority as TaskPriority] ?? PRIORITY_STYLES.normal;

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        style,
        className,
      )}
    >
      {formatTaskPriorityLabel(priority)}
    </span>
  );
}

export function DerivedTaskBadge() {
  return (
    <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      Derived
    </span>
  );
}
