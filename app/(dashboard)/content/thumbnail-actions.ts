"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

import OpenAI from "openai";

import { AI_MODEL, logAiGeneration } from "@/lib/ai/client";
import { generateThumbnailImage } from "@/lib/ai/thumbnail-images";
import {
  buildThumbnailCopyPrompt,
  buildThumbnailImagePrompt,
  isThumbnailCoverFormat,
  isThumbnailStylePreset,
  parseThumbnailCopyResponse,
  parseThumbnailCoverFormat,
  parseThumbnailStylePreset,
  THUMBNAIL_IMAGE_VARIATION_COUNT,
  type ThumbnailImageVariation,
} from "@/lib/ai/thumbnail-studio";
import {
  loadThumbnailGenerationById,
  type ThumbnailGenerationListItem,
} from "@/lib/content/thumbnail-queries";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function buildThumbnailInputs(formData: FormData) {
  const sourceHook = getString(formData, "source_hook");
  const sourceVoScript = getString(formData, "source_vo_script");
  const contentPillar = getString(formData, "content_pillar");
  const contentAngle = getString(formData, "content_angle");
  const customHeadline = getString(formData, "custom_headline");
  const coverFormatInput = getString(formData, "cover_format");
  const stylePresetInput = getString(formData, "style_preset");
  const aiContentGenerationId = getString(formData, "ai_content_generation_id");

  if (!sourceHook || !sourceVoScript || !contentPillar || !contentAngle) {
    return { error: "Hook, VO Script, pillar, dan angle wajib diisi." as const };
  }

  if (!isThumbnailCoverFormat(coverFormatInput)) {
    return { error: "Cover format tidak valid." as const };
  }

  if (!isThumbnailStylePreset(stylePresetInput)) {
    return { error: "Style preset tidak valid." as const };
  }

  return {
    inputs: {
      sourceHook,
      sourceVoScript,
      contentPillar,
      contentAngle,
      customHeadline: customHeadline || undefined,
      coverFormat: coverFormatInput,
      stylePreset: stylePresetInput,
      aiContentGenerationId: aiContentGenerationId || undefined,
    },
  };
}

export async function generateThumbnailStudioCopy(formData: FormData): Promise<{
  success: boolean;
  message?: string;
  historyItem?: ThumbnailGenerationListItem;
}> {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    return {
      success: false,
      message: "Hanya owner atau admin yang dapat menggunakan Thumbnail Studio.",
    };
  }

  const parsedInputs = buildThumbnailInputs(formData);

  if ("error" in parsedInputs) {
    return {
      success: false,
      message: parsedInputs.error,
    };
  }

  const supabase = await createClient();
  const prompt = buildThumbnailCopyPrompt(parsedInputs.inputs);

  try {
    const response = await openai.responses.create({
      model: AI_MODEL,
      input: prompt,
    });

    const raw = response.output_text?.trim();

    if (!raw) {
      return {
        success: false,
        message: "Gagal membuat headline dan concept thumbnail.",
      };
    }

    const parsed = parseThumbnailCopyResponse(raw);

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.message,
      };
    }

    await logAiGeneration({
      supabase,
      organizationId: profile.organization_id,
      userId: profile.id,
      referenceId: parsedInputs.inputs.aiContentGenerationId ?? profile.id,
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
      feature: "thumbnail",
    });

    const { data: savedGeneration, error: saveError } = await supabase
      .from("ai_thumbnail_generations")
      .insert({
        organization_id: profile.organization_id,
        created_by: profile.id,
        ai_content_generation_id: parsedInputs.inputs.aiContentGenerationId ?? null,
        source_hook: parsedInputs.inputs.sourceHook,
        source_vo_script: parsedInputs.inputs.sourceVoScript,
        content_pillar: parsedInputs.inputs.contentPillar,
        content_angle: parsedInputs.inputs.contentAngle,
        custom_headline: parsedInputs.inputs.customHeadline ?? null,
        cover_format: parsedInputs.inputs.coverFormat,
        style_preset: parsedInputs.inputs.stylePreset,
        headlines: parsed.data.headlines,
        concept: parsed.data.concept,
        selected_headline:
          parsedInputs.inputs.customHeadline || parsed.data.headlines[0] || null,
      })
      .select("id")
      .maybeSingle();

    if (saveError || !savedGeneration) {
      return {
        success: false,
        message:
          saveError?.message ??
          "Headline dibuat, tetapi gagal disimpan ke history.",
      };
    }

    const historyItem = await loadThumbnailGenerationById(
      supabase,
      profile.organization_id,
      savedGeneration.id,
    );

    revalidatePath("/content/studio");

    return {
      success: true,
      message: "Headline dan concept thumbnail berhasil dibuat.",
      historyItem: historyItem ?? undefined,
    };
  } catch {
    return {
      success: false,
      message: "Gagal membuat headline dan concept thumbnail.",
    };
  }
}

