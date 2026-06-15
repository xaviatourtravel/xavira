"use server";

import OpenAI from "openai";

import {
  buildSalesAssistantPrompt,
  getSalesAssistantActionLabel,
  parseSalesAssistantAction,
} from "@/lib/ai/sales-assistant";
import {
  buildLeadIntelligenceCacheEntry,
  buildLeadIntelligenceFingerprint,
  buildLeadIntelligencePrompt,
  LEAD_INTELLIGENCE_CACHE_KEY,
  parseLeadIntelligenceResponse,
  readLeadIntelligenceCache,
  toLeadIntelligenceResult,
  type LeadIntelligenceResult,
} from "@/lib/ai/lead-intelligence";
import { getEffectiveLeadTemperature } from "@/lib/leads/lead-temperature";
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
  referenceId,
  inputTokens,
  outputTokens,
  feature = "follow_up",
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  organizationId: string;
  userId: string;
  referenceId: string;
  inputTokens: number;
  outputTokens: number;
  feature?: "follow_up" | "lead_scoring";
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

async function loadSalesAssistantContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  leadId: string,
) {
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
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!lead) {
    return null;
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
          .eq("organization_id", organizationId)
          .eq("name", lead.package_interest)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("lead_activities")
      .select("activity_type, title, body, occurred_at")
      .eq("lead_id", leadId)
      .eq("organization_id", organizationId)
      .order("occurred_at", { ascending: false })
      .limit(5),
    supabase
      .from("follow_up_tasks")
      .select("title, description, due_date, status")
      .eq("lead_id", leadId)
      .eq("organization_id", organizationId)
      .order("due_date", { ascending: true })
      .limit(5),
    supabase
      .from("bookings")
      .select("booking_code, package_name, payment_status, booking_status")
      .eq("lead_id", leadId)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    lead,
    selectedPackage,
    activities: activities ?? [],
    followUpTasks: followUpTasks ?? [],
    booking: booking ?? null,
  };
}

export async function generateAiSalesAssistant(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const leadId = getString(formData, "lead_id");
  const action = parseSalesAssistantAction(
    getString(formData, "action") || getString(formData, "reply_type"),
  );
  const customerContext = getString(formData, "customer_context");

  if (!leadId) {
    return {
      success: false,
      message: "Lead tidak ditemukan.",
    };
  }

  if (!action) {
    return {
      success: false,
      message: "Pilih aksi terlebih dahulu.",
    };
  }

  const context = await loadSalesAssistantContext(
    supabase,
    profile.organization_id,
    leadId,
  );

  if (!context) {
    return {
      success: false,
      message: "Lead tidak ditemukan.",
    };
  }

  const prompt = buildSalesAssistantPrompt({
    action,
    customerContext,
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
        message: "Gagal membuat draf pesan. Coba lagi.",
      };
    }

    const inputTokens = response.usage?.input_tokens ?? 0;
    const outputTokens = response.usage?.output_tokens ?? 0;

    if (action === "follow_up") {
      await supabase.from("follow_ups").insert({
        organization_id: profile.organization_id,
        created_by: profile.id,
        lead_id: context.lead.id,
        generated_body: text,
        status: "draft",
        channel: "whatsapp",
        tone: "professional",
      });
    }

    await logAiGeneration({
      supabase,
      organizationId: profile.organization_id,
      userId: profile.id,
      referenceId: context.lead.id,
      inputTokens,
      outputTokens,
    });

    await supabase.from("lead_activities").insert({
      organization_id: profile.organization_id,
      lead_id: context.lead.id,
      activity_type: "follow_up_generated",
      title: `Draf pesan: ${getSalesAssistantActionLabel(action)}`,
      body: text,
      metadata: {
        source: "sales_assistant",
        action,
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
      message: "Gagal membuat draf pesan. Coba lagi dalam beberapa saat.",
    };
  }
}

async function loadLeadIntelligenceContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  leadId: string,
) {
  const { data: lead } = await supabase
    .from("leads")
    .select(
      "id, full_name, source, status, package_interest, notes, lead_temperature, updated_at, metadata",
    )
    .eq("id", leadId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!lead) {
    return null;
  }

  const [{ data: activities }, { data: followUpTasks }] = await Promise.all([
    supabase
      .from("lead_activities")
      .select("activity_type, title, body, occurred_at")
      .eq("lead_id", leadId)
      .eq("organization_id", organizationId)
      .order("occurred_at", { ascending: false })
      .limit(10),
    supabase
      .from("follow_up_tasks")
      .select("title, description, due_date, status")
      .eq("lead_id", leadId)
      .eq("organization_id", organizationId)
      .order("due_date", { ascending: true }),
  ]);

  const activityRows = activities ?? [];
  const followUpRows = followUpTasks ?? [];
  const effectiveTemperature = getEffectiveLeadTemperature({
    lead_temperature: lead.lead_temperature,
    status: lead.status,
    updated_at: lead.updated_at,
  });
  const fingerprint = buildLeadIntelligenceFingerprint({
    updatedAt: lead.updated_at,
    status: lead.status,
    notes: lead.notes,
    leadTemperature: effectiveTemperature.value,
    packageInterest: lead.package_interest,
    activityCount: activityRows.length,
    latestActivityAt: activityRows[0]?.occurred_at ?? null,
    followUpPendingCount: followUpRows.filter(
      (task) => task.status === "pending",
    ).length,
    followUpCompletedCount: followUpRows.filter(
      (task) => task.status === "completed",
    ).length,
  });

  return {
    lead,
    activities: activityRows,
    followUpTasks: followUpRows,
    fingerprint,
  };
}

