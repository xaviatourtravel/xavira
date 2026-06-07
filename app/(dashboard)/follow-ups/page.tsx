import Link from "next/link";

import { completeFollowUpTaskFromCenter } from "@/app/(dashboard)/follow-ups/actions";
import { FollowUpsFilters } from "@/components/follow-ups/follow-ups-filters";
import { FollowUpTaskTitle } from "@/components/leads/follow-up-task-title";
import { requireProfile } from "@/lib/auth/session";
import {
  getFollowUpTodayBounds,
  parseFollowUpCenterFilter,
  type FollowUpCenterSearchParams,
} from "@/lib/follow-ups/list-filters";
import { createClient } from "@/utils/supabase/server";

type FollowUpTaskRow = {
  id: string;
  title: string;
  due_date: string;
  status: string;
  lead_id: string;
  leads:
    | { full_name: string | null }
    | { full_name: string | null }[]
    | null;
};

type FollowUpsPageProps = {
  searchParams: Promise<FollowUpCenterSearchParams>;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function getLeadName(
  leads: FollowUpTaskRow["leads"],
) {
  const lead = Array.isArray(leads) ? leads[0] : leads;
  return lead?.full_name ?? "Lead";
}

function getEmptyMessage(filter: ReturnType<typeof parseFollowUpCenterFilter>) {
  switch (filter) {
    case "today":
      return "Tidak ada follow up jatuh tempo hari ini.";
    case "overdue":
      return "Tidak ada follow up yang terlambat.";
    case "completed":
      return "Belum ada follow up yang selesai.";
    default:
      return "Tidak ada follow up pending.";
  }
}

export default async function FollowUpsPage({ searchParams }: FollowUpsPageProps) {
  const { profile } = await requireProfile();
  const supabase = await createClient();
  const params = await searchParams;
  const filter = parseFollowUpCenterFilter(params);
  const { todayStart, todayEnd } = getFollowUpTodayBounds();
  const nowIso = new Date().toISOString();

  let query = supabase
    .from("follow_up_tasks")
    .select(
      `
      id,
      title,
      due_date,
      status,
      lead_id,
      leads (
        full_name
      )
    `,
    )
    .eq("organization_id", profile.organization_id);

  if (filter === "completed") {
    query = query.eq("status", "completed");
  } else {
    query = query.eq("status", "pending");

    if (filter === "today") {
      query = query
        .gte("due_date", todayStart.toISOString())
        .lte("due_date", todayEnd.toISOString());
    } else if (filter === "overdue") {
      query = query.lt("due_date", nowIso);
    }
  }

  const { data: tasks, error } = await query.order("due_date", {
    ascending: filter !== "completed",
  });

  if (error) {
    throw new Error("Gagal memuat data follow up.");
  }

  const rows = (tasks ?? []) as FollowUpTaskRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Follow Up Center</h1>
        <p className="text-sm text-muted-foreground">
          Kelola semua follow up terjadwal untuk organisasi Anda.
        </p>
      </div>

      {params.success && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          {decodeURIComponent(params.success)}
        </div>
      )}

      {params.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(params.error)}
        </div>
      )}

      <FollowUpsFilters activeFilter={filter} />

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <h2 className="text-lg font-medium">Tidak ada follow up</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {getEmptyMessage(filter)}
          </p>
        </div>
      ) : (
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
              {rows.map((task) => (
                <tr key={task.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3">
                    <FollowUpTaskTitle title={task.title} />
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/leads/${task.lead_id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {getLeadName(task.leads)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {formatDateTime(task.due_date)}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs">
                      {formatLabel(task.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/leads/${task.lead_id}`}
                        className="rounded-md border px-2 py-1 text-xs hover:bg-accent"
                      >
                        Detail Lead
                      </Link>

                      {task.status !== "completed" && (
                        <form action={completeFollowUpTaskFromCenter}>
                          <input type="hidden" name="lead_id" value={task.lead_id} />
                          <input type="hidden" name="task_id" value={task.id} />
                          <input
                            type="hidden"
                            name="return_filter"
                            value={filter}
                          />
                          <button
                            type="submit"
                            className="rounded bg-green-600 px-2 py-1 text-xs text-white"
                          >
                            Selesai
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
