"use server";

import OpenAI from "openai";

import { AI_MODEL, logAiGeneration } from "@/lib/ai/client";
import {
  buildContentStudioPrompt,
  isContentStudioAngle,
  isContentStudioGoal,
  isContentStudioPillar,
  parseContentStudioResponse,
  parseContentStudioSource,
  type ContentStudioGeneration,
} from "@/lib/ai/content-studio";
import { loadContentGenerationById } from "@/lib/content/generation-queries";
import type { ContentGenerationListItem } from "@/lib/content/generations";
import { parseContentPlatform } from "@/lib/content/constants";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import {
  buildPackageContentContext,
  type PackageContentSource,
} from "@/lib/packages/content-context";
import { createClient } from "@/utils/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function generateContentStudio(formData: FormData): Promise<{
  success: boolean;
  message?: string;
  data?: ContentStudioGeneration;
  historyItem?: ContentGenerationListItem;
}> {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    return {
      success: false,
      message: "Hanya owner atau admin yang dapat menggunakan AI Content Studio.",
    };
  }

  const supabase = await createClient();
  const contentSource = parseContentStudioSource(
    getString(formData, "content_source"),
  );
  const packageId = getString(formData, "package_id");
  const topic = getString(formData, "topic");
  const additionalContext = getString(formData, "additional_context");
  const platform = parseContentPlatform(getString(formData, "platform"));
  const goalInput = getString(formData, "goal");
  const pillarInput = getString(formData, "pillar");
  const angleInput = getString(formData, "angle");

  if (!isContentStudioGoal(goalInput)) {
    return {
      success: false,
      message: "Goal konten tidak valid.",
    };
  }

  if (!isContentStudioPillar(pillarInput)) {
    return {
      success: false,
      message: "Content pillar tidak valid.",
    };
  }

  if (!isContentStudioAngle(angleInput)) {
    return {
      success: false,
      message: "Content angle tidak valid.",
    };
  }

  if (contentSource === "free_topic") {
    if (!topic) {
      return {
        success: false,
        message: "Topik / content idea wajib diisi.",
      };
    }
  } else if (!packageId) {
    return {
      success: false,
      message: "Pilih paket terlebih dahulu.",
    };
  }

  let packageContext;
  let referenceId: string;

  if (contentSource === "package_based") {
    const { data: pkg, error } = await supabase
      .from("packages")
      .select(
        "id, name, destination, departure_date, duration_days, price_idr, quota, status",
      )
      .eq("id", packageId)
      .eq("organization_id", profile.organization_id)
      .maybeSingle();

    if (error || !pkg) {
      return {
        success: false,
        message: "Paket tidak ditemukan.",
      };
    }

    packageContext = buildPackageContentContext(pkg as PackageContentSource);
    referenceId = packageId;
  } else {
    referenceId = `free-topic:${profile.organization_id}`;
  }

  let prompt: string;

  try {
    prompt = buildContentStudioPrompt({
      source: contentSource,
      platform,
      goal: goalInput,
      pillar: pillarInput,
      angle: angleInput,
      additionalContext: additionalContext || undefined,
      packageContext,
      topic: topic || undefined,
    });
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Input konten tidak valid.",
    };
  }

  try {
    const response = await openai.responses.create({
      model: AI_MODEL,
      input: prompt,
    });

    const raw = response.output_text?.trim();

    if (!raw) {
      return {
        success: false,
        message: "Gagal membuat konten. Coba lagi.",
      };
    }

    const parsed = parseContentStudioResponse(raw);

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.message,
      };
    }

    const inputTokens = response.usage?.input_tokens ?? 0;
    const outputTokens = response.usage?.output_tokens ?? 0;

    await logAiGeneration({
      supabase,
      organizationId: profile.organization_id,
      userId: profile.id,
      referenceId,
      inputTokens,
      outputTokens,
      feature: "content",
    });

    const { data: savedGeneration, error: saveError } = await supabase
      .from("ai_content_generations")
      .insert({
        organization_id: profile.organization_id,
        created_by: profile.id,
        source_type: contentSource,
        package_id: contentSource === "package_based" ? packageId : null,
        topic: contentSource === "free_topic" ? topic : null,
        platform,
        goal: goalInput,
        content_pillar: pillarInput,
        content_angle: angleInput,
        additional_context: additionalContext || null,
        generated_output: parsed.data,
      })
      .select("id")
      .maybeSingle();

    if (saveError || !savedGeneration) {
      return {
        success: false,
        message:
          saveError?.message ??
          "Konten dibuat, tetapi gagal disimpan ke history.",
      };
    }

    const historyItem = await loadContentGenerationById(
      supabase,
      profile.organization_id,
      savedGeneration.id,
    );

    return {
      success: true,
      data: {
        id: savedGeneration.id,
        source: contentSource,
        result: parsed.data,
      },
      historyItem: historyItem ?? undefined,
    };
  } catch {
    return {
      success: false,
      message: "Gagal membuat konten. Coba lagi dalam beberapa saat.",
    };
  }
}
