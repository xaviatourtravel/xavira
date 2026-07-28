import { requireOrganizationProfile } from "@/lib/auth/session";
import { AiTeamMemberWorkspace } from "@/modules/ai-team-member/components/ai-team-member-workspace";

export const metadata = { title: "AI Team Member · Desklabs" };

export default async function AiTeamMemberPage() {
  const { profile } = await requireOrganizationProfile();
  return <AiTeamMemberWorkspace organizationId={profile.organization_id} />;
}
