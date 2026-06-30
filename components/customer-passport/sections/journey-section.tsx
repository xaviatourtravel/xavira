"use client";

import {
  PASSPORT_JOURNEY_LABELS,
} from "@/lib/customer-passport/constants";
import {
  PassportChip,
  PassportPerforation,
  PassportSection,
} from "@/components/customer-passport/primitives";
import type { CustomerPassport } from "@/lib/customer-passport/types";
import { cn } from "@/lib/utils";

export function PassportJourneySection({
  passport,
  compact = false,
}: {
  passport: CustomerPassport;
  compact?: boolean;
}) {
  const { journey } = passport;
  const visibleStages = compact
    ? journey.stages.filter((item) => item.reached || item.current)
    : journey.stages;

  return (
    <>
      <PassportSection number={3} title="Journey">
        <div className="flex flex-wrap gap-1.5">
          {visibleStages.map((item) => (
            <PassportChip key={item.stage} active={item.current}>
              {PASSPORT_JOURNEY_LABELS[item.stage]}
            </PassportChip>
          ))}
        </div>
        {!compact ? (
          <div className="mt-4 grid grid-cols-9 gap-1">
            {journey.stages.map((item) => (
              <div key={item.stage} className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "h-2 w-full rounded-full",
                    item.reached
                      ? item.current
                        ? "bg-amber-500"
                        : "bg-foreground"
                      : "bg-border",
                  )}
                />
                <span className="text-[8px] font-medium uppercase tracking-wide text-muted-foreground">
                  {PASSPORT_JOURNEY_LABELS[item.stage].slice(0, 3)}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </PassportSection>
      <PassportPerforation />
    </>
  );
}
