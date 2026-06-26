"use client";

import Link from "next/link";
import { CalendarClock, ChevronRight, ExternalLink } from "lucide-react";

import {
  completeTodayTaskAction,
  skipTodayTaskAction,
} from "@/app/(dashboard)/today/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DerivedTaskBadge,
  TaskPriorityBadge,
  TaskTypeBadge,
} from "@/components/today/task-badges";
import type { WorkspaceTask } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TodayTaskCardProps = {
  task: WorkspaceTask;
  compact?: boolean;
};

function formatDueTime(dueAt: string | null) {
  if (!dueAt) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(dueAt));
}

function PrimaryActionButton({ task }: { task: WorkspaceTask }) {
  const action = task.primaryAction;

  if (action.kind === "mark_done") {
    return (
      <form action={completeTodayTaskAction}>
        <input type="hidden" name="task_id" value={task.id} />
        <Button type="submit" size="sm">
          Mark Done
        </Button>
      </form>
    );
  }

  return (
    <Link
      href={action.href}
      className={cn(buttonVariants({ size: "sm" }))}
    >
      {action.label}
      <ChevronRight className="h-4 w-4" />
    </Link>
  );
}

export function TodayTaskCard({ task, compact = false }: TodayTaskCardProps) {
  const isOverdue = task.status === "overdue";

  return (
    <article
      className={cn(
        "group rounded-xl border bg-card shadow-sm transition-all hover:border-primary/25 hover:shadow-md",
        isOverdue && "border-red-200/80",
        compact ? "p-4" : "p-5",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <TaskTypeBadge taskType={task.taskType} />
            <TaskPriorityBadge priority={task.priority} />
            {task.isDerived ? <DerivedTaskBadge /> : null}
            {isOverdue ? (
              <span className="inline-flex rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                Overdue
              </span>
            ) : null}
          </div>

          <div>
            <h3 className={cn("font-semibold leading-snug", compact ? "text-sm" : "text-base")}>
              {task.title}
            </h3>
            {task.customerName ? (
              <p className="mt-1 text-sm text-muted-foreground">{task.customerName}</p>
            ) : null}
            {!compact && task.description ? (
              <p className="mt-2 text-sm text-muted-foreground">{task.description}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" />
              {formatDueTime(task.dueAt)}
            </span>
            {task.sourceLinks.map((link) => (
              <Link
                key={`${link.type}-${link.id}`}
                href={link.href}
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                {link.label}
              </Link>
            ))}
          </div>

          {task.isDerived ? (
            <p className="text-xs text-muted-foreground">
              Open source record to resolve this task.
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <PrimaryActionButton task={task} />
          {!task.isDerived ? (
            <form action={skipTodayTaskAction}>
              <input type="hidden" name="task_id" value={task.id} />
              <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">
                Skip
              </Button>
            </form>
          ) : null}
        </div>
      </div>
    </article>
  );
}
