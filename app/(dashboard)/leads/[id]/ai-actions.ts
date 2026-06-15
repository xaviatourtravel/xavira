"use server";

import OpenAI from "openai";

import {
  buildReplyAssistantPrompt,
  getReplyAssistantTypeLabel,
  parseReplyAssistantType,
} from "@/lib/ai/reply-assistant";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const AI_MODEL = "gpt-4.1-mini";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function logAiGeneration({
  supabase,
  organizationId,
  userId,
  feature,
  referenceId,
  inputTokens,
  outputTokens,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  organizationId: string;
  userId: string;
  feature: string;
  referenceId: string;
  inputTokens: number;
  outputTokens: number;
}) {
  const estimatedCostUsd = inputTokens * 0.0000004 + outputTokens * 0.0000016;

  await supabase.from("ai_generation_logs").insert({
    organization_id: organizationId,
    user_id: userId,
    feature,
    model: AI_MODEL,
    reference_id: referenceId,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    estimated_cost_usd: estimatedCostUsd,
  });
}

export async function generateAiFollowUp(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const leadId = getString(formData, "lead_id");

  if (!leadId) {
    return {
      success: false,
      message: "Lead tidak ditemukan.",
    };
  }

  const { data: lead } = await supabase
    .from("leads")
    .select(
      "id, full_name, status, interest_type, package_interest, notes, whatsapp_number, phone",
    )
    .eq("id", leadId)
    .eq("organization_id", profile.organization_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!lead) {
    return {
      success: false,
      message: "Lead tidak ditemukan.",
    };
  }

  const { data: selectedPackage } = lead.package_interest
    ? await supabase
        .from("packages")
        .select("name, destination, departure_date, duration_days, price_idr, quota")
        .eq("organization_id", profile.organization_id)
        .eq("name", lead.package_interest)
        .maybeSingle()
    : { data: null };

  const { data: activities } = await supabase
    .from("lead_activities")
    .select("activity_type, title, body, occurred_at")
    .eq("lead_id", leadId)
    .eq("organization_id", profile.organization_id)
    .order("occurred_at", { ascending: false })
    .limit(5);

  const prompt = `
Kamu adalah sales assistant untuk travel Umroh dan Halal Tour.

Buat pesan WhatsApp follow up dalam Bahasa Indonesia.
Gaya bahasa: sopan, hangat, profesional, tidak terlalu panjang.
Jangan terlalu hard selling.
Gunakan sapaan nama lead.

Data lead:
- Nama: ${lead.full_name}
- Status: ${lead.status}
- Minat: ${lead.interest_type}
- Paket diminati: ${lead.package_interest ?? "-"}
- Catatan lead: ${lead.notes ?? "-"}

Data paket:
- Nama paket: ${selectedPackage?.name ?? "-"}
- Destinasi: ${selectedPackage?.destination ?? "-"}
- Durasi: ${selectedPackage?.duration_days ?? "-"} hari
- Harga: ${selectedPackage?.price_idr ?? "-"}
- Kuota: ${selectedPackage?.quota ?? "-"}
- Tanggal berangkat: ${selectedPackage?.departure_date ?? "-"}

Aktivitas terakhir:
${(activities ?? [])
  .map(
    (activity) =>
      `- ${activity.activity_type}: ${activity.title ?? ""} ${activity.body ?? ""}`,
  )
  .join("\n")}

Output hanya isi pesan WhatsApp. Jangan pakai markdown.
`;

  const response = await openai.responses.create({
    model: AI_MODEL,
    input: prompt,
  });

  const text = response.output_text;
  await supabase
  .from("follow_ups")
  .insert({
    organization_id: profile.organization_id,
    created_by: profile.id,
    lead_id: lead.id,

    generated_body: text,

    status: "draft",
    channel: "whatsapp",
    tone: "professional",
  });

  const inputTokens = response.usage?.input_tokens ?? 0;
  const outputTokens = response.usage?.output_tokens ?? 0;

  await logAiGeneration({
    supabase,
    organizationId: profile.organization_id,
    userId: profile.id,
    feature: "follow_up",
    referenceId: lead.id,
    inputTokens,
    outputTokens,
  });

  await supabase
  .from("lead_activities")
  .insert({
    organization_id: profile.organization_id,
    lead_id: lead.id,

    activity_type: "follow_up_generated",

    title: "AI Follow Up Generated",

    body: text,

    metadata: {
      source: "ai",
      model: AI_MODEL,
    },
  });

  return {
    success: true,
    message: text,
  };
}

export async function generateAiReplyAssistant(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const leadId = getString(formData, "lead_id");
  const replyType = parseReplyAssistantType(getString(formData, "reply_type"));
  const customerContext = getString(formData, "customer_context");

  if (!leadId) {
    return {
      success: false,
      message: "Lead tidak ditemukan.",
    };
  }

  if (!replyType) {
    return {
      success: false,
      message: "Pilih jenis balasan terlebih dahulu.",
    };
  }

  const { data: lead } = await supabase
    .from("leads")
    .select(
      `
      id,
      full_name,
      status,
      interest_type,
      package_interest,
      notes,
      lead_temperature,
      updated_at,
      budget_idr,
      travel_date_preference,
      party_size
    `,
    )
    .eq("id", leadId)
    .eq("organization_id", profile.organization_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!lead) {
    return {
      success: false,
      message: "Lead tidak ditemukan.",
    };
  }

  const [
    { data: selectedPackage },
    { data: activities },
    { data: followUpTasks },
    { data: booking },
  ] = await Promise.all([
    lead.package_interest
      ? supabase
          .from("packages")
          .select(
            "name, destination, departure_date, duration_days, price_idr, quota",
          )
          .eq("organization_id", profile.organization_id)
          .eq("name", lead.package_interest)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("lead_activities")
      .select("activity_type, title, body, occurred_at")
      .eq("lead_id", leadId)
      .eq("organization_id", profile.organization_id)
      .order("occurred_at", { ascending: false })
      .limit(5),
    supabase
      .from("follow_up_tasks")
      .select("title, description, due_date, status")
      .eq("lead_id", leadId)
      .eq("organization_id", profile.organization_id)
      .order("due_date", { ascending: true })
      .limit(5),
    supabase
      .from("bookings")
      .select("booking_code, package_name, payment_status, booking_status")
      .eq("lead_id", leadId)
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const prompt = buildReplyAssistantPrompt({
    replyType,
    customerContext,
    lead,
    selectedPackage,
    activities: activities ?? [],
    followUpTasks: followUpTasks ?? [],
    booking: booking ?? null,
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
      feature: "reply_assistant",
      referenceId: lead.id,
      inputTokens,
      outputTokens,
    });

    await supabase.from("lead_activities").insert({
      organization_id: profile.organization_id,
      lead_id: lead.id,
      activity_type: "follow_up_generated",
      title: `Draf balasan: ${getReplyAssistantTypeLabel(replyType)}`,
      body: text,
      metadata: {
        source: "reply_assistant",
        reply_type: replyType,
        model: AI_MODEL,
      },
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