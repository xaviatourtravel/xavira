import { getOrgCampaignOptions } from "@/lib/campaigns/queries";
import type { LeadFormOptions } from "@/lib/leads/lead-form-types";
import type { createClient } from "@/utils/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function loadLeadFormOptions(
  supabase: SupabaseServerClient,
  organizationId: string,
): Promise<LeadFormOptions> {
  const [{ data: packages }, { data: orgProfiles }, campaigns] =
    await Promise.all([
      supabase
        .from("packages")
        .select("id, name")
        .eq("organization_id", organizationId)
        .eq("status", "active")
        .order("name"),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("organization_id", organizationId)
        .order("full_name"),
      getOrgCampaignOptions(supabase, organizationId),
    ]);

  return {
    packages: packages ?? [],
    campaigns,
    orgProfiles: orgProfiles ?? [],
  };
}
