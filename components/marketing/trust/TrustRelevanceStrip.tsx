"use client";

import { MotionReveal, MotionStagger, MotionStaggerItem } from "@/components/marketing/motion";
import { marketingColorClasses } from "@/components/marketing/design-system/tokens/colors";
import { marketingContainerClass } from "@/components/marketing/design-system/tokens/spacing";
import { useMarketingContent } from "@/components/marketing/marketing-locale-provider";
import { cn } from "@/lib/utils";

export function TrustRelevanceStrip() {
  const { content } = useMarketingContent();

  return (
    <section aria-label="Industry relevance" className={marketingColorClasses.trustStrip}>
      <div className={marketingContainerClass}>
        <MotionReveal delay={0} duration={360} viewport="small">
          <p className="text-center text-sm font-medium text-[var(--marketing-muted)] sm:text-base">
            {content.trust.statement}
          </p>
        </MotionReveal>
        <MotionStagger className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3" stagger="compact" viewport="small">
          {content.trust.industries.map((industry) => (
            <MotionStaggerItem key={industry}>
              <span
                className={cn(
                  "marketing-industry-label inline-flex px-4 py-2 text-xs font-medium sm:text-sm",
                )}
              >
                {industry}
              </span>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </div>
    </section>
  );
}
