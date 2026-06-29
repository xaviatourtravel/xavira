"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Menu, X } from "lucide-react";

import {
  MOBILE_MORE_NAV,
  MOBILE_PRIMARY_HREFS,
  MOBILE_PRIMARY_NAV,
} from "@/config/mobile-navigation";
import {
  WORKSPACE_NAV,
  EMPTY_NAV_ATTENTION_BADGES,
  filterWorkspaceNav,
  isNavPathActive,
  type NavAttentionBadges,
} from "@/config/navigation";
import type { Permission } from "@/lib/auth/permission-matrix";
import { cn } from "@/lib/utils";

type MobileNavProps = {
  permissions: Permission[];
  attentionBadges?: NavAttentionBadges;
};

export function MobileNav({
  permissions,
  attentionBadges = EMPTY_NAV_ATTENTION_BADGES,
}: MobileNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const permissionSet = new Set(permissions);

  const primaryNav = MOBILE_PRIMARY_NAV.filter((item) =>
    permissionSet.has(item.permission),
  );

  const moreNav = dedupeMobileNavItems([
    ...filterWorkspaceNav(WORKSPACE_NAV, permissionSet).flatMap((workspace) => {
      if (MOBILE_PRIMARY_HREFS.has(workspace.href)) {
        return [];
      }

      return [
        { title: workspace.title, href: workspace.href, icon: workspace.icon },
        ...workspace.items.map((item) => ({
          title: item.title,
          href: item.href,
          icon: workspace.icon,
        })),
      ];
    }),
    ...MOBILE_MORE_NAV.filter((item) => permissionSet.has(item.permission)).map(
      (item) => ({
        title: item.title,
        href: item.href,
        icon: item.icon,
      }),
    ),
  ]);

  const moreActive = moreNav.some((item) => isNavPathActive(pathname, item.href));

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [moreOpen]);

  function badgeForHref(href: string) {
    if (href === "/inbox") {
      return attentionBadges.communication;
    }
    if (href === "/operations" || href === "/follow-ups" || href === "/today") {
      return attentionBadges.operational;
    }
    if (href === "/finance" || href === "/revenue") {
      return attentionBadges.finance;
    }
    return 0;
  }

  return (
    <>
      {moreOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      ) : null}

      <div
        className={cn(
          "fixed inset-x-0 bottom-16 z-50 max-h-[85dvh] overflow-y-auto rounded-t-2xl border bg-background pb-[env(safe-area-inset-bottom)] shadow-2xl transition-transform duration-200 md:hidden",
          moreOpen ? "translate-y-0" : "pointer-events-none translate-y-full",
        )}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Workspaces</p>
          <button
            type="button"
            aria-label="Close more menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-muted"
            onClick={() => setMoreOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="grid gap-1 p-3 pb-6">
          {moreNav.map((item) => {
            const Icon = item.icon;
            const isActive = isNavPathActive(pathname, item.href);

            return (
              <Link
                key={`${item.title}-${item.href}`}
                href={item.href}
                className={cn(
                  "flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
                  isActive
                    ? "bg-slate-950 font-medium text-white"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
        <div
          className="grid gap-1 p-1"
          style={{
            gridTemplateColumns: `repeat(${primaryNav.length + 1}, minmax(0, 1fr))`,
          }}
        >
          {primaryNav.map((item) => {
            const isActive = isNavPathActive(pathname, item.href);
            const Icon = item.icon;
            const badge = badgeForHref(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-medium",
                  isActive ? "text-slate-950" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{item.title}</span>
                {badge > 0 ? (
                  <span className="absolute right-2 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[9px] font-bold text-slate-950">
                    {badge > 9 ? "9+" : badge}
                  </span>
                ) : null}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            className={cn(
              "flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-medium",
              moreOpen || moreActive ? "text-slate-950" : "text-muted-foreground",
            )}
          >
            <Menu className="h-5 w-5" />
            <span>Lainnya</span>
          </button>
        </div>
      </nav>
    </>
  );
}

function dedupeMobileNavItems<
  T extends { title: string; href: string; icon: LucideIcon },
>(items: T[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.href)) {
      return false;
    }

    seen.add(item.href);
    return true;
  });
}
