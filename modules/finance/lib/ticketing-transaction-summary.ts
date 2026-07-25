/**
 * Concise ticketing transaction summary for billing PDFs.
 *
 * Customer-friendly rules:
 * - Main route shows journey endpoints only (origin–destination per journey).
 *   Transit airports are never main-route endpoints; they render as "via …".
 * - Departure date derives from the earliest outbound flight segment, falling
 *   back to the ticket-group departure date. The invoice issue date is never
 *   used as a flight date.
 * - Never includes raw GDS or every flight segment.
 */

import {
  resolveAirlineName,
  resolveAirportDisplay,
} from "@/modules/finance/lib/airport-airline-directory";
import { formatPdfDate } from "@/modules/finance/pdf/invoice-pdf-theme";
import type {
  InvoiceFlightSegmentRecord,
  InvoiceTicketGroupRecord,
} from "@/modules/finance/types/ticketing";

export type TicketingTransactionSummary = {
  airlineLabel: string;
  /** Main route with friendly city names, endpoints only. */
  routeSummary: string;
  /** Same endpoints as airport codes for secondary display. */
  routeCodes: string;
  /** "via Addis Ababa" when transit stops exist; null otherwise. */
  viaLabel: string | null;
  passengerCount: number;
  departureDateLabel: string | null;
  pnrCode: string;
  lines: string[];
};

const GDS_MONTH_ID: Record<string, { label: string; index: number }> = {
  JAN: { label: "Jan", index: 0 },
  FEB: { label: "Feb", index: 1 },
  MAR: { label: "Mar", index: 2 },
  APR: { label: "Apr", index: 3 },
  MAY: { label: "Mei", index: 4 },
  JUN: { label: "Jun", index: 5 },
  JUL: { label: "Jul", index: 6 },
  AUG: { label: "Agu", index: 7 },
  SEP: { label: "Sep", index: 8 },
  OCT: { label: "Okt", index: 9 },
  NOV: { label: "Nov", index: 10 },
  DEC: { label: "Des", index: 11 },
};

function parseGdsDayMonth(
  value: string,
): { day: number; monthIndex: number; label: string } | null {
  const match = value.trim().toUpperCase().match(/^(\d{2})([A-Z]{3})$/);
  if (!match) return null;
  const month = GDS_MONTH_ID[match[2]!];
  if (!month) return null;
  return {
    day: Number(match[1]),
    monthIndex: month.index,
    label: `${Number(match[1])} ${month.label}`,
  };
}

/**
 * Departure date label from the earliest outbound segment, with the
 * ticket-group departure date as fallback (and as the year source when the
 * segment carries a year-less GDS token that matches it).
 */
export function deriveDepartureDateLabel(
  group: InvoiceTicketGroupRecord,
): string | null {
  const ordered = sortSegments(group.segments);
  const outbound = ordered.filter((segment) => segment.direction === "outbound");
  const firstWithDate = (outbound.length > 0 ? outbound : ordered).find(
    (segment) => Boolean(segment.departureLocalDate?.trim()),
  );
  const segmentDate = firstWithDate?.departureLocalDate?.trim() ?? null;
  const groupDate = group.departureDate?.trim() || null;

  if (segmentDate) {
    // ISO segment date renders fully.
    if (/^\d{4}-\d{2}-\d{2}$/.test(segmentDate)) {
      return formatPdfDate(segmentDate);
    }
    const gds = parseGdsDayMonth(segmentDate);
    if (gds) {
      // Enrich the year-less GDS token with the group date when they agree.
      if (groupDate && /^\d{4}-\d{2}-\d{2}$/.test(groupDate)) {
        const day = Number(groupDate.slice(8, 10));
        const monthIndex = Number(groupDate.slice(5, 7)) - 1;
        if (day === gds.day && monthIndex === gds.monthIndex) {
          return formatPdfDate(groupDate);
        }
      }
      // Segment is authoritative; never invent a year.
      return gds.label;
    }
  }

  if (groupDate && /^\d{4}-\d{2}-\d{2}$/.test(groupDate)) {
    return formatPdfDate(groupDate);
  }

  return null;
}

function sortSegments(
  segments: InvoiceFlightSegmentRecord[],
): InvoiceFlightSegmentRecord[] {
  return segments.slice().sort((a, b) => a.segmentOrder - b.segmentOrder);
}

function cityOf(code: string): string {
  return resolveAirportDisplay(code).primary;
}

