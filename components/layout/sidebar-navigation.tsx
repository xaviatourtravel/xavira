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
import { BrandLogo } from "@/components/brand/brand-logo";
import type { Permission } from "@/lib/auth/permission-matrix";
import {
  translateNavChildTitle,
  translateWorkspaceTitle,
} from "@/lib/i18n/navigation-labels";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

type SidebarNavigationProps = {
  permissions: Permission[];
  attentionBadges?: NavAttentionBadges;
  onNavigate?: () => void;
  showBrand?: boolean;
  /** Icon-only mark for compact drawers / collapsed states. */
  brandVariant?: "full" | "icon";
};

const PRIMARY_WORKSPACES = WORKSPACE_NAV.filter(
  (workspace) => workspace.id !== "settings",
);

const SIDEBAR_ICON_CLASS = "h-5 w-5 shrink-0";
const SIDEBAR_ICON_STROKE = 1.75;

const SIDEBAR_ROW_BASE =
  "relative flex h-10 min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-150 ease-out";

const SIDEBAR_ROW_HOVER = "hover:bg-muted/20";

const SIDEBAR_ROW_ACTIVE =
  "bg-primary/8 text-primary before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-primary";

export function SidebarNavigation({
  permissions,
  attentionBadges = EMPTY_NAV_ATTENTION_BADGES,
  onNavigate,
  showBrand = true,
  brandVariant = "full",
}: SidebarNavigationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const permissionSet = new Set(permissions);
  const visibleWorkspaces = filterWorkspaceNav(PRIMARY_WORKSPACES, permissionSet);
  const settingsWorkspace = WORKSPACE_NAV.find((item) => item.id === "settings");
  const activeWorkspaceId = getWorkspaceForPath(pathname);
  const { t } = useTranslation();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {showBrand ? (
        <div className="flex shrink-0 items-center px-5 py-5">
          <Link
            href="/today"
            onClick={onNavigate}
            className="inline-flex min-w-0 max-w-full items-center"
          >
            <BrandLogo variant={brandVariant} size="md" />
          </Link>
        </div>
      ) : null}

      <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-3">
        <p className="mb-3 px-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {t("common.workspaces")}
        </p>

        <div className="space-y-6">
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
              t={t}
            />
          ))}
        </div>
      </nav>

      {settingsWorkspace && permissionSet.has(settingsWorkspace.permission) ? (
        <div className="shrink-0 border-t border-border/20 px-3 py-3">
          <SidebarLink
            workspace={settingsWorkspace}
            isActive={activeWorkspaceId === "settings"}
            onNavigate={onNavigate}
            t={t}
          />
        </div>
      ) : null}
    </div>
  );
}

import type { TranslateFn } from "@/lib/i18n/dictionary";

function WorkspaceNavSection({
  workspace,
  pathname,
  searchParams,
  isActive,
  badgeCount,
  onNavigate,
  t,
}: {
  workspace: WorkspaceNavItem;
  pathname: string;
  searchParams: ReturnType<typeof useSearchParams>;
  isActive: boolean;
  badgeCount: number;
  onNavigate?: () => void;
  t: TranslateFn;
}) {
  const hasChildren = workspace.items.length > 0;
  const expanded = isActive && hasChildren;

  return (
    <div className="space-y-1">
      <SidebarLink
        workspace={workspace}
        isActive={isActive}
        badgeCount={badgeCount}
        onNavigate={onNavigate}
        t={t}
      />

      {expanded ? (
        <ul className="ml-4 space-y-0.5 border-l border-border/20 pl-3">
          {workspace.items.map((item) => {
            if (item.comingSoon) {
              return (
                <li key={item.title}>
                  <span
                    className="flex h-10 min-h-10 items-center justify-between gap-2 rounded-xl px-3 text-sm text-muted-foreground/70"
                    title={t("common.comingSoon")}
                  >
                    <span>{translateNavChildTitle(t, item.href, item.title)}</span>
                    <span className="shrink-0 rounded-full bg-muted/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {t("common.soon")}
                    </span>
                  </span>
                </li>
              );
            }

            if (!item.href) {
              return null;
            }

            const childActive = isChildNavActive(pathname, searchParams, item.href);

            return (
              <li key={`${item.title}-${item.href}`}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    SIDEBAR_ROW_BASE,
                    SIDEBAR_ROW_HOVER,
                    childActive
                      ? SIDEBAR_ROW_ACTIVE
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {translateNavChildTitle(t, item.href, item.title)}
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
  t,
}: {
  workspace: WorkspaceNavItem;
  isActive: boolean;
  badgeCount?: number;
  onNavigate?: () => void;
  t: TranslateFn;
}) {
  const Icon = workspace.icon;
  const title = translateWorkspaceTitle(t, workspace.id, workspace.title);

  return (
    <Link
      href={workspace.href}
      title={workspace.businessQuestion}
      onClick={onNavigate}
      className={cn(
        SIDEBAR_ROW_BASE,
        SIDEBAR_ROW_HOVER,
        isActive
          ? SIDEBAR_ROW_ACTIVE
          : "text-foreground/75 hover:text-foreground",
      )}
    >
      <Icon
        className={cn(
          SIDEBAR_ICON_CLASS,
          isActive ? "text-primary" : "text-muted-foreground",
        )}
        strokeWidth={SIDEBAR_ICON_STROKE}
      />
      <span className="min-w-0 flex-1 truncate">{title}</span>
      {badgeCount > 0 ? (
        <AttentionBadge count={badgeCount} active={isActive} />
      ) : null}
    </Link>
  );
}

function AttentionBadge({
  count,
  active = false,
}: {
  count: number;
  active?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums",
        active
          ? "bg-primary/12 text-primary"
          : "bg-muted/45 text-muted-foreground",
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
