import { createClient } from "@/utils/supabase/server";

export async function loadBillingSummary(organizationId: string) {
  const supabase = await createClient();

  const [{ data: organization }, { count: teamMemberCount }] = await Promise.all([
    supabase
      .from("organizations")
      .select("name")
      .eq("id", organizationId)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
  ]);

  return {
    workspaceName: organization?.name?.trim() || "Workspace",
    teamMemberCount: teamMemberCount ?? 0,
  };
}
