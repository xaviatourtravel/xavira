"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import OpenAI from "openai";

import { AI_MODEL, logAiGeneration } from "@/lib/ai/client";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { resolveOrganizationTimezone } from "@/lib/ai/resolve-organization-timezone";
import {
  buildKnowledgeProcessingPrompt,
  parseKnowledgeProcessingResponse,
} from "@/lib/knowledge/ai";
import {
  KNOWLEDGE_MAX_FILE_BYTES,
  parseKnowledgeCategory,
  parseKnowledgeTags,
  resolveKnowledgeFileKind,
} from "@/lib/knowledge/constants";
import { extractKnowledgeText } from "@/lib/knowledge/extract";
import {
  createKnowledgeFileSignedUrl,
  removeKnowledgeFile,
  uploadKnowledgeFile,
} from "@/lib/knowledge/storage";
import type { Profile } from "@/types/app-types";
import { encodeActionError, formatActionError } from "@/lib/errors";
import { createClient } from "@/utils/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function runKnowledgeAiProcessing(
  supabase: SupabaseServerClient,
  profile: Profile,
  entry: {
    id: string;
    title: string;
    category: ReturnType<typeof parseKnowledgeCategory>;
    content: string;
  },
) {
  if (!entry.content.trim()) {
    await supabase
      .from("knowledge_entries")
      .update({ ai_status: "failed" })
      .eq("id", entry.id)
      .eq("organization_id", profile.organization_id);
    return;
  }

  const timezone = await resolveOrganizationTimezone(
    supabase,
    profile.organization_id,
  );

  const prompt = buildKnowledgeProcessingPrompt({
    title: entry.title,
    category: entry.category,
    content: entry.content,
    timezone,
  });

  try {
    const response = await openai.responses.create({
      model: AI_MODEL,
      input: prompt,
    });

    const raw = response.output_text?.trim() ?? "";
    const parsed = parseKnowledgeProcessingResponse(raw);

    if (!parsed) {
      await supabase
        .from("knowledge_entries")
        .update({ ai_status: "failed" })
        .eq("id", entry.id)
        .eq("organization_id", profile.organization_id);
      return;
    }

    await logAiGeneration({
      supabase,
      organizationId: profile.organization_id,
      userId: profile.id,
      referenceId: entry.id,
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
      feature: "content",
    });

    await supabase
      .from("knowledge_entries")
      .update({
        summary: parsed.summary || null,
        key_points: parsed.keyPoints,
        faq: parsed.faq,
        ai_status: "completed",
        ai_metadata: {
          model: AI_MODEL,
          processed_at: new Date().toISOString(),
          key_point_count: parsed.keyPoints.length,
          faq_count: parsed.faq.length,
        },
      })
      .eq("id", entry.id)
      .eq("organization_id", profile.organization_id);
  } catch (error) {
    console.error("runKnowledgeAiProcessing failed", error);
    await supabase
      .from("knowledge_entries")
      .update({ ai_status: "failed" })
      .eq("id", entry.id)
      .eq("organization_id", profile.organization_id);
  }
}

async function extractUploadedFile(
  formData: FormData,
  organizationId: string,
): Promise<
  | { ok: true; text: string; filePath: string; fileName: string; fileType: string }
  | { ok: false; error: string }
  | { ok: "none" }
> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: "none" };
  }

  if (file.size > KNOWLEDGE_MAX_FILE_BYTES) {
    return { ok: false, error: "Ukuran file maksimal 20MB." };
  }

  const kind = resolveKnowledgeFileKind(file.name, file.type);
  if (!kind) {
    return { ok: false, error: "Format file harus PDF, DOCX, atau TXT." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let text = "";
  try {
    const extracted = await extractKnowledgeText(buffer, kind);
    text = extracted.text;
  } catch (error) {
    return {
      ok: false,
      error: formatActionError(error, "extractKnowledgeText"),
    };
  }

  try {
    const { filePath } = await uploadKnowledgeFile({
      organizationId,
      buffer,
      fileName: file.name,
      kind,
    });
    return { ok: true, text, filePath, fileName: file.name, fileType: kind };
  } catch (error) {
    return {
      ok: false,
      error: formatActionError(error, "uploadKnowledgeFile"),
    };
  }
}

export async function createKnowledgeEntry(formData: FormData) {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    redirect("/knowledge?error=Hanya admin atau owner yang dapat menambah knowledge.");
  }

  const title = getString(formData, "title");
  const category = parseKnowledgeCategory(getString(formData, "category"));
  const tags = parseKnowledgeTags(getString(formData, "tags"));
  const typedContent = getString(formData, "content");

  if (!title) {
    redirect("/knowledge/new?error=Judul wajib diisi.");
  }

  const upload = await extractUploadedFile(formData, profile.organization_id);

  if (upload.ok === false) {
    redirect(`/knowledge/new?error=${encodeURIComponent(upload.error)}`);
  }

  const hasFile = upload.ok === true;
  const contentParts = [typedContent, hasFile ? upload.text : ""].filter(
    (part) => part.trim().length > 0,
  );
  const content = contentParts.join("\n\n");

  if (!content) {
    redirect("/knowledge/new?error=Isi konten atau unggah dokumen terlebih dahulu.");
  }

  const supabase = await createClient();
  const { data: inserted, error } = await supabase
    .from("knowledge_entries")
    .insert({
      organization_id: profile.organization_id,
      created_by: profile.id,
      title,
      category,
      tags,
      content,
      ai_status: "processing",
      source_type: hasFile ? "upload" : "manual",
      file_path: hasFile ? upload.filePath : null,
      file_name: hasFile ? upload.fileName : null,
      file_type: hasFile ? upload.fileType : null,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    if (hasFile) {
      await removeKnowledgeFile(upload.filePath);
    }
    redirect(
      `/knowledge/new?error=${encodeActionError(error ?? "Gagal menyimpan knowledge.", "createKnowledge")}`,
    );
  }

  await runKnowledgeAiProcessing(supabase, profile, {
    id: inserted.id,
    title,
    category,
    content,
  });

  revalidatePath("/knowledge");
  redirect(`/knowledge/${inserted.id}`);
}

export async function updateKnowledgeEntry(formData: FormData) {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    redirect("/knowledge?error=Hanya admin atau owner yang dapat mengubah knowledge.");
  }

  const id = getString(formData, "entry_id");
  const title = getString(formData, "title");
  const category = parseKnowledgeCategory(getString(formData, "category"));
  const tags = parseKnowledgeTags(getString(formData, "tags"));
  const content = getString(formData, "content");

  if (!id) {
    redirect("/knowledge?error=Knowledge tidak ditemukan.");
  }

  if (!title) {
    redirect(`/knowledge/${id}/edit?error=Judul wajib diisi.`);
  }

  if (!content) {
    redirect(`/knowledge/${id}/edit?error=Isi konten wajib diisi.`);
  }

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("knowledge_entries")
    .update({
      title,
      category,
      tags,
      content,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .select("id")
    .maybeSingle();

  if (error || !updated) {
    redirect(
      `/knowledge/${id}/edit?error=${encodeActionError(error ?? "Gagal menyimpan perubahan.", "updateKnowledge")}`,
    );
  }

  revalidatePath("/knowledge");
  revalidatePath(`/knowledge/${id}`);
  redirect(`/knowledge/${id}`);
}

export async function reprocessKnowledgeEntry(formData: FormData) {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    redirect("/knowledge?error=Hanya admin atau owner yang dapat memproses knowledge.");
  }

  const id = getString(formData, "entry_id");
  if (!id) {
    redirect("/knowledge?error=Knowledge tidak ditemukan.");
  }

  const supabase = await createClient();
  const { data: entry } = await supabase
    .from("knowledge_entries")
    .select("id, title, category, content")
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (!entry) {
    redirect("/knowledge?error=Knowledge tidak ditemukan.");
  }

  await supabase
    .from("knowledge_entries")
    .update({ ai_status: "processing" })
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  await runKnowledgeAiProcessing(supabase, profile, {
    id: entry.id,
    title: entry.title,
    category: parseKnowledgeCategory(entry.category),
    content: entry.content ?? "",
  });

  revalidatePath(`/knowledge/${id}`);
  redirect(`/knowledge/${id}`);
}

export async function deleteKnowledgeEntry(formData: FormData) {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    redirect("/knowledge?error=Hanya admin atau owner yang dapat menghapus knowledge.");
  }

  const id = getString(formData, "entry_id");
  if (!id) {
    redirect("/knowledge?error=Knowledge tidak ditemukan.");
  }

  const supabase = await createClient();
  const { data: deleted } = await supabase
    .from("knowledge_entries")
    .delete()
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .select("file_path")
    .maybeSingle();

  if (deleted?.file_path) {
    await removeKnowledgeFile(deleted.file_path);
  }

  revalidatePath("/knowledge");
  redirect("/knowledge");
}

export type KnowledgeFileUrlResult =
  | { success: true; url: string; fileName: string | null }
  | { success: false; message: string };

export async function getKnowledgeFileUrl(
  entryId: string,
): Promise<KnowledgeFileUrlResult> {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const { data: entry } = await supabase
    .from("knowledge_entries")
    .select("file_path, file_name")
    .eq("id", entryId)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (!entry?.file_path) {
    return { success: false, message: "File tidak ditemukan." };
  }

  const url = await createKnowledgeFileSignedUrl(entry.file_path);
  if (!url) {
    return { success: false, message: "Gagal membuat tautan unduhan." };
  }

  return { success: true, url, fileName: entry.file_name };
}
