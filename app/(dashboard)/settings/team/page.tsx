import { redirect } from "next/navigation";

import { InviteMemberPanel } from "@/components/settings/invite-member-panel";
import { TeamInvitesTable } from "@/components/settings/team-invites-table";
import { TeamMembersTable } from "@/components/settings/team-members-table";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { loadOrganizationInvites } from "@/lib/team/invites";
import { loadOrganizationTeamMembers } from "@/lib/team/queries";
import { createClient } from "@/utils/supabase/server";

export default async function TeamSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    redirect(
      `/dashboard?error=${encodeURIComponent("Hanya owner atau admin yang dapat mengelola tim.")}`,
    );
  }

  const supabase = await createClient();
  const [members, invites] = await Promise.all([
    loadOrganizationTeamMembers(supabase, profile.organization_id),
    loadOrganizationInvites(supabase, profile.organization_id),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Team Management</h1>
        <p className="text-sm text-muted-foreground">
          Kelola anggota tim dan undangan untuk organisasi Anda.
        </p>
      </div>

      {params?.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(params.error)}
        </div>
      )}

      <InviteMemberPanel />

      <TeamMembersTable members={members} currentUserId={profile.id} />

      <TeamInvitesTable invites={invites} />
    </div>
  );
}
