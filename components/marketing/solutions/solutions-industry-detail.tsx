import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { marketingButtonVariants } from "@/components/marketing/design-system/button";
import { marketingTypography } from "@/components/marketing/design-system/tokens/typography";
import { SolutionsUiSnippet } from "@/components/marketing/solutions/solutions-ui-snippet";
import type { SolutionIndustryId } from "@/lib/marketing/solutions-content";
import { cn } from "@/lib/utils";

export type SolutionsIndustryDetailProps = {
  id: SolutionIndustryId;
  name: string;
  headline: string;
  description: string;
  workflows: string[];
  status: "available" | "coming_soon";
  exploreHref?: string;
  exploreLabel?: string;
  reverse?: boolean;
};

export function SolutionsIndustryDetail({
  id,
  name,
  headline,
  description,
  workflows,
  status,
  exploreHref,
  exploreLabel,
  reverse = false,
}: SolutionsIndustryDetailProps) {
  const isAvailable = status === "available" && exploreHref;

  return (
    <section id={id} className="scroll-mt-24 py-16 sm:py-20">
      <div
        className={cn(
          "grid items-center gap-10 lg:grid-cols-2 lg:gap-16",
          reverse && "lg:[&>*:first-child]:order-2",
        )}
      >
        <div className="min-w-0">
          <p className={marketingTypography.eyebrow}>{name}</p>
          <h2 className={cn(marketingTypography.h2, "mt-3")}>{headline}</h2>
          <p className={cn(marketingTypography.bodyLarge, "mt-4")}>{description}</p>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {workflows.map((workflow) => (
              <li
                key={workflow}
                className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200/60"
              >
                {workflow}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            {isAvailable ? (
              <Link
                href={exploreHref}
                className={cn(marketingButtonVariants({ size: "lg" }))}
              >
                {exploreLabel ?? "Explore Solution"}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className={cn(
                  marketingButtonVariants({ variant: "outline", size: "lg" }),
                  "cursor-not-allowed opacity-60",
                )}
              >
                {exploreLabel ?? "Coming Soon"}
              </button>
            )}
          </div>
        </div>
        <SolutionsUiSnippet industryId={id} />
      </div>
    </section>
  );
}
