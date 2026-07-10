"use client";

import { SidebarNavigation } from "@/components/layout/sidebar-navigation";
import {
  AURORA_NAV_RAIL_COLLAPSED_WIDTH,
  AURORA_NAV_RAIL_EXPANDED_WIDTH,
} from "@/components/workspace/aurora-tokens";
import {
  EMPTY_NAV_ATTENTION_BADGES,
  type NavAttentionBadges,
} from "@/config/navigation";
import type { Permission } from "@/lib/auth/permission-matrix";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  permissions: Permission[];
  attentionBadges?: NavAttentionBadges;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
};

export function AppSidebar({
  permissions,
  attentionBadges = EMPTY_NAV_ATTENTION_BADGES,
  collapsed = false,
  onToggleCollapsed,
}: AppSidebarProps) {
  return (
    <aside
      className={cn(
        "hidden h-full shrink-0 flex-col border-r border-border/20 bg-background transition-[width] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex",
        collapsed ? AURORA_NAV_RAIL_COLLAPSED_WIDTH : AURORA_NAV_RAIL_EXPANDED_WIDTH,
      )}
    >
      <SidebarNavigation
        permissions={permissions}
        attentionBadges={attentionBadges}
        collapsed={collapsed}
        onToggleCollapsed={onToggleCollapsed}
      />
    </aside>
  );
}
