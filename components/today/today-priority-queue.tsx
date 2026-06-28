import { TodayActionButton } from "@/components/today/today-action-button";
import { TaskPriorityBadge } from "@/components/today/task-badges";
import type { PriorityQueueGroup, WorkspaceTask } from "@/lib/tasks/types";
import { formatEstimatedDuration, estimateTaskMinutes } from "@/lib/tasks/today-intelligence";

type TodayPriorityQueueProps = {
  groups: PriorityQueueGroup[];
};

function QueueItem({ task }: { task: WorkspaceTask }) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-slate-200/70 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <TaskPriorityBadge priority={task.priority} />
          <span className="text-xs text-slate-500">
            {formatEstimatedDuration(estimateTaskMinutes(task))}
          </span>
        </div>
        <p className="mt-2 text-sm font-semibold text-slate-950">{task.title}</p>
        {task.customerName ? (
          <p className="mt-0.5 text-xs text-slate-500">{task.customerName}</p>
        ) : null}
      </div>
      <TodayActionButton task={task} />
    </article>
  );
}

export function TodayPriorityQueueSection({ groups }: TodayPriorityQueueProps) {
  const totalTasks = groups.reduce((sum, group) => sum + group.tasks.length, 0);

  return (
    <section id="priority-queue" className="scroll-mt-24 space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Antrian Prioritas
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-950">
          Antrian kerja hari ini
          {totalTasks > 0 ? (
            <span className="ml-2 text-base font-normal text-slate-500">
              ({totalTasks} item)
            </span>
          ) : null}
        </h2>
      </div>

      {totalTasks === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-slate-900">Antrian kosong</p>
          <p className="mt-1 text-sm text-slate-500">
            Semua pekerjaan prioritas sudah tertangani.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          {groups.map((group) => (
            <div
              key={group.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="mb-4 border-b border-slate-100 pb-3">
                <h3 className="text-sm font-semibold text-slate-950">{group.label}</h3>
                <p className="mt-0.5 text-xs text-slate-500">{group.description}</p>
              </div>

              {group.tasks.length === 0 ? (
                <p className="text-sm text-slate-500">Tidak ada item.</p>
              ) : (
                <div className="space-y-3">
                  {group.tasks.slice(0, 4).map((task) => (
                    <QueueItem key={task.id} task={task} />
                  ))}
                  {group.tasks.length > 4 ? (
                    <p className="text-xs text-slate-400">
                      +{group.tasks.length - 4} item lainnya
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
