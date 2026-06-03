import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardPage() {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const today = new Date();
  const todayStart = new Date();
todayStart.setHours(0, 0, 0, 0);

const todayEnd = new Date();
todayEnd.setHours(23, 59, 59, 999);

const [
  { count: totalLeads },
  { count: pendingFollowUps },
  { count: overdueFollowUps },
  { data: todayFollowUps },
] = await Promise.all([
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null),

    supabase
      .from("follow_up_tasks")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .eq("status", "pending"),

    supabase
      .from("follow_up_tasks")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .eq("status", "pending")
      .lt("due_date", today.toISOString()),
      supabase
  .from("follow_up_tasks")
  .select(`
    id,
    title,
    due_date,
    lead_id,
    leads (
      full_name,
      package_interest
    )
  `)
  .eq("organization_id", profile.organization_id)
  .eq("status", "pending")
  .gte("due_date", todayStart.toISOString())
  .lte("due_date", todayEnd.toISOString())
  .order("due_date", { ascending: true }),
  ]);

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold">
          Dashboard
        </h1>

        <p className="text-muted-foreground">
          Ringkasan aktivitas CRM Xavira.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">

        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">
            Total Leads
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {totalLeads ?? 0}
          </h2>
        </div>

        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">
            Follow Up Pending
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {pendingFollowUps ?? 0}
          </h2>
        </div>

        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">
            Follow Up Terlambat
          </p>

          <h2 className="mt-2 text-3xl font-bold text-red-600">
            {overdueFollowUps ?? 0}
          </h2>
        </div>

        <div className="rounded-xl border p-6">
  <p className="text-sm text-muted-foreground">
    Follow Up Hari Ini
  </p>

  <h2 className="mt-2 text-3xl font-bold text-blue-600">
    {todayFollowUps?.length ?? 0}
  </h2>
</div>

      </div>
      <div className="rounded-xl border p-6">
  <h2 className="text-lg font-semibold">
    Follow Up Hari Ini
  </h2>

  <p className="mb-4 text-sm text-muted-foreground">
    Prioritas follow up yang harus dilakukan hari ini.
  </p>

  {todayFollowUps?.length ? (
    <div className="space-y-3">

      {todayFollowUps.map((task: any) => (
        <div
          key={task.id}
          className="rounded-lg border p-4"
        >
          <div className="flex justify-between">

            <div>
              <p className="font-medium">
                {task.leads?.full_name ?? "Lead"}
              </p>

              <p className="text-sm text-muted-foreground">
                {task.title}
              </p>

              <p className="text-xs text-muted-foreground">
                {task.leads?.package_interest ?? "-"}
              </p>
            </div>

            <div className="text-right text-sm">
              {new Date(task.due_date).toLocaleTimeString(
                "id-ID",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
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

    </div>
  );
}