"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import {
  EMPTY_NAV_ATTENTION_BADGES,
  WORKSPACE_NAV,
  filterWorkspaceNav,
  getWorkspaceForPath,
  isNavPathActive,
  type NavAttentionBadges,
  type WorkspaceNavItem,
} from "@/config/navigation";
import { siteConfig } from "@/config/site";
import type { Permission } from "@/lib/auth/permission-matrix";
import { cn } from "@/lib/utils";

type SidebarNavigationProps = {
  permissions: Permission[];
  attentionBadges?: NavAttentionBadges;
  onNavigate?: () => void;
  showBrand?: boolean;
};

const PRIMARY_WORKSPACES = WORKSPACE_NAV.filter(
  (workspace) => workspace.id !== "settings",
);

export function SidebarNavigation({
  permissions,
  attentionBadges = EMPTY_NAV_ATTENTION_BADGES,
  onNavigate,
  showBrand = true,
}: SidebarNavigationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const permissionSet = new Set(permissions);
  const visibleWorkspaces = filterWorkspaceNav(PRIMARY_WORKSPACES, permissionSet);
  const settingsWorkspace = WORKSPACE_NAV.find((item) => item.id === "settings");
  const activeWorkspaceId = getWorkspaceForPath(pathname);

  return (
    <>
      {showBrand ? (
        <div className="flex h-14 items-center border-b border-slate-200/80 px-5">
          <Link
            href="/today"
            onClick={onNavigate}
            className="text-lg font-semibold tracking-tight text-slate-950"
          >
            {siteConfig.name}
          </Link>
        </div>
      ) : null}

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Workspaces
        </p>

        {visibleWorkspaces.map((workspace) => (
          <WorkspaceNavSection
            key={workspace.id}
            workspace={workspace}
            pathname={pathname}
            searchParams={searchParams}
            isActive={activeWorkspaceId === workspace.id}
            badgeCount={
              workspace.badgeKey ? attentionBadges[workspace.badgeKey] : 0
            }
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {settingsWorkspace && permissionSet.has(settingsWorkspace.permission) ? (
        <div className="border-t border-slate-200/80 p-3">
          <SidebarLink
            workspace={settingsWorkspace}
            isActive={activeWorkspaceId === "settings"}
            onNavigate={onNavigate}
          />
        </div>
      ) : null}
    </>
  );
}

function WorkspaceNavSection({
  workspace,
  pathname,
  searchParams,
  isActive,
  badgeCount,
  onNavigate,
}: {
  workspace: WorkspaceNavItem;
  pathname: string;
  searchParams: ReturnType<typeof useSearchParams>;
  isActive: boolean;
  badgeCount: number;
  onNavigate?: () => void;
}) {
  const hasChildren = workspace.items.length > 0;
  const expanded = isActive && hasChildren;

  return (
    <div className="space-y-0.5">
      <SidebarLink
        workspace={workspace}
        isActive={isActive}
        badgeCount={badgeCount}
        onNavigate={onNavigate}
      />

      {expanded ? (
        <ul className="ml-4 space-y-0.5 border-l border-slate-200 pl-3">
          {workspace.items.map((item) => {
            const childActive = isChildNavActive(pathname, searchParams, item.href);

            return (
              <li key={`${item.title}-${item.href}`}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex min-h-[44px] items-center rounded-lg px-3 py-2 text-sm transition-colors",
                    childActive
                      ? "bg-white font-medium text-slate-950 shadow-sm ring-1 ring-slate-200/80"
                      : "text-slate-600 hover:bg-white/70 hover:text-slate-900",
                  )}
                >
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function SidebarLink({
  workspace,
  isActive,
  badgeCount = 0,
  onNavigate,
}: {
  workspace: WorkspaceNavItem;
  isActive: boolean;
  badgeCount?: number;
  onNavigate?: () => void;
}) {
  const Icon = workspace.icon;

  return (
    <Link
      href={workspace.href}
      title={workspace.businessQuestion}
      onClick={onNavigate}
      className={cn(
        "flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
        isActive
          ? "bg-slate-950 font-medium text-white shadow-sm"
          : "text-slate-700 hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-slate-200/80",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-slate-500")} />
      <span className="min-w-0 flex-1 truncate">{workspace.title}</span>
      {badgeCount > 0 ? (
        <AttentionBadge count={badgeCount} inverted={isActive} />
      ) : null}
    </Link>
  );
}

function AttentionBadge({
  count,
  inverted = false,
}: {
  count: number;
  inverted?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums",
        inverted
          ? "bg-amber-400 text-slate-950"
          : "bg-amber-100 text-amber-800 ring-1 ring-amber-200/80",
      )}
      aria-label={`${count} items need attention`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function isChildNavActive(
  pathname: string,
  searchParams: ReturnType<typeof useSearchParams>,
  href: string,
) {
  const [path, query] = href.split("?");

  if (query) {
    const currentQuery = searchParams.toString();
    const normalizedPath =
      pathname.endsWith("/") && pathname.length > 1
        ? pathname.slice(0, -1)
        : pathname;

    return normalizedPath === path && currentQuery === query;
  }

  return isNavPathActive(pathname, href);
}