type Journey = {
  originCode: string;
  destinationCode: string;
  transitCodes: string[];
};

function toJourney(segments: InvoiceFlightSegmentRecord[]): Journey {
  return {
    originCode: segments[0]!.departureAirport,
    destinationCode: segments[segments.length - 1]!.arrivalAirport,
    transitCodes: segments.slice(0, -1).map((segment) => segment.arrivalAirport),
  };
}

function dedupeConsecutive(values: string[]): string[] {
  const result: string[] = [];
  for (const value of values) {
    if (result.length === 0 || result[result.length - 1] !== value) {
      result.push(value);
    }
  }
  return result;
}

type RouteResult = {
  routeSummary: string;
  routeCodes: string;
  viaLabel: string | null;
};

function buildCustomerRoute(group: InvoiceTicketGroupRecord): RouteResult {
  const ordered = sortSegments(group.segments);
  if (ordered.length === 0) {
    return { routeSummary: "", routeCodes: "", viaLabel: null };
  }

  const outbound = ordered.filter((segment) => segment.direction === "outbound");
  const inbound = ordered.filter((segment) => segment.direction === "return");

  const journeys: Journey[] = [];

  if (group.tripType === "multi_city") {
    // Concise ordered city list over all endpoints.
    const codesPath = dedupeConsecutive(
      ordered.flatMap((segment) => [
        segment.departureAirport,
        segment.arrivalAirport,
      ]),
    );
    return {
      routeSummary: dedupeConsecutive(codesPath.map(cityOf)).join("–"),
      routeCodes: codesPath.join("–"),
      viaLabel: null,
    };
  }

  if (group.tripType === "round_trip" && outbound.length > 0 && inbound.length > 0) {
    journeys.push(toJourney(outbound), toJourney(inbound));
  } else {
    journeys.push(toJourney(ordered));
  }

  const routeSummary = journeys
    .map(
      (journey) =>
        `${cityOf(journey.originCode)}–${cityOf(journey.destinationCode)}`,
    )
    .join(" · ");
  const routeCodes = journeys
    .map((journey) => `${journey.originCode}–${journey.destinationCode}`)
    .join(" · ");

  const endpointCodes = new Set(
    journeys.flatMap((journey) => [journey.originCode, journey.destinationCode]),
  );
  const viaCities: string[] = [];
  for (const journey of journeys) {
    for (const code of journey.transitCodes) {
      if (endpointCodes.has(code)) continue;
      const city = cityOf(code);
      if (!viaCities.includes(city)) {
        viaCities.push(city);
      }
    }
  }

  return {
    routeSummary,
    routeCodes,
    viaLabel: viaCities.length > 0 ? `via ${viaCities.join(", ")}` : null,
  };
}

export function buildTicketingTransactionSummary(
  group: InvoiceTicketGroupRecord,
): TicketingTransactionSummary {
  const airlineCode =
    group.primaryAirlineCode ?? group.segments[0]?.airlineCode ?? null;
  const airlineLabel = airlineCode ? resolveAirlineName(airlineCode) : "Maskapai";
  const route = buildCustomerRoute(group);
  const departureDateLabel = deriveDepartureDateLabel(group);

  const lines = [
    airlineLabel,
    route.routeSummary,
    route.viaLabel,
    [
      `${group.passengerCount} pax`,
      departureDateLabel ? `Keberangkatan ${departureDateLabel}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    `PNR ${group.pnrCode}`,
  ].filter((line): line is string => Boolean(line && line.trim().length > 0));

  return {
    airlineLabel,
    routeSummary: route.routeSummary,
    routeCodes: route.routeCodes,
    viaLabel: route.viaLabel,
    passengerCount: group.passengerCount,
    departureDateLabel,
    pnrCode: group.pnrCode,
    lines,
  };
}

/**
 * One-line spreadsheet item description for the billing PDF.
 * Never expands every flight segment.
 */
export function buildTicketingBillingItemDescription(
  group: InvoiceTicketGroupRecord,
): string {
  const summary = buildTicketingTransactionSummary(group);
  const routePart = summary.routeSummary
    ? `${summary.airlineLabel} (${summary.routeSummary})`
    : summary.airlineLabel;
  return [
    routePart,
    `${summary.passengerCount} pax`,
    summary.departureDateLabel
      ? `Keberangkatan ${summary.departureDateLabel}`
      : null,
    `PNR ${summary.pnrCode}`,
  ]
    .filter(Boolean)
    .join(", ");
}
