import OpenAI from "openai";

import { AI_MODEL } from "@/lib/ai/client";

import {
  buildBookingPaymentReminderPrompt,
  buildLeadFollowUpPrompt,
} from "./prompts";
import type {
  BookingPaymentReminderContext,
  LeadFollowUpContext,
} from "./context";
import {
  isBookingPaymentSettled,
  normalizeBookingPaymentStatus,
} from "@/lib/bookings/payment-status";

import { type FollowUpAssistantTone } from "./constants";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export type FollowUpGenerationResult = {
  success: boolean;
  message?: string;
  suggestion?: string;
  inputTokens?: number;
  outputTokens?: number;
};

export async function generateLeadFollowUpSuggestion({
  context,
  tone,
  timezone,
}: {
  context: LeadFollowUpContext;
  tone: FollowUpAssistantTone;
  timezone?: string | null;
}): Promise<FollowUpGenerationResult> {
  if (!openai) {
    return {
      success: false,
      message: "AI belum dikonfigurasi. Hubungi admin.",
    };
  }

  try {
    const response = await openai.responses.create({
      model: AI_MODEL,
      input: buildLeadFollowUpPrompt(context, tone, timezone),
    });

    const suggestion = response.output_text?.trim();

    if (!suggestion) {
      return {
        success: false,
        message: "Gagal membuat draf follow-up. Coba lagi.",
      };
    }

    return {
      success: true,
      suggestion,
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
    };
  } catch {
    return {
      success: false,
      message: "Gagal membuat draf follow-up. Coba lagi dalam beberapa saat.",
    };
  }
}

export async function generateBookingPaymentReminder({
  context,
  tone,
  timezone,
}: {
  context: BookingPaymentReminderContext;
  tone: FollowUpAssistantTone;
  timezone?: string | null;
}): Promise<FollowUpGenerationResult> {
  if (!openai) {
    return {
      success: false,
      message: "AI belum dikonfigurasi. Hubungi admin.",
    };
  }

  if (
    isBookingPaymentSettled(context.paymentStatus) ||
    (context.outstandingBalance <= 0 &&
      normalizeBookingPaymentStatus(context.paymentStatus) === "fully_paid")
  ) {
    return {
      success: false,
      message: "Booking ini sudah lunas. Reminder pembayaran tidak diperlukan.",
    };
  }

  try {
    const response = await openai.responses.create({
      model: AI_MODEL,
      input: buildBookingPaymentReminderPrompt(context, tone, timezone),
    });

    const suggestion = response.output_text?.trim();

    if (!suggestion) {
      return {
        success: false,
        message: "Gagal membuat draf reminder. Coba lagi.",
      };
    }

    return {
      success: true,
      suggestion,
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
    };
  } catch {
    return {
      success: false,
      message: "Gagal membuat draf reminder. Coba lagi dalam beberapa saat.",
    };
  }
}
