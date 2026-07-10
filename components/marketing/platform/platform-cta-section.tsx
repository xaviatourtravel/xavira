import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { marketingButtonVariants } from "@/components/marketing/design-system/button";
import { MarketingSection } from "@/components/marketing/marketing-section";
import { marketingRoutes } from "@/lib/marketing/routes";
import { cn } from "@/lib/utils";

export function PlatformCtaSection() {
  return (
    <MarketingSection tone="dark" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,115,213,0.16),transparent_42%)]"
      />

      <div className="relative marketing-prose mx-auto text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Ready to manage your customer journey in one platform?
        </h2>
        <p className="mt-4 text-base leading-relaxed text-slate-300">
          Jadwalkan demo untuk melihat workflow Desklabs, atau hubungi tim sales
          untuk kebutuhan enterprise.
        </p>
        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:justify-center">
          <Link
            href={marketingRoutes.demo}
            className={cn(
              marketingButtonVariants({ size: "lg", onDark: true }),
              "w-full sm:w-auto",
            )}
          >
            Coba Demo
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href={marketingRoutes.contact}
            className={cn(
              marketingButtonVariants({ variant: "outline", size: "lg", onDark: true }),
              "w-full sm:w-auto",
            )}
          >
            Contact Sales
          </Link>
        </div>
      </div>
    </MarketingSection>
  );
}
