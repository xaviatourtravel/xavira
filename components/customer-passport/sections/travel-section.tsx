"use client";

import {
  PassportChip,
  PassportEmptyHint,
  PassportPerforation,
  PassportSection,
} from "@/components/customer-passport/primitives";
import { TRAVEL_STYLE_LABELS } from "@/lib/customer-passport/constants";
import type { CustomerPassport } from "@/lib/customer-passport/types";

function formatDate(value: string | null) {
  if (!value) return "TBD";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export function PassportTravelSection({
  passport,
}: {
  passport: CustomerPassport;
}) {
  const { travel } = passport;

  return (
    <>
      <PassportSection number={4} title="Travel Passport">
        <div className="space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Travel Style
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {travel.travelStyles.map((style) => (
                <PassportChip key={style}>{TRAVEL_STYLE_LABELS[style]}</PassportChip>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Visited
            </p>
            {travel.visitedDestinations.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {travel.visitedDestinations.map((destination) => (
                  <PassportChip key={destination}>{destination}</PassportChip>
                ))}
              </div>
            ) : (
              <PassportEmptyHint>No trips completed yet.</PassportEmptyHint>
            )}
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Wishlist
            </p>
            {travel.wishlist.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {travel.wishlist.map((item) => (
                  <PassportChip key={item}>{item}</PassportChip>
                ))}
              </div>
            ) : (
              <PassportEmptyHint>Add package interest to build wishlist.</PassportEmptyHint>
            )}
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Upcoming Trips
            </p>
            {travel.upcomingTrips.length > 0 ? (
              <ul className="mt-1.5 space-y-2">
                {travel.upcomingTrips.map((trip) => (
                  <li
                    key={trip.id}
                    className="rounded-lg border border-soft bg-card/70 px-3 py-2 text-xs"
                  >
                    <p className="font-medium text-foreground">{trip.label}</p>
                    <p className="mt-0.5 text-muted-foreground">
                      {formatDate(trip.departureDate)} · {trip.status}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <PassportEmptyHint>No upcoming trips scheduled.</PassportEmptyHint>
            )}
          </div>
        </div>
      </PassportSection>
      <PassportPerforation />
    </>
  );
}
