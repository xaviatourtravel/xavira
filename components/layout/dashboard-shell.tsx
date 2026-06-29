import { DashboardShellFrame } from "@/components/layout/dashboard-shell-frame";
import { EMPTY_NAV_ATTENTION_BADGES } from "@/config/navigation";
import type { NavAttentionBadges } from "@/config/navigation";
import type { WorkspaceSwitcherContext } from "@/lib/workspace/types";
import type { Profile } from "@/types/app-types";

export function DashboardShell({
  children,
  profile,
  email,
  attentionBadges = EMPTY_NAV_ATTENTION_BADGES,
  workspaceContext,
}: {
  children: React.ReactNode;
  profile: Profile;
  email?: string | null;
  attentionBadges?: NavAttentionBadges;
  workspaceContext: WorkspaceSwitcherContext;
}) {
  return (
    <DashboardShellFrame
      profile={profile}
      email={email}
      attentionBadges={attentionBadges}
      workspaceContext={workspaceContext}
    >
      {children}
    </DashboardShellFrame>
  );
}
