"use client";

import { useMemo } from "react";

import { PassportCommercialSection } from "@/components/customer-passport/sections/commercial-section";
import { PassportIdentitySection } from "@/components/customer-passport/sections/identity-section";
import { PassportJourneySection } from "@/components/customer-passport/sections/journey-section";
import { PassportMemorySection } from "@/components/customer-passport/sections/memory-section";
import { PassportPreferencesSection } from "@/components/customer-passport/sections/preferences-section";
import { PassportRelationshipSection } from "@/components/customer-passport/sections/relationship-section";
import { PassportTimelineSection } from "@/components/customer-passport/sections/timeline-section";
import { PassportTravelSection } from "@/components/customer-passport/sections/travel-section";
import { PassportShell } from "@/components/customer-passport/primitives";
import type { CustomerPassport, CustomerPassportVariant } from "@/lib/customer-passport/types";
import { cn } from "@/lib/utils";

type CustomerPassportPanelProps = {
  passport: CustomerPassport;
  variant?: CustomerPassportVariant;
  className?: string;
  showOpenLink?: boolean;
};

export function CustomerPassportPanel({
  passport,
  variant = "full",
  className,
  showOpenLink = false,
}: CustomerPassportPanelProps) {
  const compact = variant === "compact";

  const sections = useMemo(() => {
    if (compact) {
      return (
        <>
          <PassportIdentitySection passport={passport} showOpenLink={showOpenLink} />
          <PassportRelationshipSection passport={passport} />
          <PassportJourneySection passport={passport} compact />
          <PassportTimelineSection passport={passport} limit={6} />
        </>
      );
    }

    return (
      <>
        <PassportIdentitySection passport={passport} showOpenLink={showOpenLink} />
        <PassportRelationshipSection passport={passport} />
        <PassportJourneySection passport={passport} />
        <PassportTravelSection passport={passport} />
        <PassportPreferencesSection passport={passport} />
        <PassportCommercialSection passport={passport} />
        <PassportMemorySection passport={passport} />
        <PassportTimelineSection passport={passport} />
      </>
    );
  }, [compact, passport, showOpenLink]);

  return (
    <PassportShell compact={compact} className={cn("min-h-0", className)}>
      <div className="min-h-0 overflow-y-auto">{sections}</div>
    </PassportShell>
  );
}
