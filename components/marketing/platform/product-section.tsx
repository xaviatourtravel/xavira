import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { PlatformCapabilityPreview } from "@/components/marketing/platform/platform-dashboard-mockup";
import { buttonVariants } from "@/components/ui/button";
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
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-700">
            {eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {headline}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
            {description}
          </p>
          <ul className="mt-6 space-y-3">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3 text-sm text-slate-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <Check className="h-3 w-3" />
                </span>
                {benefit}
              </li>
            ))}
          </ul>
          <Link
            href={learnMoreHref}
            className={cn(buttonVariants({ variant: "outline" }), "mt-8")}
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
