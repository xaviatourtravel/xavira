import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FollowUpTaskTitle } from "@/components/leads/follow-up-task-title";
import type { LeadFollowUpHistoryItem } from "@/lib/leads/lead-customer-360";
import { cn } from "@/lib/utils";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function groupFollowUps(tasks: LeadFollowUpHistoryItem[]) {
  return {
    overdue: tasks.filter((task) => task.isOverdue),
    pending: tasks.filter((task) => task.isPending && !task.isOverdue),
    completed: tasks.filter((task) => task.isCompleted),
  };
}

function FollowUpSection({
  title,
  tasks,
  tone,
  leadId,
  completeFollowUpTask,
}: {
  title: string;
  tasks: LeadFollowUpHistoryItem[];
  tone: "danger" | "default" | "muted";
  leadId: string;
  completeFollowUpTask: (formData: FormData) => Promise<void>;
}) {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              "rounded-lg border p-3",
              tone === "danger" && "border-red-200 bg-red-50/60",
              tone === "default" && "bg-background",
              tone === "muted" && "bg-muted/20",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <FollowUpTaskTitle title={task.title} titleClassName="text-sm font-medium" />
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">
                  {task.priorityLabel}
                </span>
                {task.isPending ? (
                  <form action={completeFollowUpTask}>
                    <input type="hidden" name="lead_id" value={leadId} />
                    <input type="hidden" name="task_id" value={task.id} />
                    <button
                      type="submit"
                      className="rounded bg-emerald-600 px-2 py-1 text-[10px] font-medium text-white"
                    >
                      Complete
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
            {task.description ? (
              <p className="mt-1 text-xs text-muted-foreground">{task.description}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <span>Due {formatDateTime(task.dueDate)}</span>
              <span>Assigned: {task.assignedToName ?? "Unassigned"}</span>
              <span className="capitalize">{task.status.replace(/_/g, " ")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LeadFollowUpHistoryCard({
  followUpTasks,
  leadId,
  completeFollowUpTask,
}: {
  followUpTasks: LeadFollowUpHistoryItem[];
  leadId: string;
  completeFollowUpTask: (formData: FormData) => Promise<void>;
}) {
  const groups = groupFollowUps(followUpTasks);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Follow up history</CardTitle>
        <CardDescription>
          Pending, overdue, and completed follow-ups for this lead.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {followUpTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No follow-ups scheduled yet.
          </p>
        ) : (
          <>
            <FollowUpSection
              title="Overdue"
              tasks={groups.overdue}
              tone="danger"
              leadId={leadId}
              completeFollowUpTask={completeFollowUpTask}
            />
            <FollowUpSection
              title="Pending"
              tasks={groups.pending}
              tone="default"
              leadId={leadId}
              completeFollowUpTask={completeFollowUpTask}
            />
            <FollowUpSection
              title="Completed"
              tasks={groups.completed}
              tone="muted"
              leadId={leadId}
              completeFollowUpTask={completeFollowUpTask}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
