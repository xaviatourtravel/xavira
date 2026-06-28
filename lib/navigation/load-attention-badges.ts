import type { Profile } from "@/types/app-types";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { ACTIVE_TASK_STATUSES } from "@/lib/tasks/constants";
import {
  countPaymentsToConfirm,
  countUnreadConversations,
} from "@/lib/tasks/derive-tasks";
import type { NavAttentionBadges } from "@/config/navigation";
import type { createClient } from "@/utils/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function loadNavAttentionBadges(
  supabase: SupabaseServerClient,
  profile: Profile,
): Promise<NavAttentionBadges> {
  const viewAll = isAdminOrOwner(profile);

  let tasksQuery = supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", profile.organization_id)
    .in("status", ACTIVE_TASK_STATUSES);

  if (!viewAll) {
    tasksQuery = tasksQuery.or(
      `assigned_to.eq.${profile.id},assigned_to.is.null,created_by.eq.${profile.id}`,
    );
  }

  const [communication, finance, { count: savedTaskCount }] = await Promise.all([
    countUnreadConversations(supabase, profile),
    countPaymentsToConfirm(supabase, profile.organization_id),
    tasksQuery,
  ]);

  let operational = savedTaskCount ?? 0;

  if (operational === 0) {
    operational = await estimateDerivedOperationalCount(supabase, profile);
  }

  return {
    communication,
    operational,
    finance,
  };
}

async function estimateDerivedOperationalCount(
  supabase: SupabaseServerClient,
  profile: Profile,
) {
  const { count: followUps } = await supabase
    .from("follow_up_tasks")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", profile.organization_id)
    .eq("status", "pending");

  return followUps ?? 0;
}
