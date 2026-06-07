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

function getReturnPath(filter: string) {
  const resolved: FollowUpCenterFilter = isFollowUpCenterFilter(filter)
    ? filter
    : "pending";

  return buildFollowUpCenterHref(resolved);
}

function redirectWithMessage(
  returnFilter: string,
  key: "error" | "success",
  message: string,
) {
  const path = getReturnPath(returnFilter);
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

  if (!leadId || !taskId) {
    redirectWithMessage(returnFilter, "error", "Follow up tidak ditemukan");
  }

  const { data: task, error: taskError } = await supabase
    .from("follow_up_tasks")
    .select("id, title")
    .eq("id", taskId)
    .eq("lead_id", leadId)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (taskError || !task) {
    redirectWithMessage(returnFilter, "error", "Follow up tidak ditemukan");
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
    redirectWithMessage(returnFilter, "error", error.message);
  }

  await supabase.from("lead_activities").insert({
    organization_id: profile.organization_id,
    lead_id: leadId,
    actor_id: profile.id,
    activity_type: "note",
    title: "Follow up selesai",
    body: `Follow up "${task.title}" ditandai selesai.`,
  });

  revalidatePath("/follow-ups");
  revalidatePath(`/leads/${leadId}`);
  redirect(getReturnPath(returnFilter));
}
