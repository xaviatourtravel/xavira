"use server";

import OpenAI from "openai";

import { AI_MODEL, logAiGeneration } from "@/lib/ai/client";
import {
  buildOmnichannelSuggestReplyPrompt,
  loadOmnichannelSuggestReplyContext,
} from "@/lib/omnichannel-inbox/ai-suggest-reply";
import {
  buildOmnichannelLeadExtractionPrompt,
  loadOmnichannelLeadExtractionContext,
  parseInboxLeadExtractionResponse,
  type InboxLeadExtractionData,
} from "@/lib/omnichannel-inbox/ai-lead-extraction";
import { canExtractOmnichannelLeadInfo, canSuggestOmnichannelReply } from "@/lib/omnichannel-inbox/permissions";
import { findConversationById } from "@/lib/omnichannel-inbox/repository";
import { findWhatsappConversationById } from "@/lib/whatsapp-inbox/repository";
import { loadWhatsappLeadExtractionContext } from "@/lib/whatsapp-inbox/ai-context";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

type SuggestReplyResult = {
  success: boolean;
  message?: string;
  suggestion?: string;
};

type ExtractLeadResult = {
  success: boolean;
  message?: string;
  extraction?: InboxLeadExtractionData;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function suggestOmnichannelReply(
  formData: FormData,
): Promise<SuggestReplyResult> {
  const conversationId = getString(formData, "conversation_id");

  if (!conversationId) {
    return { success: false, message: "Conversation not found." };
  }

  if (!openai) {
    return {
      success: false,
      message: "AI suggestion failed. Please try again.",
    };
  }

  try {
    const { profile } = await requireProfile();
    const supabase = await createClient();

    const conversation = await findConversationById(
      supabase,
      profile.organization_id,
      conversationId,
    );

    if (!conversation) {
      return { success: false, message: "Conversation not found." };
    }

    if (
      !canSuggestOmnichannelReply(profile, {
        assigned_user_id: conversation.assigned_user_id,
      })
    ) {
      return {
        success: false,
        message: "You do not have permission to use AI suggestions here.",
      };
    }

    const context = await loadOmnichannelSuggestReplyContext(
      supabase,
      profile.organization_id,
      conversationId,
    );

    if (!context) {
      return { success: false, message: "Conversation not found." };
    }

    const prompt = buildOmnichannelSuggestReplyPrompt(context);

    const response = await openai.responses.create({
      model: AI_MODEL,
      input: prompt,
    });

    const suggestion = response.output_text?.trim();

    if (!suggestion) {
      return {
        success: false,
        message: "AI suggestion failed. Please try again.",
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
      feature: "sales_script",
    });

    return {
      success: true,
      suggestion,
    };
  } catch {
    return {
      success: false,
      message: "AI suggestion failed. Please try again.",
    };
  }
}

export async function extractOmnichannelLeadInfo(
  formData: FormData,
): Promise<ExtractLeadResult> {
  const conversationId = getString(formData, "conversation_id");

  if (!conversationId) {
    return { success: false, message: "Conversation not found." };
  }

  if (!openai) {
    return {
      success: false,
      message: "AI extraction failed. Please try again.",
    };
  }

  try {
    const { profile } = await requireProfile();
    const supabase = await createClient();

    const conversation = await findConversationById(
      supabase,
      profile.organization_id,
      conversationId,
    );

    if (conversation) {
      if (
        !canExtractOmnichannelLeadInfo(profile, {
          assigned_user_id: conversation.assigned_user_id,
        })
      ) {
        return {
          success: false,
          message: "You do not have permission to extract lead info here.",
        };
      }

      if (conversation.lead_id) {
        return {
          success: false,
          message: "This conversation is already linked to a lead.",
        };
      }

      const context = await loadOmnichannelLeadExtractionContext(
        supabase,
        profile.organization_id,
        conversationId,
      );

      if (!context) {
        return { success: false, message: "Conversation not found." };
      }

      const prompt = buildOmnichannelLeadExtractionPrompt(context);

      const response = await openai.responses.create({
        model: AI_MODEL,
        input: prompt,
      });

      const raw = response.output_text?.trim();

      if (!raw) {
        return {
          success: false,
          message: "AI extraction failed. Please try again.",
        };
      }

      const parsed = parseInboxLeadExtractionResponse(raw);

      if (!parsed.success) {
        return { success: false, message: parsed.message };
      }

      const inputTokens = response.usage?.input_tokens ?? 0;
      const outputTokens = response.usage?.output_tokens ?? 0;

      await logAiGeneration({
        supabase,
        organizationId: profile.organization_id,
        userId: profile.id,
        referenceId: context.conversationId,
        inputTokens,
        outputTokens,
        feature: "lead_scoring",
      });

      return {
        success: true,
        extraction: parsed.data,
      };
    }

    const whatsappConversation = await findWhatsappConversationById(
      supabase,
      profile.organization_id,
      conversationId,
    );

    if (!whatsappConversation) {
      return { success: false, message: "Conversation not found." };
    }

    if (
      !canExtractOmnichannelLeadInfo(profile, {
        assigned_user_id: whatsappConversation.assigned_user_id,
      })
    ) {
      return {
        success: false,
        message: "You do not have permission to extract lead info here.",
      };
    }

    if (whatsappConversation.customer_id) {
      return {
        success: false,
        message: "This conversation is already linked to a lead.",
      };
    }

    const context = await loadWhatsappLeadExtractionContext(
      supabase,
      profile.organization_id,
      conversationId,
    );

    if (!context) {
      return { success: false, message: "Conversation not found." };
    }

    const prompt = buildOmnichannelLeadExtractionPrompt(context);

    const response = await openai.responses.create({
      model: AI_MODEL,
      input: prompt,
    });

    const raw = response.output_text?.trim();

    if (!raw) {
      return {
        success: false,
        message: "AI extraction failed. Please try again.",
      };
    }

    const parsed = parseInboxLeadExtractionResponse(raw);

    if (!parsed.success) {
      return { success: false, message: parsed.message };
    }

    const inputTokens = response.usage?.input_tokens ?? 0;
    const outputTokens = response.usage?.output_tokens ?? 0;

    await logAiGeneration({
      supabase,
      organizationId: profile.organization_id,
      userId: profile.id,
      referenceId: context.conversationId,
      inputTokens,
      outputTokens,
      feature: "lead_scoring",
    });

    return {
      success: true,
      extraction: parsed.data,
    };
  } catch {
    return {
      success: false,
      message: "AI extraction failed. Please try again.",
    };
  }
}
