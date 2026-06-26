"use server";

import { AI_MODEL, logAiGeneration } from "@/lib/ai/client";
import {
  buildCustomerAiSummaryCacheEntry,
  CUSTOMER_AI_SUMMARY_CACHE_KEY,
  generateCustomerAiSummary,
  hasMinimalCustomerAiContext,
  loadCustomerAiSummaryContext,
  readCustomerAiSummaryCache,
  type CustomerAiSummary,
} from "@/lib/ai/customer-summary";
import { auditFromProfile } from "@/lib/audit";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";

export type CustomerAiSummaryActionResult = {
  success: boolean;
  message?: string;
  data?: CustomerAiSummary;
  cached?: boolean;
  hasMinimalContext?: boolean;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value === "true" || value === "1";
}

export async function generateCustomerAiSummaryAction(
  formData: FormData,
): Promise<CustomerAiSummaryActionResult> {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const leadId = getString(formData, "lead_id");
  const forceRegenerate = getBoolean(formData, "force_regenerate");

  if (!leadId) {
    return {
      success: false,
      message: "Customer tidak ditemukan.",
    };
  }

  const context = await loadCustomerAiSummaryContext(
    supabase,
    profile.organization_id,
    leadId,
  );

  if (!context) {
    return {
      success: false,
      message: "Customer tidak ditemukan.",
    };
  }

  const hasMinimalContext = hasMinimalCustomerAiContext(context);

  if (!hasMinimalContext) {
    return {
      success: false,
      hasMinimalContext: false,
      message:
        "Not enough customer context yet. Add notes or continue the conversation to generate a better summary.",
    };
  }

  const { data: leadRow } = await supabase
    .from("leads")
    .select("metadata")
    .eq("id", leadId)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  const metadata =
    leadRow?.metadata && typeof leadRow.metadata === "object"
      ? (leadRow.metadata as Record<string, unknown>)
      : {};

  if (!forceRegenerate) {
    const cached = readCustomerAiSummaryCache(metadata, context.fingerprint);

    if (cached) {
      return {
        success: true,
        data: cached,
        cached: true,
        hasMinimalContext: true,
      };
    }
  }

  const result = await generateCustomerAiSummary(context);

  if (!result.success || !result.data) {
    return {
      success: false,
      message:
        result.message ??
        "Gagal membuat ringkasan customer. Coba lagi dalam beberapa saat.",
      hasMinimalContext: true,
    };
  }

  const cacheEntry = buildCustomerAiSummaryCacheEntry(
    context.fingerprint,
    result.data,
  );

  await logAiGeneration({
    supabase,
    organizationId: profile.organization_id,
    userId: profile.id,
    referenceId: leadId,
    inputTokens: result.inputTokens ?? 0,
    outputTokens: result.outputTokens ?? 0,
    feature: "customer_summary",
  });

  await auditFromProfile(supabase, profile, {
    action: "ai_customer_summary_generated",
    entityType: "lead",
    entityId: leadId,
    entityLabel: context.lead.full_name,
    metadata: {
      intent_level: result.data.intentLevel,
      lead_temperature: result.data.leadTemperature,
      insufficient_data: result.data.insufficientData,
      model: AI_MODEL,
    },
  });

  await supabase
    .from("leads")
    .update({
      metadata: {
        ...metadata,
        [CUSTOMER_AI_SUMMARY_CACHE_KEY]: cacheEntry,
      },
    })
    .eq("id", leadId)
    .eq("organization_id", profile.organization_id);

  return {
    success: true,
    data: result.data,
    cached: false,
    hasMinimalContext: true,
  };
}
