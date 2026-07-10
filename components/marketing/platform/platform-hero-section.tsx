import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { marketingButtonVariants } from "@/components/marketing/design-system/button";
import { marketingContainerClass } from "@/components/marketing/design-system/tokens/spacing";
import { marketingTypography } from "@/components/marketing/design-system/tokens/typography";
import { PlatformDashboardMockup } from "@/components/marketing/platform/platform-dashboard-mockup";
import { marketingRoutes } from "@/lib/marketing/routes";
import { cn } from "@/lib/utils";

export function PlatformHeroSection() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,rgba(45,115,213,0.08),transparent_40%),linear-gradient(to_bottom,var(--marketing-background),var(--marketing-surface))] pb-16 pt-14 sm:pb-24 sm:pt-16 lg:pb-28 lg:pt-20">
      <div
        className={cn(
          marketingContainerClass,
          "grid items-center gap-10 sm:gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16",
        )}
      >
        <div className="min-w-0 max-w-2xl">
          <p className={marketingTypography.eyebrow}>Platform</p>
          <h1 className={cn(marketingTypography.h1, "mt-5 sm:mt-6")}>
            Platform yang menghubungkan seluruh perjalanan customer.
          </h1>
          <p className={cn(marketingTypography.bodyLarge, "mt-4 sm:mt-5")}>
            Desklabs membantu bisnis mengelola komunikasi, customer, operasional,
            penjualan, pembayaran, pengetahuan, dan AI dalam satu workflow yang
            terintegrasi.
          </p>
          <div className="mt-7 flex w-full flex-col gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:items-center">
            <Link
              href={marketingRoutes.demo}
              className={cn(marketingButtonVariants({ size: "lg" }), "w-full sm:w-auto")}
            >
              Coba Demo
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href={marketingRoutes.contact}
              className={cn(
                marketingButtonVariants({ variant: "outline", size: "lg" }),
                "w-full sm:w-auto",
              )}
            >
              Hubungi Kami
            </Link>
          </div>
        </div>
        <PlatformDashboardMockup />
      </div>
    </section>
  );
}
