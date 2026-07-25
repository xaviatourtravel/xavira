import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/dictionary";
import {
  resolveAirlineName,
  resolveAirportDisplay,
} from "@/modules/finance/lib/airport-airline-directory";
import { groupSegmentsByDirection } from "@/modules/finance/lib/ticketing-grouping";
import { buildRouteSummary } from "@/modules/finance/lib/ticketing-pricing";
import type {
  InvoiceFlightSegmentRecord,
  InvoiceTicketGroupRecord,
  TicketTripType,
} from "@/modules/finance/types/ticketing";

const TRIP_TYPE_KEY: Record<TicketTripType, string> = {
  one_way: "financeUi.tripOneWay",
  round_trip: "financeUi.tripRoundTrip",
  multi_city: "financeUi.tripMultiCity",
};

function SegmentRow({
  segment,
}: {
  segment: InvoiceFlightSegmentRecord;
}) {
  const from = resolveAirportDisplay(segment.departureAirport);
  const to = resolveAirportDisplay(segment.arrivalAirport);
  const airline = resolveAirlineName(segment.airlineCode);
  const depTime = segment.departureLocalTime ?? "";
  const arrTime = segment.arrivalLocalTime ?? "";
  return (
    <li className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 py-1 text-sm">
      <span className="font-medium">
        {from.code} → {to.code}
      </span>
      <span className="text-muted-foreground">
        {from.primary} → {to.primary}
      </span>
      <span className="text-xs text-muted-foreground">
        {airline} {segment.airlineCode}
        {segment.flightNumber}
        {segment.bookingClass ? ` · ${segment.bookingClass}` : ""}
        {depTime || arrTime ? ` · ${depTime}–${arrTime}` : ""}
        {segment.arrivalDayOffset > 0 ? ` (+${segment.arrivalDayOffset})` : ""}
      </span>
    </li>
  );
}

export function TicketingInvoiceDetail({
  groups,
}: {
  groups: InvoiceTicketGroupRecord[];
}) {
  const t = createTranslator(DEFAULT_LOCALE);
  if (groups.length === 0) return null;

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-4">
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
        {t("financeUi.sectionItinerary")}
      </h2>
      {groups.map((group) => {
        const grouped = groupSegmentsByDirection(group.segments);
        const routeSummary = buildRouteSummary(
          group.segments.flatMap((s) => [s.departureAirport, s.arrivalAirport]),
        );
        const buckets: Array<{ key: string; label: string; segments: InvoiceFlightSegmentRecord[] }> = [
          { key: "outbound", label: t("financeUi.directionOutbound"), segments: grouped.outbound },
          { key: "return", label: t("financeUi.directionReturn"), segments: grouped.return },
          { key: "other", label: t("financeUi.directionOther"), segments: grouped.other },
        ];
        return (
          <div key={group.id} className="space-y-3">
            <dl className="grid gap-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-muted-foreground">
                  {t("financeUi.pnr")}
                </dt>
                <dd className="font-medium">{group.pnrCode}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  {t("financeUi.passengerCount")}
                </dt>
                <dd className="font-medium">{group.passengerCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  {t("financeUi.tripType")}
                </dt>
                <dd className="font-medium">{t(TRIP_TYPE_KEY[group.tripType])}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  {t("financeUi.routeSummary")}
                </dt>
                <dd className="font-medium">{routeSummary || "—"}</dd>
              </div>
            </dl>
            {buckets
              .filter((bucket) => bucket.segments.length > 0)
              .map((bucket) => (
                <div key={bucket.key}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {bucket.label}
                  </p>
                  <ul className="mt-1 divide-y">
                    {bucket.segments.map((segment) => (
                      <SegmentRow key={segment.id} segment={segment} />
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        );
      })}
    </section>
  );
}
