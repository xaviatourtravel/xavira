"use server";

import OpenAI from "openai";

import { AI_MODEL, logAiGeneration } from "@/lib/ai/client";
import {
  buildInboxIncomingMessageContext,
  loadInboxChatAssistantContext,
} from "@/lib/ai/sales-assistant-context";
import { buildSalesAssistantPrompt } from "@/lib/ai/sales-assistant";
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

export async function generateInboxChatReply(formData: FormData): Promise<{
  success: boolean;
  message?: string;
}> {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    return {
      success: false,
      message: "Hanya owner atau admin yang dapat menggunakan AI Chat Assistant.",
    };
  }

  const supabase = await createClient();
  const conversationId = getString(formData, "conversation_id");
  const incomingMessage = getString(formData, "incoming_message");

  if (!conversationId) {
    return {
      success: false,
      message: "Percakapan tidak ditemukan.",
    };
  }

  if (!incomingMessage) {
    return {
      success: false,
      message: "Pesan masuk wajib diisi.",
    };
  }

  const context = await loadInboxChatAssistantContext(
    supabase,
    profile.organization_id,
    conversationId,
  );

  if (!context) {
    return {
      success: false,
      message: "Percakapan tidak ditemukan.",
    };
  }

  const prompt = buildSalesAssistantPrompt({
    action: "reply",
    customerContext: buildInboxIncomingMessageContext(
      context.sourceLabel,
      incomingMessage,
    ),
    lead: context.lead,
    selectedPackage: context.selectedPackage,
    activities: context.activities,
    followUpTasks: context.followUpTasks,
    booking: context.booking,
  });

  try {
    const response = await openai.responses.create({
      model: AI_MODEL,
      input: prompt,
    });

    const text = response.output_text?.trim();

    if (!text) {
      return {
        success: false,
        message: "Gagal membuat draf balasan. Coba lagi.",
      };
    }

    const inputTokens = response.usage?.input_tokens ?? 0;
    const outputTokens = response.usage?.output_tokens ?? 0;

    await logAiGeneration({
      supabase,
      organizationId: profile.organization_id,
      userId: profile.id,
      referenceId: context.leadId ?? context.conversationId,
      inputTokens,
      outputTokens,
      feature: "follow_up",
    });

    return {
      success: true,
      message: text,
    };
  } catch {
    return {
      success: false,
      message: "Gagal membuat draf balasan. Coba lagi dalam beberapa saat.",
    };
  }
}
