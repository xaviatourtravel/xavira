"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  buildFollowUpCenterHref,
  isFollowUpCenterFilter,
  type FollowUpCenterFilter,
} from "@/lib/follow-ups/list-filters";
import { formatActionError } from "@/lib/errors";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getReturnPath(filter: string, assigned: string) {
  const resolved: FollowUpCenterFilter = isFollowUpCenterFilter(filter)
    ? filter
    : "pending";

  return buildFollowUpCenterHref({
    filter: resolved,
    assigned,
  });
}

function redirectWithMessage(
  returnFilter: string,
  returnAssigned: string,
  key: "error" | "success",
  message: string,
) {
  const path = getReturnPath(returnFilter, returnAssigned);
  const params = new URLSearchParams(path.includes("?") ? path.split("?")[1] : "");
  params.set(key, message);
  const base = path.split("?")[0];
  redirect(`${base}?${params.toString()}`);
}

export async function completeFollowUpTaskFromCenter(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const leadId = getString(formData, "lead_id");
  const taskId = getString(formData, "task_id");
  const returnFilter = getString(formData, "return_filter") || "pending";
  const returnAssigned = getString(formData, "return_assigned");

  if (!leadId || !taskId) {
    redirectWithMessage(
      returnFilter,
      returnAssigned,
      "error",
      "Follow up tidak ditemukan",
    );
  }

  const { data: task, error: taskError } = await supabase
    .from("follow_up_tasks")
    .select("id, title")
    .eq("id", taskId)
    .eq("lead_id", leadId)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (taskError || !task) {
    redirectWithMessage(
      returnFilter,
      returnAssigned,
      "error",
      "Follow up tidak ditemukan",
    );
  }

  const { error } = await supabase
    .from("follow_up_tasks")
    .update({
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("organization_id", profile.organization_id);

  if (error) {
    redirectWithMessage(
      returnFilter,
      returnAssigned,
      "error",
      formatActionError(error, "completeFollowUpTaskFromCenter"),
    );
  }

  const completionNote = getString(formData, "completion_note");
  const activityBody =
    completionNote || "Follow up ditandai selesai.";

  await supabase.from("lead_activities").insert({
    organization_id: profile.organization_id,
    lead_id: leadId,
    actor_id: profile.id,
    activity_type: "note",
    title: "Follow Up Selesai",
    body: activityBody,
  });

  revalidatePath("/follow-ups");
  revalidatePath(`/leads/${leadId}`);
  redirect(getReturnPath(returnFilter, returnAssigned));
}

export async function completeFollowUpFromQueue(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const leadId = getString(formData, "lead_id");
  const completionNote = getString(formData, "completion_note");

  if (!leadId) {
    return { success: false, message: "Lead tidak ditemukan." };
  }

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id")
    .eq("id", leadId)
    .eq("organization_id", profile.organization_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (leadError || !lead) {
    return { success: false, message: "Lead tidak ditemukan." };
  }

  const nowIso = new Date().toISOString();

  const { data: pendingTasks, error: pendingTasksError } = await supabase
    .from("follow_up_tasks")
    .select("id")
    .eq("lead_id", leadId)
    .eq("organization_id", profile.organization_id)
    .eq("status", "pending");

  if (pendingTasksError) {
    return { success: false, message: formatActionError(pendingTasksError, "completeFollowUpFromQueue") };
  }

  if (pendingTasks && pendingTasks.length > 0) {
    const { error: completeTasksError } = await supabase
      .from("follow_up_tasks")
      .update({
        status: "completed",
        updated_at: nowIso,
      })
      .eq("lead_id", leadId)
      .eq("organization_id", profile.organization_id)
      .eq("status", "pending");

    if (completeTasksError) {
      return { success: false, message: formatActionError(completeTasksError, "completeFollowUpFromQueue") };
    }
  }

  const activityBody =
    completionNote || "Follow up dari queue ditandai selesai.";

  const { error: activityError } = await supabase.from("lead_activities").insert({
    organization_id: profile.organization_id,
    lead_id: leadId,
    actor_id: profile.id,
    activity_type: "note",
    title: "Follow Up Selesai",
    body: activityBody,
  });

  if (activityError) {
    return { success: false, message: formatActionError(activityError, "completeFollowUpFromQueue") };
  }

  const { error: leadUpdateError } = await supabase
    .from("leads")
    .update({
      updated_at: nowIso,
      last_contacted_at: nowIso,
    })
    .eq("id", leadId)
    .eq("organization_id", profile.organization_id);

  if (leadUpdateError) {
    return { success: false, message: formatActionError(leadUpdateError, "completeFollowUpFromQueue") };
  }

  revalidatePath("/follow-ups/queue");
  revalidatePath("/follow-ups");
  revalidatePath("/dashboard");
  revalidatePath(`/leads/${leadId}`);

  return {
    success: true,
    message: "Follow up berhasil ditandai selesai.",
  };
}
