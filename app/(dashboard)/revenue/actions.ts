"use server";

import OpenAI from "openai";

import { AI_MODEL, logAiGeneration } from "@/lib/ai/client";
import {
  buildRevenueInsightsPrompt,
  parseRevenueInsightsResponse,
  type RevenueInsight,
} from "@/lib/ai/revenue-insights";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { loadRevenueIntelligenceMetrics } from "@/lib/dashboard/revenue-intelligence";
import { createClient } from "@/utils/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type GenerateRevenueInsightsResult =
  | { success: true; insights: RevenueInsight[] }
  | { success: false; message: string };

export async function generateRevenueInsights(): Promise<GenerateRevenueInsightsResult> {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    return {
      success: false,
      message: "Hanya owner atau admin yang dapat membuat insight.",
    };
  }

  const metrics = await loadRevenueIntelligenceMetrics(profile);

  if (!metrics.hasData) {
    return {
      success: false,
      message: "Belum ada data lead atau booking untuk dianalisis.",
    };
  }

  const prompt = buildRevenueInsightsPrompt(metrics);

  try {
    const response = await openai.responses.create({
      model: AI_MODEL,
      input: prompt,
    });

    const raw = response.output_text?.trim();

    if (!raw) {
      return {
        success: false,
        message: "Gagal membuat insight. Coba lagi sebentar.",
      };
    }

    const insights = parseRevenueInsightsResponse(raw);

    if (insights.length === 0) {
      return {
        success: false,
        message: "Insight tidak dapat diproses. Coba lagi sebentar.",
      };
    }

    const supabase = await createClient();
    await logAiGeneration({
      supabase,
      organizationId: profile.organization_id,
      userId: profile.id,
      referenceId: profile.organization_id,
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
      feature: "lead_scoring",
    });

    return { success: true, insights };
  } catch (error) {
    console.error("generateRevenueInsights failed", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat menghubungi AI. Coba lagi.",
    };
  }
}
