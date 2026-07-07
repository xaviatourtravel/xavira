import { DEFAULT_AI_TIMEZONE } from "@/lib/ai/temporal-context";
import type { createClient } from "@/utils/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function resolveOrganizationTimezone(
  supabase: SupabaseServerClient,
  organizationId: string,
): Promise<string> {
  const { data } = await supabase
    .from("organizations")
    .select("timezone")
    .eq("id", organizationId)
    .maybeSingle();

  return data?.timezone?.trim() || DEFAULT_AI_TIMEZONE;
}
