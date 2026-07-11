"use client";

import { AnimatePresence, m } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { createPortal } from "react-dom";

import { BrandLogo } from "@/components/brand/brand-logo";
import { marketingButtonVariants } from "@/components/marketing/design-system/button";
import { marketingColorClasses } from "@/components/marketing/design-system/tokens/colors";
import { marketingContainerClass } from "@/components/marketing/design-system/tokens/spacing";
import { useMarketingContent } from "@/components/marketing/marketing-locale-provider";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";
import { marketingHomeAnchors, marketingRoutes } from "@/lib/marketing/routes";
import {
  mobileMenuVariants,
  mobileOverlayVariants,
  motionTransition,
} from "@/components/marketing/motion";
import { marketingMotionDurations } from "@/components/marketing/motion/motion-tokens";
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
  return (
    <Link href={href} className={className} onClick={onClick}>
      {label}
    </Link>
  );
}

const navLinkClass =
  "text-sm font-medium text-[var(--marketing-muted)] transition-colors hover:text-[var(--marketing-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--marketing-brand-500)] focus-visible:ring-offset-2";

export function MarketingNavbar() {
  const { content, locale, setLocale } = useMarketingContent();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useBodyScrollLock(open);

  const navItems = [
    { label: content.nav.platform, href: marketingRoutes.platform },
    { label: content.nav.solutions, href: marketingRoutes.solutions },
    { label: content.nav.industries, href: marketingHomeAnchors.industries },
    { label: content.nav.pricing, href: marketingHomeAnchors.pricing },
    { label: content.nav.resources, href: marketingRoutes.contact },
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
    typeof document !== "undefined" ? (
      <AnimatePresence>
        {open ? (
          <>
            <m.button
              type="button"
              key="overlay"
              aria-label={locale === "en" ? "Close menu" : "Tutup menu"}
              className="fixed inset-0 z-[80] bg-black/40 lg:hidden"
              onClick={() => setOpen(false)}
              variants={mobileOverlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={motionTransition(marketingMotionDurations.fast)}
            />
            <m.div
              key="panel"
              id="mobile-nav-panel"
              className="fixed inset-x-0 bottom-0 z-[81] max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-[var(--marketing-border-default)] bg-[var(--marketing-elevated-surface)] px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[var(--marketing-shadow-soft)] lg:hidden"
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={motionTransition(marketingMotionDurations.normal)}
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-[var(--marketing-foreground)]">Menu</p>
                <button
                  type="button"
                  aria-label={locale === "en" ? "Close menu" : "Tutup menu"}
                  onClick={() => setOpen(false)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-[var(--marketing-surface-muted)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4 flex items-center gap-2">
                <div className="flex items-center rounded-md ring-1 ring-[var(--marketing-border-default)] bg-[var(--marketing-elevated-surface)]">
                  <button
                    type="button"
                    onClick={() => setLocale("id")}
                    className={cn(
                      "marketing-locale-btn min-h-[44px] rounded-l-md px-3 py-2 text-xs font-medium",
                      locale === "id"
                        ? "bg-[var(--marketing-foreground)] text-[var(--marketing-background)]"
                        : "text-[var(--marketing-muted)]",
                    )}
                  >
                    ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocale("en")}
                    className={cn(
                      "marketing-locale-btn min-h-[44px] rounded-r-md px-3 py-2 text-xs font-medium",
                      locale === "en"
                        ? "bg-[var(--marketing-foreground)] text-[var(--marketing-background)]"
                        : "text-[var(--marketing-muted)]",
                    )}
                  >
                    EN
                  </button>
                </div>
              </div>

              <nav className="flex flex-col gap-1" aria-label="Mobile">
                {navItems.map((item) => (
                  <NavLink
                    key={item.href + item.label}
                    href={item.href}
                    label={item.label}
                    className={cn(
                      "flex min-h-[44px] items-center rounded-lg px-3 py-2.5",
                      navLinkClass,
                    )}
                    onClick={() => setOpen(false)}
                  />
                ))}
              </nav>

              <div className="mt-4 grid gap-2 border-t border-[var(--marketing-border-subtle)] pt-4">
                <Link
                  href={marketingRoutes.login}
                  className={cn(marketingButtonVariants({ variant: "outline" }), "h-11 w-full")}
                  onClick={() => setOpen(false)}
                >
                  {content.nav.signIn}
                </Link>
                <Link
                  href={marketingRoutes.demo}
                  className={cn(marketingButtonVariants({ variant: "outline" }), "h-11 w-full")}
                  onClick={() => setOpen(false)}
                >
                  {content.nav.seeDemo}
                </Link>
                <Link
                  href={marketingRoutes.register}
                  className={cn(marketingButtonVariants(), "h-11 w-full")}
                  onClick={() => setOpen(false)}
                >
                  {content.nav.startFree}
                </Link>
              </div>
            </m.div>
          </>
        ) : null}
      </AnimatePresence>
    ) : null;

  const mobilePortal =
    mobilePanel && typeof document !== "undefined"
      ? createPortal(mobilePanel, document.body)
      : null;

  return (
    <>
      <header
        className="marketing-navbar-shell sticky top-0 z-50 transition-shadow duration-300"
        data-scrolled={scrolled ? "true" : "false"}
      >
        <div
          className={cn(
            marketingContainerClass,
            "flex h-14 min-w-0 items-center justify-between gap-3 sm:h-16",
          )}
        >
          <Link
            href={marketingRoutes.home}
            className={cn("flex min-w-0 items-center", marketingColorClasses.focusRing)}
          >
            <BrandLogo variant="icon" size="md" className="sm:hidden" />
            <BrandLogo variant="full" size="lg" className="hidden sm:inline-flex" />
          </Link>

          <nav className="hidden items-center gap-5 lg:flex xl:gap-6" aria-label="Primary">
            {navItems.map((item) => (
              <NavLink
                key={item.href + item.label}
                href={item.href}
                label={item.label}
                className={navLinkClass}
              />
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <div className="flex items-center rounded-md bg-[var(--marketing-elevated-surface)] ring-1 ring-[var(--marketing-border-default)]">
              <button
                type="button"
                onClick={() => setLocale("id")}
                className={cn(
                  "marketing-locale-btn rounded-l-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  locale === "id"
                    ? "bg-[var(--marketing-foreground)] text-[var(--marketing-background)]"
                    : "text-[var(--marketing-muted)] hover:text-[var(--marketing-foreground)]",
                )}
                aria-label="Bahasa Indonesia"
              >
                ID
              </button>
              <button
                type="button"
                onClick={() => setLocale("en")}
                className={cn(
                  "marketing-locale-btn rounded-r-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  locale === "en"
                    ? "bg-[var(--marketing-foreground)] text-[var(--marketing-background)]"
                    : "text-[var(--marketing-muted)] hover:text-[var(--marketing-foreground)]",
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
              href={marketingRoutes.register}
              className={cn(marketingButtonVariants({ size: "sm" }))}
            >
              {content.nav.startFree}
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[var(--marketing-elevated-surface)] ring-1 ring-[var(--marketing-border-default)] lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav-panel"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {mobilePortal}
    </>
  );
}
