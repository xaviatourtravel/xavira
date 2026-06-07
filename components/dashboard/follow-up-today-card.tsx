import Link from "next/link";

import { FollowUpTaskTitle } from "@/components/leads/follow-up-task-title";

export type FollowUpTodayLead = {
  full_name: string | null;
  package_interest: string | null;
  whatsapp_number: string | null;
  phone: string | null;
};

export type FollowUpTodayTask = {
  id: string;
  title: string;
  due_date: string;
  lead_id: string;
  leads: FollowUpTodayLead | null;
};

type FollowUpTodayCardProps = {
  todayFollowUps: FollowUpTodayTask[] | null;
};

export function FollowUpTodayCard({
  todayFollowUps,
}: FollowUpTodayCardProps) {
  return (
    <div className="rounded-xl border p-6">
      <h2 className="text-lg font-semibold">Follow Up Hari Ini</h2>

      <p className="mb-4 text-sm text-muted-foreground">
        Prioritas follow up yang harus dilakukan hari ini.
      </p>

      {todayFollowUps?.length ? (
        <div className="space-y-3">
          {todayFollowUps.map((task) => (
            <div key={task.id} className="rounded-lg border p-4">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {task.leads?.full_name ?? "Lead"}
                  </p>

                  <FollowUpTaskTitle
                    title={task.title}
                    className="text-sm text-muted-foreground"
                  />

                  <p className="text-xs text-muted-foreground">
                    {task.leads?.package_interest ?? "-"}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {(task.leads?.whatsapp_number || task.leads?.phone) && (
                      <a
                        href={`https://wa.me/${(task.leads.whatsapp_number || task.leads.phone)!.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded bg-green-600 px-3 py-1 text-xs text-white"
                      >
                        WhatsApp
                      </a>
                    )}

                    <Link
                      href={`/leads/${task.lead_id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Detail Lead
                    </Link>
                  </div>
                </div>

                <div className="shrink-0 text-right text-sm">
                  {new Date(task.due_date).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Tidak ada follow up hari ini.
        </p>
      )}
    </div>
  );
}
