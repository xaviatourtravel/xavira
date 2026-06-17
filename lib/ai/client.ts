import type { createClient } from "@/utils/supabase/server";

export const AI_MODEL = "gpt-4.1-mini";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function logAiGeneration({
  supabase,
  organizationId,
  userId,
  referenceId,
  inputTokens,
  outputTokens,
  feature = "follow_up",
}: {
  supabase: SupabaseServerClient;
  organizationId: string;
  userId: string;
  referenceId: string;
  inputTokens: number;
  outputTokens: number;
  feature?: "follow_up" | "content" | "sales_script" | "lead_scoring" | "thumbnail";
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
