import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { MarketingHeroMockup } from "@/components/marketing/marketing-hero-mockup";
import { marketingContent } from "@/lib/marketing/content";
import { marketingRoutes } from "@/lib/marketing/routes";
import { cn } from "@/lib/utils";

export function MarketingHeroSection() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.07),transparent_42%),linear-gradient(to_bottom,#ffffff,#f8fafc)] pb-16 pt-14 sm:pb-24 sm:pt-16 lg:pb-28 lg:pt-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:gap-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8">
        <div className="min-w-0 max-w-2xl">
          <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200/70">
            {marketingContent.hero.badge}
          </div>

          <h1 className="mt-5 text-[2rem] font-semibold leading-[1.12] tracking-tight text-balance text-slate-950 sm:mt-6 sm:text-5xl lg:text-[3.2rem]">
            {marketingContent.hero.headline}
          </h1>

          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:mt-5 sm:text-lg">
            {marketingContent.hero.subheadline}
          </p>

          <div className="mt-7 flex w-full flex-col gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:items-center">
            <Link
              href={marketingRoutes.demo}
              className={cn(
                buttonVariants({ size: "lg" }),
                "w-full bg-emerald-700 hover:bg-emerald-800 sm:w-auto",
              )}
            >
              {marketingContent.hero.primaryCta}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href={marketingRoutes.platform}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full sm:w-auto",
              )}
            >
              {marketingContent.hero.secondaryCta}
            </Link>
          </div>
        </div>

        <MarketingHeroMockup />
      </div>
    </section>
  );
}
