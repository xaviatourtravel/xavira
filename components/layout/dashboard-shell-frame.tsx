"use client";

import { useState } from "react";
import { Suspense } from "react";
import { usePathname } from "next/navigation";

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
import { cn } from "@/lib/utils";

function isInboxWorkspacePath(pathname: string | null) {
  return pathname === "/inbox" || pathname?.startsWith("/inbox/") === true;
}

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
  const pathname = usePathname();
  const isInboxWorkspace = isInboxWorkspacePath(pathname);
  const permissions = getProfilePermissions(profile);

  return (
    <PermissionProvider permissions={permissions}>
      <div className="flex h-dvh overflow-hidden bg-background text-foreground">
        <Suspense fallback={<SidebarFallback />}>
          <AppSidebar permissions={permissions} attentionBadges={attentionBadges} />
        </Suspense>

        <MobileSidebarDrawer
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          permissions={permissions}
          attentionBadges={attentionBadges}
        />

        <div className="flex h-full min-w-0 flex-1 flex-col">
          <AppHeader
            profile={profile}
            email={email}
            attentionBadges={attentionBadges}
            workspaceContext={workspaceContext}
            onMenuClick={() => setSidebarOpen(true)}
          />
          {/* Inbox uses a full-bleed workspace surface; other routes scroll inside main. */}
          <main
            className={cn(
              "min-h-0 flex-1 overflow-x-hidden",
              isInboxWorkspace
                ? "overflow-hidden bg-background p-0 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0"
                : "overflow-y-auto bg-muted/20 p-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:p-6 lg:pb-6",
            )}
          >
            {children}
          </main>
        </div>

        <MobileNav permissions={permissions} attentionBadges={attentionBadges} />
        <MobileQuickCreateFab />
      </div>
    </PermissionProvider>
  );
}
