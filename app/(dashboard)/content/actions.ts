"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import {
  isContentStatus,
  parseContentPlatform,
  parseContentStatus,
  parseContentType,
} from "@/lib/content/constants";
import {
  resolveContentAssigneeId,
  resolveContentCampaignId,
} from "@/lib/content/queries";
import {
  parseHooksFromTextarea,
  resolveAiContentSections,
  serializeContentStudioOutput,
} from "@/lib/content/ai-sections";
import { parseStoredContentStudioOutput } from "@/lib/content/generations";
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

function hasAiSectionFields(formData: FormData) {
  return formData.has("ai_vo_script");
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

  const { data: existingContent, error: existingContentError } = await supabase
    .from("contents")
    .select(
      `
      id,
      ai_generation_id,
      ai_content_generations (
        generated_output
      )
    `,
    )
    .eq("id", contentId)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (existingContentError) {
    redirect(
      `/content/${contentId}/edit?error=${encodeURIComponent(existingContentError.message)}`,
    );
  }

  if (!existingContent) {
    redirect("/content?error=Content tidak ditemukan");
  }

  const isAiLinkedContent =
    Boolean(existingContent.ai_generation_id) && hasAiSectionFields(formData);

  if (isAiLinkedContent && existingContent.ai_generation_id) {
    const generationRecord = Array.isArray(existingContent.ai_content_generations)
      ? existingContent.ai_content_generations[0]
      : existingContent.ai_content_generations;
    const existingResult = parseStoredContentStudioOutput(
      generationRecord?.generated_output,
    );

    if (!existingResult) {
      redirect(
        `/content/${contentId}/edit?error=${encodeURIComponent("Generation source tidak valid.")}`,
      );
    }

    const updatedOutput = serializeContentStudioOutput(existingResult, {
      hooks: parseHooksFromTextarea(getString(formData, "ai_hooks")),
      voScript: getString(formData, "ai_vo_script"),
      caption: getString(formData, "ai_caption"),
      cta: getString(formData, "ai_cta"),
      thumbnailConcept: getString(formData, "ai_thumbnail_concept"),
      imagePrompt: getString(formData, "ai_image_prompt"),
    });

    if (!resolveAiContentSections(updatedOutput)) {
      redirect(
        `/content/${contentId}/edit?error=${encodeURIComponent("Semua section AI wajib diisi.")}`,
      );
    }

    const { error: generationUpdateError } = await supabase
      .from("ai_content_generations")
      .update({
        generated_output: updatedOutput,
      })
      .eq("id", existingContent.ai_generation_id)
      .eq("organization_id", profile.organization_id);

    if (generationUpdateError) {
      redirect(
        `/content/${contentId}/edit?error=${encodeURIComponent(generationUpdateError.message)}`,
      );
    }
  }

  const { data: updatedContent, error } = await supabase
    .from("contents")
    .update({
      title: payload.title,
      platform: payload.platform,
      content_type: payload.content_type,
      status: payload.status,
      caption: isAiLinkedContent ? null : payload.caption,
      cta: isAiLinkedContent ? null : payload.cta,
      drive_url: payload.drive_url,
      publish_date: payload.publish_date,
      notes: isAiLinkedContent ? null : payload.notes,
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
  revalidatePath("/content/studio");
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

export async function updateContentBoardStatus(
  contentId: string,
  nextStatus: string,
): Promise<{ success: boolean; message?: string }> {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    return {
      success: false,
      message: "Hanya admin atau owner yang dapat mengubah status content.",
    };
  }

  if (!contentId) {
    return {
      success: false,
      message: "Content tidak ditemukan.",
    };
  }

  if (!isContentStatus(nextStatus)) {
    return {
      success: false,
      message: "Status content tidak valid.",
    };
  }

  const supabase = await createClient();
  const { data: updatedContent, error } = await supabase
    .from("contents")
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contentId)
    .eq("organization_id", profile.organization_id)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  if (!updatedContent) {
    return {
      success: false,
      message: "Content tidak ditemukan.",
    };
  }

  revalidatePath("/content");
  revalidatePath(`/content/${contentId}`);

  return {
    success: true,
    message: "Status content berhasil diperbarui.",
  };
}
