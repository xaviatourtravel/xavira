"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

import { useMarketingContent } from "@/components/marketing/marketing-locale-provider";
import { buttonVariants } from "@/components/ui/button";
import { marketingRoutes } from "@/lib/marketing/routes";
import { cn } from "@/lib/utils";

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
  const { content, locale, setLocale } = useMarketingContent();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navItems = [
    { label: content.nav.platform, href: marketingRoutes.platform },
    { label: content.nav.solutions, href: marketingRoutes.solutions },
    { label: content.nav.resources, href: "#resources" },
    { label: content.nav.pricing, href: "#pricing" },
    { label: content.nav.company, href: marketingRoutes.company },
  ] as const;

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
            {content.brand.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-6 xl:gap-7 lg:flex" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            />
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <div className="flex items-center rounded-md ring-1 ring-slate-200">
            <button
              type="button"
              onClick={() => setLocale("id")}
              className={cn(
                "rounded-l-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                locale === "id"
                  ? "bg-slate-950 text-white"
                  : "text-slate-500 hover:text-slate-800",
              )}
              aria-label="Bahasa Indonesia"
            >
              ID
            </button>
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={cn(
                "rounded-r-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                locale === "en"
                  ? "bg-slate-950 text-white"
                  : "text-slate-500 hover:text-slate-800",
              )}
              aria-label="English"
            >
              EN
            </button>
          </div>
          <Link
            href={marketingRoutes.login}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            {content.nav.signIn}
          </Link>
          <Link
            href={marketingRoutes.demo}
            className={cn(
              buttonVariants({ size: "sm" }),
              "bg-emerald-700 hover:bg-emerald-800",
            )}
          >
            {content.nav.demo}
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md ring-1 ring-slate-200 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav-panel"
          aria-label={open ? "Tutup menu" : "Buka menu"}
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
          <div className="mb-4 flex items-center gap-2">
            <div className="flex items-center rounded-md ring-1 ring-slate-200">
              <button
                type="button"
                onClick={() => setLocale("id")}
                className={cn(
                  "rounded-l-md px-2.5 py-1.5 text-xs font-medium",
                  locale === "id" ? "bg-slate-950 text-white" : "text-slate-500",
                )}
              >
                ID
              </button>
              <button
                type="button"
                onClick={() => setLocale("en")}
                className={cn(
                  "rounded-r-md px-2.5 py-1.5 text-xs font-medium",
                  locale === "en" ? "bg-slate-950 text-white" : "text-slate-500",
                )}
              >
                EN
              </button>
            </div>
          </div>
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {navItems.map((item) => (
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
              {content.nav.signIn}
            </Link>
            <Link
              href={marketingRoutes.demo}
              className={cn(
                buttonVariants(),
                "w-full bg-emerald-700 hover:bg-emerald-800",
              )}
              onClick={() => setOpen(false)}
            >
              {content.nav.demo}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