function getBoolean(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value === "true" || value === "1";
}

export async function generateAiLeadIntelligence(
  formData: FormData,
): Promise<{
  success: boolean;
  message?: string;
  data?: LeadIntelligenceResult;
}> {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const leadId = getString(formData, "lead_id");
  const forceRegenerate = getBoolean(formData, "force_regenerate");

  if (!leadId) {
    return {
      success: false,
      message: "Lead tidak ditemukan.",
    };
  }

  const context = await loadLeadIntelligenceContext(
    supabase,
    profile.organization_id,
    leadId,
  );

  if (!context) {
    return {
      success: false,
      message: "Lead tidak ditemukan.",
    };
  }

  const metadata =
    context.lead.metadata && typeof context.lead.metadata === "object"
      ? (context.lead.metadata as Record<string, unknown>)
      : {};

  if (!forceRegenerate) {
    const cached = readLeadIntelligenceCache(metadata, context.fingerprint);

    if (cached) {
      return {
        success: true,
        data: toLeadIntelligenceResult(cached, true),
      };
    }
  }

  const prompt = buildLeadIntelligencePrompt({
    lead: context.lead,
    activities: context.activities,
    followUpTasks: context.followUpTasks,
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
        message: "Gagal menganalisis lead. Coba lagi.",
      };
    }

    const parsed = parseLeadIntelligenceResponse(text);

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.message,
      };
    }

    const cacheEntry = buildLeadIntelligenceCacheEntry(
      context.fingerprint,
      parsed.data,
    );
    const result = toLeadIntelligenceResult(cacheEntry, false);

    const inputTokens = response.usage?.input_tokens ?? 0;
    const outputTokens = response.usage?.output_tokens ?? 0;

    await logAiGeneration({
      supabase,
      organizationId: profile.organization_id,
      userId: profile.id,
      referenceId: context.lead.id,
      inputTokens,
      outputTokens,
      feature: "lead_scoring",
    });

    await supabase
      .from("leads")
      .update({
        metadata: {
          ...metadata,
          [LEAD_INTELLIGENCE_CACHE_KEY]: cacheEntry,
        },
      })
      .eq("id", context.lead.id)
      .eq("organization_id", profile.organization_id);

    return {
      success: true,
      data: result,
    };
  } catch {
    return {
      success: false,
      message: "Gagal menganalisis lead. Coba lagi dalam beberapa saat.",
    };
  }
}
