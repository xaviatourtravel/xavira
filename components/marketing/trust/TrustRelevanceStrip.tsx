"use client";

import { marketingColorClasses } from "@/components/marketing/design-system/tokens/colors";
import { marketingContainerClass } from "@/components/marketing/design-system/tokens/spacing";
import { useMarketingContent } from "@/components/marketing/marketing-locale-provider";
import { cn } from "@/lib/utils";

export function TrustRelevanceStrip() {
  const { content } = useMarketingContent();

  return (
    <section aria-label="Industry relevance" className={marketingColorClasses.trustStrip}>
      <div className={marketingContainerClass}>
        <p className="text-center text-sm font-medium text-[var(--marketing-muted)] sm:text-base">
          {content.trust.statement}
        </p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
          {content.trust.industries.map((industry) => (
            <li key={industry}>
              <span
                className={cn(
                  "marketing-industry-label inline-flex px-4 py-2 text-xs font-medium sm:text-sm",
                )}
              >
                {industry}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
