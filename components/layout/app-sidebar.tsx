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
    <aside className="hidden h-full w-[17.5rem] shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      <SidebarNavigation permissions={permissions} attentionBadges={attentionBadges} />
    </aside>
  );
}
