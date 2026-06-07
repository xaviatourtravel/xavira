"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  buildFollowUpCenterHref,
  isFollowUpCenterFilter,
  type FollowUpCenterFilter,
} from "@/lib/follow-ups/list-filters";
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
    redirectWithMessage(returnFilter, returnAssigned, "error", error.message);
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
