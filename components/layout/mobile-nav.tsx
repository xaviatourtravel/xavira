"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

import {
  MOBILE_PRIMARY_HREFS,
  MOBILE_PRIMARY_NAV,
} from "@/config/mobile-navigation";
import {
  dashboardNav,
  filterDashboardNav,
  isNavGroup,
  isNavItemActive,
} from "@/config/navigation";
import type { Permission } from "@/lib/auth/permission-matrix";
import { cn } from "@/lib/utils";

type MobileNavProps = {
  permissions: Permission[];
};

export function MobileNav({ permissions }: MobileNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const permissionSet = new Set(permissions);

  const primaryNav = filterDashboardNav(MOBILE_PRIMARY_NAV, permissionSet);
  const moreNav = filterDashboardNav(dashboardNav, permissionSet).flatMap(
    (item) => {
      if (MOBILE_PRIMARY_HREFS.has(item.href)) {
        return [];
      }

      if (isNavGroup(item)) {
        return [
          { title: item.title, href: item.href, icon: item.icon },
          ...item.items.map((subItem) => ({
            title: subItem.title,
            href: subItem.href,
            icon: item.icon,
          })),
        ];
      }

      return [{ title: item.title, href: item.href, icon: item.icon }];
    },
  );

  const moreActive = moreNav.some((item) => isNavItemActive(pathname, item.href));

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
          "fixed inset-x-0 bottom-16 z-50 max-h-[70vh] overflow-y-auto rounded-t-2xl border bg-background shadow-2xl transition-transform duration-200 md:hidden",
          moreOpen ? "translate-y-0" : "pointer-events-none translate-y-full",
        )}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">More</p>
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
            const isActive = isNavItemActive(pathname, item.href);

            return (
              <Link
                key={`${item.title}-${item.href}`}
                href={item.href}
                className={cn(
                  "flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
                  isActive
                    ? "bg-primary/10 font-medium text-primary"
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

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background md:hidden">
        <div
          className="grid gap-1 p-1"
          style={{
            gridTemplateColumns: `repeat(${primaryNav.length + 1}, minmax(0, 1fr))`,
          }}
        >
          {primaryNav.map((item) => {
            const isActive = isNavItemActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-medium",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{item.title}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            className={cn(
              "flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-medium",
              moreOpen || moreActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Menu className="h-5 w-5" />
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
