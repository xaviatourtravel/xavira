"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { marketingContent } from "@/lib/marketing/content";
import { marketingRoutes } from "@/lib/marketing/routes";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: marketingContent.nav.platform, href: marketingRoutes.platform },
  { label: marketingContent.nav.solutions, href: marketingRoutes.solutions },
  { label: marketingContent.nav.resources, href: "#resources" },
  { label: marketingContent.nav.pricing, href: "#pricing" },
  { label: marketingContent.nav.company, href: marketingRoutes.company },
] as const;

function NavLink({
  href,
  label,
  className,
  onClick,
}: {
  href: string;
  label: string;
  className?: string;
  onClick?: () => void;
}) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className} onClick={onClick}>
        {label}
      </Link>
    );
  }

  return (
    <a href={href} className={className} onClick={onClick}>
      {label}
    </a>
  );
}

export function MarketingNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-all duration-300",
        scrolled
          ? "border-slate-200/70 bg-white/90 shadow-sm backdrop-blur-md"
          : "border-transparent bg-white/75 backdrop-blur-sm",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href={marketingRoutes.home} className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white"
          >
            D
          </span>
          <span className="truncate text-lg font-semibold tracking-tight text-slate-950">
            {marketingContent.brand.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-6 xl:gap-7 lg:flex" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            />
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <button
            type="button"
            disabled
            aria-label="Bahasa Indonesia (language switcher coming soon)"
            className="rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200"
            title="Language switcher coming soon"
          >
            ID
          </button>
          <Link
            href={marketingRoutes.login}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            {marketingContent.nav.signIn}
          </Link>
          <Link
            href={marketingRoutes.demo}
            className={cn(
              buttonVariants({ size: "sm" }),
              "bg-emerald-700 hover:bg-emerald-800",
            )}
          >
            {marketingContent.nav.demo}
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md ring-1 ring-slate-200 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav-panel"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div
          id="mobile-nav-panel"
          className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                onClick={() => setOpen(false)}
              />
            ))}
          </nav>
          <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4">
            <Link
              href={marketingRoutes.login}
              className={cn(buttonVariants({ variant: "outline" }), "w-full")}
              onClick={() => setOpen(false)}
            >
              {marketingContent.nav.signIn}
            </Link>
            <Link
              href={marketingRoutes.demo}
              className={cn(
                buttonVariants(),
                "w-full bg-emerald-700 hover:bg-emerald-800",
              )}
              onClick={() => setOpen(false)}
            >
              {marketingContent.nav.demo}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
