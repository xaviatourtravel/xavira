"use client";

import Link from "next/link";
import { useState } from "react";

import { FollowUpTaskTitle } from "@/components/leads/follow-up-task-title";
import type { FollowUpCenterFilter } from "@/lib/follow-ups/list-filters";

export type FollowUpCenterTask = {
  id: string;
  title: string;
  dueDateLabel: string;
  status: string;
  statusLabel: string;
  leadId: string;
  leadName: string;
  whatsAppHref: string | null;
};

type FollowUpCenterTableProps = {
  tasks: FollowUpCenterTask[];
  filter: FollowUpCenterFilter;
  assigned: string;
  completeFollowUpTask: (formData: FormData) => Promise<void>;
};

const inputClassName = "mt-1 w-full rounded-md border px-3 py-2 text-sm";

export function FollowUpCenterTable({
  tasks,
  filter,
  assigned,
  completeFollowUpTask,
}: FollowUpCenterTableProps) {
  const [completingTask, setCompletingTask] =
    useState<FollowUpCenterTask | null>(null);

  return (
    <>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Judul</th>
              <th className="px-4 py-3 font-medium">Nama Lead</th>
              <th className="px-4 py-3 font-medium">Jatuh Tempo</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="border-b last:border-b-0">
                <td className="px-4 py-3">
                  <FollowUpTaskTitle title={task.title} />
                </td>
                <td className="px-4 py-3 font-medium">
                  <Link
                    href={`/leads/${task.leadId}`}
                    className="text-blue-600 hover:underline"
                  >
                    {task.leadName}
                  </Link>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                  {task.dueDateLabel}
                </td>
                <td className="px-4 py-3 capitalize">
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs">
                    {task.statusLabel}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {task.whatsAppHref && (
                      <a
                        href={task.whatsAppHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded bg-green-600 px-2 py-1 text-xs text-white"
                      >
                        WhatsApp
                      </a>
                    )}

                    <Link
                      href={`/leads/${task.leadId}`}
                      className="rounded-md border px-2 py-1 text-xs hover:bg-accent"
                    >
                      Detail Lead
                    </Link>

                    {task.status !== "completed" && (
                      <button
                        type="button"
                        onClick={() => setCompletingTask(task)}
                        className="rounded bg-green-600 px-2 py-1 text-xs text-white"
                      >
                        Selesai
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {completingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Tutup modal"
            onClick={() => setCompletingTask(null)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Selesaikan Follow Up</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {completingTask.title}
            </p>

            <form action={completeFollowUpTask} className="mt-4 space-y-4">
              <input type="hidden" name="lead_id" value={completingTask.leadId} />
              <input type="hidden" name="task_id" value={completingTask.id} />
              <input type="hidden" name="return_filter" value={filter} />
              <input type="hidden" name="return_assigned" value={assigned} />

              <div>
                <label
                  htmlFor="completion_note"
                  className="text-sm font-medium"
                >
                  Catatan hasil follow up
                </label>
                <textarea
                  id="completion_note"
                  name="completion_note"
                  rows={4}
                  className={inputClassName}
                  placeholder="Contoh: Lead minta dihubungi lagi besok sore."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCompletingTask(null)}
                  className="rounded-md border px-4 py-2 text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-green-600 px-4 py-2 text-sm text-white"
                >
                  Simpan & Selesai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
