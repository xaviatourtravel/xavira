import Link from "next/link";

import { FollowUpQueueTable } from "@/components/automation/follow-up-queue-table";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { loadFollowUpQueue } from "@/lib/automation/queue";
import { createClient } from "@/utils/supabase/server";

export default async function FollowUpQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ assigned?: string }>;
}) {
  const params = await searchParams;
  const { profile } = await requireProfile();
  const canViewAll = isAdminOrOwner(profile);
  const assigned = params.assigned?.trim() ?? "";

  const supabase = await createClient();
  const { data: orgProfiles } = canViewAll
    ? await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("organization_id", profile.organization_id)
        .order("full_name")
    : { data: [] as Array<{ id: string; full_name: string }> };

  const validProfileIds = new Set((orgProfiles ?? []).map((member) => member.id));
  let assignedTo: string | undefined = profile.id;

  if (canViewAll) {
    if (!assigned) {
      assignedTo = undefined;
    } else if (assigned === "me") {
      assignedTo = profile.id;
    } else if (validProfileIds.has(assigned)) {
      assignedTo = assigned;
    } else {
      assignedTo = undefined;
    }
  }

  const queueItems = await loadFollowUpQueue(supabase, profile.organization_id, {
    assignedTo,
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <Link
          href="/follow-ups"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Kembali ke Follow Ups
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Follow Up Queue</h1>
        <p className="text-sm text-muted-foreground">
          Prioritas harian untuk mencegah lead bocor dan membantu sales tahu
          langkah berikutnya.
        </p>
      </div>

      {canViewAll && (
        <form method="get" className="flex flex-wrap gap-3 rounded-xl border p-4">
          <select
            name="assigned"
            defaultValue={assigned || (canViewAll ? "" : "me")}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Semua Sales</option>
            <option value="me">Assigned to Me</option>
            {orgProfiles?.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md border bg-background px-4 py-2 text-sm font-medium"
          >
            Filter
          </button>
        </form>
      )}

      <FollowUpQueueTable items={queueItems} />
    </div>
  );
}
