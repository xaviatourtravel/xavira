"use server";

import { revalidatePath } from "next/cache";

import { loadContentGenerationById } from "@/lib/content/generation-queries";
import {
  parseContentPlatform,
  parseContentStatus,
  parseContentType,
} from "@/lib/content/constants";
import { resolveContentAssigneeId } from "@/lib/content/queries";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createContentFromGeneration(formData: FormData): Promise<{
  success: boolean;
  message?: string;
  contentId?: string;
}> {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    return {
      success: false,
      message: "Hanya owner atau admin yang dapat menambah content.",
    };
  }

  const generationId = getString(formData, "generation_id");
  const title = getString(formData, "title");

  if (!generationId) {
    return {
      success: false,
      message: "Generation tidak ditemukan.",
    };
  }

  if (!title) {
    return {
      success: false,
      message: "Title wajib diisi.",
    };
  }

  const supabase = await createClient();
  const generation = await loadContentGenerationById(
    supabase,
    profile.organization_id,
    generationId,
  );

  if (!generation) {
    return {
      success: false,
      message: "Generation tidak ditemukan.",
    };
  }

  const assignedToInput = getString(formData, "assigned_to");
  const assignedTo = assignedToInput
    ? await resolveContentAssigneeId(
        supabase,
        profile.organization_id,
        assignedToInput,
      )
    : null;

  if (assignedToInput && !assignedTo) {
    return {
      success: false,
      message: "Assignee tidak valid.",
    };
  }

  const { data: createdContent, error } = await supabase
    .from("contents")
    .insert({
      organization_id: profile.organization_id,
      ai_generation_id: generationId,
      title,
      platform: parseContentPlatform(getString(formData, "platform")),
      content_type: parseContentType(getString(formData, "content_type")),
      status: parseContentStatus(getString(formData, "status") || "idea"),
      caption: getString(formData, "caption") || null,
      cta: getString(formData, "cta") || null,
      notes: getString(formData, "notes") || null,
      publish_date: getString(formData, "publish_date") || null,
      assigned_to: assignedTo,
    })
    .select("id")
    .maybeSingle();

  if (error || !createdContent) {
    return {
      success: false,
      message: error?.message ?? "Gagal menambahkan ke Content Board.",
    };
  }

  revalidatePath("/content");
  revalidatePath("/content/studio");

  return {
    success: true,
    message: "Konten berhasil ditambahkan ke Content Board.",
    contentId: createdContent.id,
  };
}
