"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  dashboardNav,
  isKanbanNavActive,
  isLeadsNavPath,
  isListLeadsNavActive,
  isNavGroup,
  isNavItemActive,
} from "@/config/navigation";
import { cn } from "@/lib/utils";

function getSubItemActive(pathname: string, href: string) {
  if (href === "/leads") {
    return isListLeadsNavActive(pathname);
  }

  if (href === "/leads/kanban") {
    return isKanbanNavActive(pathname);
  }

  return isNavItemActive(pathname, href);
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-background md:block">
      <div className="flex h-14 items-center border-b px-6">
        <Link href="/dashboard" className="text-lg font-semibold">
          Xavira
        </Link>
      </div>
      <nav className="space-y-1 p-4">
        {dashboardNav.map((item) => {
          if (isNavGroup(item)) {
            const Icon = item.icon;
            const isGroupActive = isLeadsNavPath(pathname);

            return (
              <div key={item.href} className="space-y-1">
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    isGroupActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </div>

                <div className="ml-4 space-y-1 border-l pl-3">
                  {item.items.map((subItem) => {
                    const isSubActive = getSubItemActive(
                      pathname,
                      subItem.href,
                    );

                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={cn(
                          "block rounded-md px-3 py-2 text-sm transition-colors",
                          isSubActive
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        )}
                      >
                        {subItem.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }

          const isActive = isNavItemActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
