"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import {
  parseContentPlatform,
  parseContentStatus,
  parseContentType,
} from "@/lib/content/constants";
import {
  resolveContentAssigneeId,
  resolveContentCampaignId,
} from "@/lib/content/queries";
import { createClient } from "@/utils/supabase/server";
import type { TablesInsert } from "@/types/database";

type ContentInsert = TablesInsert<"contents">;

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function buildContentPayload(
  formData: FormData,
  organizationId: string,
): Omit<ContentInsert, "campaign_id" | "assigned_to"> & {
  campaign_id: string | null;
  assigned_to: string | null;
} | null {
  const title = getString(formData, "title");

  if (!title) {
    return null;
  }

  return {
    organization_id: organizationId,
    title,
    platform: parseContentPlatform(getString(formData, "platform")),
    content_type: parseContentType(getString(formData, "content_type")),
    status: parseContentStatus(getString(formData, "status") || "idea"),
    caption: getString(formData, "caption") || null,
    cta: getString(formData, "cta") || null,
    drive_url: getString(formData, "drive_url") || null,
    publish_date: getString(formData, "publish_date") || null,
    notes: getString(formData, "notes") || null,
    campaign_id: null,
    assigned_to: null,
  };
}

async function resolveContentRelations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  formData: FormData,
) {
  const campaignId = await resolveContentCampaignId(
    supabase,
    organizationId,
    getString(formData, "campaign_id"),
  );
  const campaignIdInput = getString(formData, "campaign_id");

  if (campaignIdInput && !campaignId) {
    return { error: "Campaign tidak valid" as const };
  }

  const assignedTo = await resolveContentAssigneeId(
    supabase,
    organizationId,
    getString(formData, "assigned_to"),
  );
  const assignedToInput = getString(formData, "assigned_to");

  if (assignedToInput && !assignedTo) {
    return { error: "Assignee tidak valid" as const };
  }

  return { campaignId, assignedTo };
}

export async function createContent(formData: FormData) {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    redirect(
      "/content?error=Hanya admin atau owner yang dapat menambah content.",
    );
  }

  const payload = buildContentPayload(formData, profile.organization_id);

  if (!payload) {
    redirect("/content/new?error=Title wajib diisi");
  }

  const supabase = await createClient();
  const relations = await resolveContentRelations(
    supabase,
    profile.organization_id,
    formData,
  );

  if ("error" in relations) {
    redirect(
      `/content/new?error=${encodeURIComponent(relations.error ?? "Data tidak valid")}`,
    );
  }

  const { error } = await supabase.from("contents").insert({
    ...payload,
    campaign_id: relations.campaignId,
    assigned_to: relations.assignedTo,
  });

  if (error) {
    redirect(`/content/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/content");
  redirect("/content");
}

export async function updateContent(formData: FormData) {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    redirect(
      "/content?error=Hanya admin atau owner yang dapat mengubah content.",
    );
  }

  const contentId = getString(formData, "content_id");
  const payload = buildContentPayload(formData, profile.organization_id);

  if (!contentId) {
    redirect("/content?error=Content tidak ditemukan");
  }

  if (!payload) {
    redirect(
      `/content/${contentId}/edit?error=${encodeURIComponent("Title wajib diisi")}`,
    );
  }

  const supabase = await createClient();
  const relations = await resolveContentRelations(
    supabase,
    profile.organization_id,
    formData,
  );

  if ("error" in relations) {
    redirect(
      `/content/${contentId}/edit?error=${encodeURIComponent(relations.error ?? "Data tidak valid")}`,
    );
  }

  const { data: updatedContent, error } = await supabase
    .from("contents")
    .update({
      title: payload.title,
      platform: payload.platform,
      content_type: payload.content_type,
      status: payload.status,
      caption: payload.caption,
      cta: payload.cta,
      drive_url: payload.drive_url,
      publish_date: payload.publish_date,
      notes: payload.notes,
      campaign_id: relations.campaignId,
      assigned_to: relations.assignedTo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contentId)
    .eq("organization_id", profile.organization_id)
    .select("id")
    .maybeSingle();

  if (error) {
    redirect(
      `/content/${contentId}/edit?error=${encodeURIComponent(error.message)}`,
    );
  }

  if (!updatedContent) {
    redirect("/content?error=Content tidak ditemukan");
  }

  revalidatePath("/content");
  revalidatePath(`/content/${contentId}`);
  redirect(`/content/${contentId}`);
}

export async function deleteContent(formData: FormData) {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    redirect(
      "/content?error=Hanya admin atau owner yang dapat menghapus content.",
    );
  }

  const contentId = getString(formData, "content_id");

  if (!contentId) {
    redirect("/content?error=Content tidak ditemukan");
  }

  const supabase = await createClient();
  const { data: deletedContent, error } = await supabase
    .from("contents")
    .delete()
    .eq("id", contentId)
    .eq("organization_id", profile.organization_id)
    .select("id")
    .maybeSingle();

  if (error) {
    redirect(`/content?error=${encodeURIComponent(error.message)}`);
  }

  if (!deletedContent) {
    redirect("/content?error=Content tidak ditemukan");
  }

  revalidatePath("/content");
  redirect("/content");
}
