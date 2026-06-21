"use server";

import { revalidatePath } from "next/cache";

import { logAiGeneration } from "@/lib/ai/client";
import {
  formatBookingReminderTypeLabel,
  generateBookingPaymentReminder,
  generateLeadFollowUpSuggestion,
  loadBookingPaymentReminderContext,
  loadInboxFollowUpContext,
  loadLeadFollowUpContext,
  parseFollowUpAssistantTone,
} from "@/lib/ai/follow-up-assistant";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";

export type FollowUpAssistantActionResult = {
  success: boolean;
  message?: string;
  suggestion?: string;
  reminderType?: string;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function logFollowUpGeneration({
  supabase,
  organizationId,
  userId,
  referenceId,
  inputTokens,
  outputTokens,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  organizationId: string;
  userId: string;
  referenceId: string;
  inputTokens: number;
  outputTokens: number;
}) {
  await logAiGeneration({
    supabase,
    organizationId,
    userId,
    referenceId,
    inputTokens,
    outputTokens,
    feature: "follow_up",
  });
}

export async function generateLeadFollowUpAssistant(
  formData: FormData,
): Promise<FollowUpAssistantActionResult> {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const leadId = getString(formData, "lead_id");
  const tone = parseFollowUpAssistantTone(getString(formData, "tone"));

  if (!leadId) {
    return { success: false, message: "Lead tidak ditemukan." };
  }

  const context = await loadLeadFollowUpContext(
    supabase,
    profile.organization_id,
    leadId,
  );

  if (!context) {
    return { success: false, message: "Lead tidak ditemukan." };
  }

  const result = await generateLeadFollowUpSuggestion({ context, tone });

  if (!result.success || !result.suggestion) {
    return {
      success: false,
      message: result.message ?? "Gagal membuat draf follow-up.",
    };
  }

  await logFollowUpGeneration({
    supabase,
    organizationId: profile.organization_id,
    userId: profile.id,
    referenceId: leadId,
    inputTokens: result.inputTokens ?? 0,
    outputTokens: result.outputTokens ?? 0,
  });

  await supabase.from("lead_activities").insert({
    organization_id: profile.organization_id,
    lead_id: leadId,
    actor_id: profile.id,
    activity_type: "follow_up_generated",
    title: "AI Follow-Up Assistant",
    body: result.suggestion,
    metadata: {
      source: "follow_up_assistant",
      tone,
      delivery_channels: ["whatsapp", "instagram", "email"],
      auto_send: false,
    },
  });

  revalidatePath(`/leads/${leadId}`);

  return {
    success: true,
    suggestion: result.suggestion,
  };
}

export async function generateBookingPaymentReminderAssistant(
  formData: FormData,
): Promise<FollowUpAssistantActionResult> {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const bookingId = getString(formData, "booking_id");
  const tone = parseFollowUpAssistantTone(getString(formData, "tone"));

  if (!bookingId) {
    return { success: false, message: "Booking tidak ditemukan." };
  }

  const context = await loadBookingPaymentReminderContext(
    supabase,
    profile.organization_id,
    bookingId,
  );

  if (!context) {
    return { success: false, message: "Booking tidak ditemukan." };
  }

  const result = await generateBookingPaymentReminder({ context, tone });

  if (!result.success || !result.suggestion) {
    return {
      success: false,
      message: result.message ?? "Gagal membuat draf reminder.",
    };
  }

  await logFollowUpGeneration({
    supabase,
    organizationId: profile.organization_id,
    userId: profile.id,
    referenceId: bookingId,
    inputTokens: result.inputTokens ?? 0,
    outputTokens: result.outputTokens ?? 0,
  });

  if (context.leadId) {
    await supabase.from("lead_activities").insert({
      organization_id: profile.organization_id,
      lead_id: context.leadId,
      actor_id: profile.id,
      activity_type: "follow_up_generated",
      title: "AI Payment Reminder",
      body: result.suggestion,
      metadata: {
        source: "booking_payment_reminder",
        booking_id: bookingId,
        reminder_type: context.reminderType,
        tone,
        delivery_channels: ["whatsapp", "instagram", "email"],
        auto_send: false,
      },
    });

    revalidatePath(`/leads/${context.leadId}`);
  }

  revalidatePath(`/bookings/${bookingId}`);

  return {
    success: true,
    suggestion: result.suggestion,
    reminderType: formatBookingReminderTypeLabel(context.reminderType),
  };
}

export async function generateInboxFollowUpAssistant(
  formData: FormData,
): Promise<FollowUpAssistantActionResult> {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const conversationId = getString(formData, "conversation_id");
  const tone = parseFollowUpAssistantTone(getString(formData, "tone"));

  if (!conversationId) {
    return { success: false, message: "Conversation not found." };
  }

  const context = await loadInboxFollowUpContext(
    supabase,
    profile.organization_id,
    conversationId,
  );

  if (!context) {
    return {
      success: false,
      message: "Convert this conversation to a lead first.",
    };
  }

  const result = await generateLeadFollowUpSuggestion({ context, tone });

  if (!result.success || !result.suggestion) {
    return {
      success: false,
      message: result.message ?? "Gagal membuat draf follow-up.",
    };
  }

  await logFollowUpGeneration({
    supabase,
    organizationId: profile.organization_id,
    userId: profile.id,
    referenceId: context.leadId,
    inputTokens: result.inputTokens ?? 0,
    outputTokens: result.outputTokens ?? 0,
  });

  revalidatePath("/inbox");
  revalidatePath(`/leads/${context.leadId}`);

  return {
    success: true,
    suggestion: result.suggestion,
  };
}

export async function saveFollowUpAssistantNote(
  formData: FormData,
): Promise<{ success: boolean; message?: string }> {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const leadId = getString(formData, "lead_id");
  const bookingId = getString(formData, "booking_id");
  const body = getString(formData, "body");
  const title =
    getString(formData, "title") || "AI Follow-Up Draft";

  if (!body) {
    return { success: false, message: "Pesan wajib diisi." };
  }

  let resolvedLeadId = leadId;

  if (!resolvedLeadId && bookingId) {
    const { data: booking } = await supabase
      .from("bookings")
      .select("lead_id")
      .eq("id", bookingId)
      .eq("organization_id", profile.organization_id)
      .maybeSingle();

    resolvedLeadId = booking?.lead_id ?? "";
  }

  if (!resolvedLeadId) {
    return {
      success: false,
      message: "Tidak ada lead terhubung untuk menyimpan catatan.",
    };
  }

  const { data: lead } = await supabase
    .from("leads")
    .select("id")
    .eq("id", resolvedLeadId)
    .eq("organization_id", profile.organization_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!lead) {
    return { success: false, message: "Lead tidak ditemukan." };
  }

  const { error } = await supabase.from("lead_activities").insert({
    organization_id: profile.organization_id,
    lead_id: resolvedLeadId,
    actor_id: profile.id,
    activity_type: "note",
    title,
    body,
    metadata: {
      source: "follow_up_assistant",
      booking_id: bookingId || null,
      auto_send: false,
    },
  });

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath(`/leads/${resolvedLeadId}`);
  if (bookingId) {
    revalidatePath(`/bookings/${bookingId}`);
  }

  return { success: true };
}
