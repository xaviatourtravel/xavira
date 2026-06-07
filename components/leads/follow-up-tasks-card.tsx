import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FollowUpTaskTitle } from "@/components/leads/follow-up-task-title";

export type FollowUpTaskItem = {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  status: string;
};

type FollowUpTasksCardProps = {
  leadId: string;
  followUpTasks: FollowUpTaskItem[];
  completeFollowUpTask: (formData: FormData) => Promise<void>;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function FollowUpTasksCard({
  leadId,
  followUpTasks,
  completeFollowUpTask,
}: FollowUpTasksCardProps) {
  return (
    <Card>
  <CardHeader>
    <CardTitle>Follow Up Terjadwal</CardTitle>
    <CardDescription>
      Daftar follow up yang harus dilakukan.
    </CardDescription>
  </CardHeader>

  <CardContent>
    {followUpTasks.length === 0 ? (
      <p className="text-sm text-muted-foreground">
        Belum ada follow up terjadwal.
      </p>
    ) : (
      <div className="space-y-3">
        {followUpTasks.map((task) => (
          <div
            key={task.id}
            className="rounded-lg border p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <FollowUpTaskTitle
                title={task.title}
                titleClassName="font-medium"
              />

              <div className="flex shrink-0 items-center gap-2">

    <span className="text-xs rounded bg-slate-100 px-2 py-1">
      {task.status}
    </span>

    {task.status !== "completed" && (
      <form action={completeFollowUpTask}>
        <input
          type="hidden"
          name="lead_id"
          value={leadId}
        />

        <input
          type="hidden"
          name="task_id"
          value={task.id}
        />

        <button
          type="submit"
          className="rounded bg-green-600 px-2 py-1 text-xs text-white"
        >
          ✓ Selesai
        </button>
      </form>
    )}

  </div>
</div>

            {task.description && (
              <p className="mt-2 text-sm text-muted-foreground">
                {task.description}
              </p>
            )}

            <p className="mt-2 text-xs text-muted-foreground">
              {formatDateTime(task.due_date)}
            </p>
          </div>
        ))}
      </div>
    )}
  </CardContent>
</Card>
  );
}
