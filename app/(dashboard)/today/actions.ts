"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { formatActionError } from "@/lib/errors";
import { assertActionPermission } from "@/lib/auth/action-guard";
import { requireProfile } from "@/lib/auth/session";
import { isDerivedTaskId } from "@/lib/tasks/map-task-row";
import { createClient } from "@/utils/supabase/server";

function redirectWithMessage(key: "error" | "success", message: string) {
  redirect(`/today?${key}=${encodeURIComponent(message)}`);
}

function getTaskId(formData: FormData) {
  const value = formData.get("task_id");
  return typeof value === "string" ? value.trim() : "";
}

export async function completeTodayTaskAction(formData: FormData) {
  const { profile } = await requireProfile();
  assertActionPermission(profile, "today.view");

  const taskId = getTaskId(formData);
  if (!taskId || isDerivedTaskId(taskId)) {
    redirectWithMessage(
      "error",
      "Open the source record to resolve this derived task.",
    );
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("id, title")
    .eq("id", taskId)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (fetchError || !task) {
    redirectWithMessage("error", "Task not found.");
  }

  const { error } = await supabase
    .from("tasks")
    .update({
      status: "completed",
      completed_at: now,
      updated_at: now,
    })
    .eq("id", taskId)
    .eq("organization_id", profile.organization_id);

  if (error) {
    redirectWithMessage("error", formatActionError(error, "completeTodayTaskAction"));
  }

  revalidatePath("/today");
  redirectWithMessage("success", "Task marked as done.");
}

export async function skipTodayTaskAction(formData: FormData) {
  const { profile } = await requireProfile();
  assertActionPermission(profile, "today.view");

  const taskId = getTaskId(formData);
  if (!taskId || isDerivedTaskId(taskId)) {
    redirectWithMessage(
      "error",
      "Open the source record to resolve this derived task.",
    );
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("id")
    .eq("id", taskId)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (fetchError || !task) {
    redirectWithMessage("error", "Task not found.");
  }

  const { error } = await supabase
    .from("tasks")
    .update({
      status: "skipped",
      skipped_at: now,
      updated_at: now,
    })
    .eq("id", taskId)
    .eq("organization_id", profile.organization_id);

  if (error) {
    redirectWithMessage("error", formatActionError(error, "skipTodayTaskAction"));
  }

  revalidatePath("/today");
  redirectWithMessage("success", "Task skipped.");
}
