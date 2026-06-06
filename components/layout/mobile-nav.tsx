"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { dashboardNav, isNavGroup, isNavItemActive } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background md:hidden">
      <div className="grid grid-cols-4 gap-1 p-2">
        {dashboardNav.slice(0, 4).map((item) => {
          const href = item.href;
          const isActive = isNavGroup(item)
            ? isNavItemActive(pathname, item.href)
            : isNavItemActive(pathname, href);
          const Icon = item.icon;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-md px-2 py-2 text-xs",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
