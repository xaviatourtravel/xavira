import { createAdminClient } from "@/utils/supabase/admin";
import type { createClient } from "@/utils/supabase/server";
import type { UserRole } from "@/types/app-types";

export type TeamMemberRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  status: string;
  created_at: string;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function loadOrganizationTeamMembers(
  supabase: SupabaseServerClient,
  organizationId: string,
): Promise<TeamMemberRow[]> {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Gagal memuat anggota tim.");
  }

  const rows = profiles ?? [];

  if (rows.length === 0) {
    return [];
  }

  const adminClient = createAdminClient();
  const emailByUserId = new Map<string, string | null>();

  await Promise.all(
    rows.map(async (member) => {
      const { data, error: userError } =
        await adminClient.auth.admin.getUserById(member.id);

      emailByUserId.set(
        member.id,
        userError ? null : (data.user?.email ?? null),
      );
    }),
  );

  return rows.map((member) => ({
    id: member.id,
    full_name: member.full_name,
    email: emailByUserId.get(member.id) ?? null,
    role: member.role,
    status: "Active",
    created_at: member.created_at,
  }));
}

export async function countOrganizationOwners(
  supabase: SupabaseServerClient,
  organizationId: string,
) {
  const { count, error } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("role", "owner");

  if (error) {
    throw new Error("Gagal memvalidasi owner organisasi.");
  }

  return count ?? 0;
}
