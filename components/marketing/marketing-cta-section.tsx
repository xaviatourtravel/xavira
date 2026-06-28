"use client";

import { useMarketingContent } from '@/components/marketing/marketing-locale-provider';
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { MarketingSection } from "@/components/marketing/marketing-section";
import { buttonVariants } from "@/components/ui/button";
import { marketingRoutes } from "@/lib/marketing/routes";
import { cn } from "@/lib/utils";

export function MarketingCtaSection() {
  const { content } = useMarketingContent();

  return (
    <MarketingSection id="pricing" tone="dark" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_42%)]"
      />

      <div className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {content.cta.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
            {content.cta.copy}
          </p>
        </div>

        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:justify-center">
          <Link
            href={marketingRoutes.demo}
            className={cn(
              buttonVariants({ size: "lg" }),
              "w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400 sm:w-auto",
            )}
          >
            {content.cta.primary}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href={marketingRoutes.contact}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "w-full border-slate-700 bg-transparent text-white hover:bg-slate-900 hover:text-white sm:w-auto",
            )}
          >
            {content.cta.secondary}
          </Link>
        </div>
      </div>
    </MarketingSection>
  );
}
