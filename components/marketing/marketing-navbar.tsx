"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { createPortal } from "react-dom";

import { BrandLogo } from "@/components/brand/brand-logo";
import { useMarketingContent } from "@/components/marketing/marketing-locale-provider";
import { marketingButtonVariants } from "@/components/marketing/design-system/button";
import { marketingContainerClass } from "@/components/marketing/design-system/tokens/spacing";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";
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

  useBodyScrollLock(open);

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

  const mobilePanel =
    open && typeof document !== "undefined"
      ? createPortal(
          <>
            <button
              type="button"
              aria-label="Tutup menu"
              className="fixed inset-0 z-[80] bg-black/40 lg:hidden"
              onClick={() => setOpen(false)}
            />
            <div
              id="mobile-nav-panel"
              className="fixed inset-x-0 bottom-0 z-[81] max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-slate-200 bg-white px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl lg:hidden"
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-950">Menu</p>
                <button
                  type="button"
                  aria-label="Tutup menu"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4 flex items-center gap-2">
                <div className="flex items-center rounded-md ring-1 ring-slate-200">
                  <button
                    type="button"
                    onClick={() => setLocale("id")}
                    className={cn(
                      "min-h-[44px] rounded-l-md px-3 py-2 text-xs font-medium",
                      locale === "id" ? "bg-slate-950 text-white" : "text-slate-500",
                    )}
                  >
                    ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocale("en")}
                    className={cn(
                      "min-h-[44px] rounded-r-md px-3 py-2 text-xs font-medium",
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
                    className="flex min-h-[44px] items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--marketing-brand-500)]"
                    onClick={() => setOpen(false)}
                  />
                ))}
              </nav>

              <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4">
                <Link
                  href={marketingRoutes.login}
                  className={cn(marketingButtonVariants({ variant: "outline" }), "h-11 w-full")}
                  onClick={() => setOpen(false)}
                >
                  {content.nav.signIn}
                </Link>
                <Link
                  href={marketingRoutes.demo}
                  className={cn(marketingButtonVariants(), "h-11 w-full")}
                  onClick={() => setOpen(false)}
                >
                  {content.nav.demo}
                </Link>
              </div>
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-all duration-300",
          scrolled
            ? "border-slate-200/70 bg-white/90 shadow-sm backdrop-blur-md"
            : "border-transparent bg-white/75 backdrop-blur-sm",
        )}
      >
        <div className={cn("mx-auto flex h-14 min-w-0 items-center justify-between gap-3 sm:h-16", marketingContainerClass)}>
          <Link href={marketingRoutes.home} className="flex min-w-0 items-center">
            <BrandLogo variant="icon" size="md" className="sm:hidden" />
            <BrandLogo variant="full" size="lg" className="hidden sm:inline-flex" />
          </Link>

          <nav className="hidden items-center gap-6 xl:gap-7 lg:flex" aria-label="Primary">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--marketing-brand-500)] focus-visible:ring-offset-2"
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
              className={cn(marketingButtonVariants({ variant: "ghost", size: "sm" }))}
            >
              {content.nav.signIn}
            </Link>
            <Link
              href={marketingRoutes.demo}
              className={cn(marketingButtonVariants({ size: "sm" }))}
            >
              {content.nav.demo}
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md ring-1 ring-slate-200 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav-panel"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {mobilePanel}
    </>
  );
}
