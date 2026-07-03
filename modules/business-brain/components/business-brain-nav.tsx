"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BUSINESS_BRAIN_NAV_ITEMS } from "@/modules/business-brain/types/company-dna";
import { cn } from "@/lib/utils";

const ACTIVE_ROUTES = new Set([
  "/business-brain",
  "/business-brain/company-dna",
  "/business-brain/products",
  "/business-brain/knowledge",
  "/business-brain/documents",
  "/business-brain/behaviors",
  "/business-brain/playground",
  "/business-brain/publish",
]);

function isActivePath(pathname: string, href: string) {
  if (href === "/business-brain") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BusinessBrainNav() {
  const pathname = usePathname() ?? "";

  if (!ACTIVE_ROUTES.has(pathname) && !pathname.startsWith("/business-brain/")) {
    return null;
  }

  return (
    <nav
      aria-label="Business Brain sections"
      className="-mx-1 overflow-x-auto pb-1"
    >
      <ul className="flex min-w-max items-center gap-1 px-1">
        {BUSINESS_BRAIN_NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className={cn(
                  "inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary ring-1 ring-primary/20 dark:bg-primary/20"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {item.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
