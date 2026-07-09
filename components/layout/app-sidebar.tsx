"use client";

import { SidebarNavigation } from "@/components/layout/sidebar-navigation";
import {
  EMPTY_NAV_ATTENTION_BADGES,
  type NavAttentionBadges,
} from "@/config/navigation";
import type { Permission } from "@/lib/auth/permission-matrix";

type AppSidebarProps = {
  permissions: Permission[];
  attentionBadges?: NavAttentionBadges;
};

export function AppSidebar({
  permissions,
  attentionBadges = EMPTY_NAV_ATTENTION_BADGES,
}: AppSidebarProps) {
  return (
    <aside className="hidden h-full w-[248px] min-w-[248px] max-w-[248px] shrink-0 flex-col border-r border-border/20 bg-background lg:flex">
      <SidebarNavigation permissions={permissions} attentionBadges={attentionBadges} />
    </aside>
  );
}
