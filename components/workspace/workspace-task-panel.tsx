import Link from "next/link";
import type { ReactNode } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { WorkspaceEmptyState } from "./workspace-empty-state";
import {
  getWorkspacePriorityToneClass,
  getWorkspaceStatusToneClass,
  workspaceCardClass,
} from "./styles";
import type { WorkspaceTaskActionPreset, WorkspaceTaskItem } from "./types";

type WorkspaceTaskPanelProps = {
  tasks: WorkspaceTaskItem[];
  title?: string;
  description?: string;
  emptyMessage?: string;
  className?: string;
  headerAction?: ReactNode;
};

function formatDueDate(value: string | null | undefined) {
  if (!value) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

type WorkspaceTaskActionButtonProps = {
  preset: WorkspaceTaskActionPreset;
  href?: string;
  onClick?: () => void;
  label?: string;
  className?: string;
};

const PRESET_LABELS: Record<WorkspaceTaskActionPreset, string> = {
  reply: "Reply",
  open: "Open",
  complete: "Complete",
  skip: "Skip",
};

export function WorkspaceTaskActionButton({
  preset,
  href,
  onClick,
  label,
  className,
}: WorkspaceTaskActionButtonProps) {
  const resolvedLabel = label ?? PRESET_LABELS[preset];

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          buttonVariants({
            variant: preset === "complete" ? "default" : "outline",
            size: "sm",
          }),
          className,
        )}
      >
        {resolvedLabel}
      </Link>
    );
  }

  return (
    <Button
      type="button"
      variant={preset === "complete" ? "default" : preset === "skip" ? "ghost" : "outline"}
      size="sm"
      className={cn(preset === "skip" && "text-muted-foreground", className)}
      onClick={onClick}
    >
      {resolvedLabel}
    </Button>
  );
}

export function WorkspaceTaskActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-end gap-2">{children}</div>;
}

function WorkspaceTaskCard({ task }: { task: WorkspaceTaskItem }) {
  return (
    <article
      className={cn(
        workspaceCardClass,
        "p-4 transition-colors hover:border-border hover:shadow-md",
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {task.priority ? (
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                  getWorkspacePriorityToneClass(task.priority),
                )}
              >
                {task.priority}
              </span>
            ) : null}
            {task.status ? (
              <span className={getWorkspaceStatusToneClass(task.statusTone ?? "default")}>
                {task.status}
              </span>
            ) : null}
          </div>

          <div>
            <h3 className="text-sm font-semibold leading-snug">{task.title}</h3>
            {task.subtitle ? (
              <p className="mt-1 text-sm text-muted-foreground">{task.subtitle}</p>
            ) : null}
          </div>

          <p className="text-xs text-muted-foreground">{formatDueDate(task.dueDate)}</p>
        </div>

        {task.actions ? <div className="shrink-0">{task.actions}</div> : null}
      </div>
    </article>
  );
}

export function WorkspaceTaskPanel({
  tasks,
  title = "Tasks",
  description,
  emptyMessage = "Nothing requires your attention.",
  className,
  headerAction,
}: WorkspaceTaskPanelProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {headerAction}
      </div>

      {tasks.length === 0 ? (
        <WorkspaceEmptyState preset="tasks" title={emptyMessage} />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <WorkspaceTaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </section>
  );
}
