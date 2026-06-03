import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardPage() {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const today = new Date();

  const [
    { count: totalLeads },
    { count: pendingFollowUps },
    { count: overdueFollowUps },
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

      <div className="grid gap-4 md:grid-cols-3">

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

      </div>

    </div>
  );
}