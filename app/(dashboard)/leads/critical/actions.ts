"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  buildCriticalLeadListItems,
  CRITICAL_BULK_FOLLOW_UP_ACTIVITY,
  getCriticalBulkFollowUpTaskTitle,
  type CriticalLeadSourceRecord,
} from "@/lib/leads/critical-leads";
import { getFollowUpDueDateInDays } from "@/lib/leads/first-follow-up";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";

export async function createBulkCriticalFollowUps() {
  const { profile } = await requireProfile();
  const supabase = await createClient();
  const taskTitle = getCriticalBulkFollowUpTaskTitle();
  const dueDate = getFollowUpDueDateInDays(1);

  const [{ data: leads, error: leadsError }, { data: followUpTasks, error: tasksError }] =
    await Promise.all([
      supabase
        .from("leads")
        .select(
          `
          id,
          full_name,
          status,
          assigned_to,
          updated_at,
          whatsapp_number,
          phone,
          profiles!leads_assigned_to_fkey (
            full_name
          )
        `,
        )
        .eq("organization_id", profile.organization_id)
        .is("deleted_at", null)
        .not("status", "in", "(won,lost)"),
      supabase
        .from("follow_up_tasks")
        .select("lead_id")
        .eq("organization_id", profile.organization_id),
    ]);

  if (leadsError || tasksError) {
    redirect(
      `/leads/critical?error=${encodeURIComponent("Gagal memuat critical leads.")}`,
    );
  }

  const criticalLeads = buildCriticalLeadListItems(
    (leads ?? []) as CriticalLeadSourceRecord[],
    followUpTasks ?? [],
  );

  if (criticalLeads.length === 0) {
    redirect(
      `/leads/critical?error=${encodeURIComponent("Tidak ada critical lead untuk dibuatkan follow up.")}`,
    );
  }

  const criticalLeadIds = criticalLeads.map((lead) => lead.id);

  const { data: existingTasks, error: existingTasksError } = await supabase
    .from("follow_up_tasks")
    .select("lead_id")
    .eq("organization_id", profile.organization_id)
    .eq("status", "pending")
    .eq("title", taskTitle)
    .in("lead_id", criticalLeadIds);

  if (existingTasksError) {
    redirect(
      `/leads/critical?error=${encodeURIComponent(existingTasksError.message)}`,
    );
  }

  const existingLeadIds = new Set(
    (existingTasks ?? []).map((task) => task.lead_id),
  );

  const leadsToCreate = criticalLeads.filter(
    (lead) => !existingLeadIds.has(lead.id),
  );

  if (leadsToCreate.length === 0) {
    redirect(
      `/leads/critical?success=${encodeURIComponent("Semua critical lead sudah memiliki follow up pending.")}`,
    );
  }

  let createdCount = 0;

  for (const lead of leadsToCreate) {
    const { error: followUpError } = await supabase.from("follow_up_tasks").insert({
      organization_id: profile.organization_id,
      lead_id: lead.id,
      title: taskTitle,
      status: "pending",
      due_date: dueDate,
      created_by: profile.id,
    });

    if (followUpError) {
      continue;
    }

    await supabase.from("lead_activities").insert({
      organization_id: profile.organization_id,
      lead_id: lead.id,
      actor_id: profile.id,
      activity_type: "note",
      title: CRITICAL_BULK_FOLLOW_UP_ACTIVITY.title,
      body: CRITICAL_BULK_FOLLOW_UP_ACTIVITY.body,
    });

    createdCount += 1;
    revalidatePath(`/leads/${lead.id}`);
  }

  revalidatePath("/leads/critical");
  revalidatePath("/follow-ups");

  if (createdCount === 0) {
    redirect(
      `/leads/critical?error=${encodeURIComponent("Gagal membuat follow up critical lead.")}`,
    );
  }

  redirect(
    `/leads/critical?success=${encodeURIComponent(`${createdCount} follow up critical lead berhasil dibuat.`)}`,
  );
}
