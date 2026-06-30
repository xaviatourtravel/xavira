"use client";

import {
  PassportField,
  PassportPerforation,
  PassportSection,
} from "@/components/customer-passport/primitives";
import type { CustomerPassport } from "@/lib/customer-passport/types";

export function PassportPreferencesSection({
  passport,
}: {
  passport: CustomerPassport;
}) {
  const { preferences } = passport;

  return (
    <>
      <PassportSection number={5} title="Preferences">
        <div className="grid grid-cols-2 gap-3">
          <PassportField
            label="Halal Priority"
            value={preferences.halalPriority == null ? null : preferences.halalPriority ? "Yes" : "No"}
          />
          <PassportField label="Seat Preference" value={preferences.seatPreference} />
          <PassportField label="Hotel Preference" value={preferences.hotelPreference} />
          <PassportField label="Room Type" value={preferences.roomType} />
        </div>
        {preferences.specialRequests ? (
          <div className="mt-3 rounded-lg bg-muted/40 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Special Requests
            </p>
            <p className="mt-1 text-xs leading-relaxed text-foreground">
              {preferences.specialRequests}
            </p>
          </div>
        ) : null}
      </PassportSection>
      <PassportPerforation />
    </>
  );
}
