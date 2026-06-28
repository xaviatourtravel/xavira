import { createClient } from "@/utils/supabase/server";

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  timezone: string | null;
  settings: Record<string, unknown> | null;
};

export function hasOrganization(
  profile: { organization_id?: string | null },
): boolean {
  return Boolean(profile.organization_id);
}

export async function getCurrentOrganization(): Promise<OrganizationSummary | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.organization_id) {
    return null;
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("id, name, slug, timezone, settings")
    .eq("id", profile.organization_id)
    .maybeSingle();

  if (!organization) {
    return null;
  }

  return {
    ...organization,
    settings: (organization.settings as Record<string, unknown> | null) ?? null,
  };
}