export async function generateThumbnailStudioImages(formData: FormData): Promise<{
  success: boolean;
  message?: string;
  historyItem?: ThumbnailGenerationListItem;
}> {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    return {
      success: false,
      message: "Hanya owner atau admin yang dapat generate thumbnail image.",
    };
  }

  const generationId = getString(formData, "thumbnail_generation_id");
  const selectedHeadline = getString(formData, "selected_headline");

  if (!generationId) {
    return {
      success: false,
      message: "Thumbnail generation tidak ditemukan.",
    };
  }

  const supabase = await createClient();
  const existing = await loadThumbnailGenerationById(
    supabase,
    profile.organization_id,
    generationId,
  );

  if (!existing?.concept || existing.headlines.length === 0) {
    return {
      success: false,
      message: "Generate headline dan concept terlebih dahulu.",
    };
  }

  const headline =
    selectedHeadline ||
    existing.selectedHeadline ||
    existing.customHeadline ||
    existing.headlines[0];

  if (!headline) {
    return {
      success: false,
      message: "Pilih headline terlebih dahulu.",
    };
  }

  const resolvedCoverFormat = parseThumbnailCoverFormat(existing.coverFormat);
  const resolvedStylePreset = parseThumbnailStylePreset(existing.stylePreset);

  try {
    const imageVariations: ThumbnailImageVariation[] = [];

    for (let index = 0; index < THUMBNAIL_IMAGE_VARIATION_COUNT; index += 1) {
      const prompt = buildThumbnailImagePrompt({
        headline,
        concept: existing.concept,
        stylePreset: resolvedStylePreset,
        coverFormat: resolvedCoverFormat,
        variationIndex: index,
      });
      const generated = await generateThumbnailImage(prompt, resolvedCoverFormat);

      imageVariations.push({
        id: randomUUID(),
        storagePath: `inline://${generationId}/${index + 1}.png`,
        publicUrl: generated.dataUrl,
        prompt,
        coverFormat: resolvedCoverFormat,
        stylePreset: resolvedStylePreset,
      });
    }

    const selectedImageId = imageVariations[0]?.id ?? null;

    const { error: updateError } = await supabase
      .from("ai_thumbnail_generations")
      .update({
        image_variations: imageVariations,
        selected_headline: headline,
        selected_image_id: selectedImageId,
      })
      .eq("id", generationId)
      .eq("organization_id", profile.organization_id);

    if (updateError) {
      return {
        success: false,
        message: updateError.message,
      };
    }

    await logAiGeneration({
      supabase,
      organizationId: profile.organization_id,
      userId: profile.id,
      referenceId: generationId,
      inputTokens: 0,
      outputTokens: 0,
      feature: "thumbnail",
    });

    const historyItem = await loadThumbnailGenerationById(
      supabase,
      profile.organization_id,
      generationId,
    );

    revalidatePath("/content/studio");

    return {
      success: true,
      message: "4 thumbnail image variations berhasil dibuat.",
      historyItem: historyItem ?? undefined,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal generate thumbnail image.",
    };
  }
}

export async function attachThumbnailToContentBoard(formData: FormData): Promise<{
  success: boolean;
  message?: string;
  contentId?: string;
}> {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    return {
      success: false,
      message: "Hanya owner atau admin yang dapat attach thumbnail ke Content Board.",
    };
  }

  const contentId = getString(formData, "content_id");
  const generationId = getString(formData, "thumbnail_generation_id");
  const selectedHeadline = getString(formData, "selected_headline");
  const selectedImageId = getString(formData, "selected_image_id");

  if (!contentId || !generationId) {
    return {
      success: false,
      message: "Content dan thumbnail generation wajib dipilih.",
    };
  }

  const supabase = await createClient();
  const generation = await loadThumbnailGenerationById(
    supabase,
    profile.organization_id,
    generationId,
  );

  if (!generation) {
    return {
      success: false,
      message: "Thumbnail generation tidak ditemukan.",
    };
  }

  const image =
    generation.imageVariations.find((item) => item.id === selectedImageId) ??
    generation.imageVariations.find((item) => item.id === generation.selectedImageId) ??
    generation.imageVariations[0];

  if (!image) {
    return {
      success: false,
      message: "Generate thumbnail image terlebih dahulu.",
    };
  }

  const headline =
    selectedHeadline ||
    generation.selectedHeadline ||
    generation.headlines[0] ||
    generation.sourceHook;

  const { data: updatedContent, error } = await supabase
    .from("contents")
    .update({
      thumbnail_url: image.publicUrl,
      thumbnail_headline: headline,
      ai_thumbnail_generation_id: generationId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contentId)
    .eq("organization_id", profile.organization_id)
    .select("id")
    .maybeSingle();

  if (error || !updatedContent) {
    return {
      success: false,
      message: error?.message ?? "Gagal attach thumbnail ke Content Board.",
    };
  }

  await supabase
    .from("ai_thumbnail_generations")
    .update({
      selected_headline: headline,
      selected_image_id: image.id,
    })
    .eq("id", generationId)
    .eq("organization_id", profile.organization_id);

  revalidatePath("/content");
  revalidatePath("/content/studio");
  revalidatePath(`/content/${contentId}`);

  return {
    success: true,
    message: "Thumbnail berhasil ditambahkan ke Content Board.",
    contentId: updatedContent.id,
  };
}

export async function loadThumbnailAttachOptions() {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contents")
    .select("id, title, status, platform")
    .eq("organization_id", profile.organization_id)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
