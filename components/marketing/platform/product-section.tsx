import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { marketingButtonVariants } from "@/components/marketing/design-system/button";
import { marketingTypography } from "@/components/marketing/design-system/tokens/typography";
import { PlatformCapabilityPreview } from "@/components/marketing/platform/platform-dashboard-mockup";
import { cn } from "@/lib/utils";

export type ProductSectionProps = {
  id: string;
  eyebrow: string;
  headline: string;
  description: string;
  benefits: string[];
  learnMoreHref: string;
  reverse?: boolean;
};

export function ProductSection({
  id,
  eyebrow,
  headline,
  description,
  benefits,
  learnMoreHref,
  reverse = false,
}: ProductSectionProps) {
  return (
    <section id={id} className="scroll-mt-24 py-16 sm:py-20">
      <div
        className={cn(
          "grid items-center gap-10 lg:grid-cols-2 lg:gap-16",
          reverse && "lg:[&>*:first-child]:order-2",
        )}
      >
        <div className="min-w-0">
          <p className={marketingTypography.eyebrow}>{eyebrow}</p>
          <h2 className={cn(marketingTypography.h2, "mt-3")}>{headline}</h2>
          <p className={cn(marketingTypography.bodyLarge, "mt-4")}>{description}</p>
          <ul className="mt-6 space-y-3">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3 text-sm text-slate-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--marketing-primary-muted)] text-[var(--marketing-primary)]">
                  <Check className="h-3 w-3" />
                </span>
                {benefit}
              </li>
            ))}
          </ul>
          <Link
            href={learnMoreHref}
            className={cn(marketingButtonVariants({ variant: "outline" }), "mt-8")}
          >
            Learn More
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <PlatformCapabilityPreview id={id} />
      </div>
    </section>
  );
}
