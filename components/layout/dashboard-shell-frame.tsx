"use client";

import { useState } from "react";
import { Suspense } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MobileQuickCreateFab } from "@/components/layout/mobile-quick-create-fab";
import { MobileSidebarDrawer } from "@/components/layout/mobile-sidebar-drawer";
import { PermissionProvider } from "@/components/auth/permission-provider";
import { EMPTY_NAV_ATTENTION_BADGES } from "@/config/navigation";
import type { NavAttentionBadges } from "@/config/navigation";
import { getProfilePermissions } from "@/lib/auth/permissions";
import type { WorkspaceSwitcherContext } from "@/lib/workspace/types";
import type { Profile } from "@/types/app-types";

function SidebarFallback() {
  return <aside className="hidden w-[17.5rem] shrink-0 border-r lg:block" />;
}

export function DashboardShellFrame({
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const permissions = getProfilePermissions(profile);

  return (
    <PermissionProvider permissions={permissions}>
      <div className="flex min-h-screen overflow-x-hidden bg-white">
        <Suspense fallback={<SidebarFallback />}>
          <AppSidebar permissions={permissions} attentionBadges={attentionBadges} />
        </Suspense>

        <MobileSidebarDrawer
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          permissions={permissions}
          attentionBadges={attentionBadges}
        />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
          <AppHeader
            profile={profile}
            email={email}
            attentionBadges={attentionBadges}
            workspaceContext={workspaceContext}
            onMenuClick={() => setSidebarOpen(true)}
          />
          <main className="flex-1 overflow-x-hidden bg-slate-50/30 p-4 md:p-6">
            {children}
          </main>
        </div>

        <MobileNav permissions={permissions} attentionBadges={attentionBadges} />
        <MobileQuickCreateFab />
      </div>
    </PermissionProvider>
  );
}
