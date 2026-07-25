/**
 * Pure form-state helpers for the ticketing invoice editor.
 *
 * The editor keeps ONE authoritative segment list (React state) that both the
 * UI rows and the submit payload derive from. These helpers are extracted so
 * parse → state → payload behavior is unit-testable without a DOM.
 */

import { parseGdsItinerary } from "@/modules/finance/lib/gds-parser";
import { suggestSegmentDirections } from "@/modules/finance/lib/ticketing-grouping";
import type {
  FlightDirection,
  TicketTripType,
} from "@/modules/finance/types/ticketing";

export type EditableTicketSegment = {
  direction: FlightDirection;
  airlineCode: string;
  flightNumber: string;
  bookingClass: string;
  departureAirport: string;
  arrivalAirport: string;
  departureLocalDate: string;
  departureLocalTime: string;
  arrivalLocalDate: string;
  arrivalLocalTime: string;
  arrivalDayOffset: number;
  status: string;
  rawSegment: string;
};

export type AirlineInputResult = {
  /** Normalized IATA carrier code, or null when empty/unresolvable. */
  code: string | null;
  /** False only when the user typed something that is not a carrier code. */
  valid: boolean;
};

/**
 * Normalize a user-typed primary airline value.
 * - trims, uppercases, strips accidental spaces
 * - "ET 629" / "ET629" / "ET 629U" → "ET" (unambiguous carrier + flight)
 * - full airline names are rejected — never silently invent a code
 * - empty input is valid (primary airline is optional)
 */
export function normalizePrimaryAirlineInput(
  raw: string | null | undefined,
): AirlineInputResult {
  const trimmed = (raw ?? "").trim().toUpperCase();
  if (!trimmed) return { code: null, valid: true };

  const compact = trimmed.replace(/\s+/g, "");

  // Standard 2-char IATA code (3 alphanumeric allowed by the data model).
  if (/^[A-Z0-9]{2,3}$/.test(compact) && /[A-Z]/.test(compact)) {
    return { code: compact, valid: true };
  }

  // Carrier + flight number: extract the carrier only when the shape is
  // unambiguous (2-char code with a letter, followed by 2–4 digits).
  const withFlight = compact.match(/^([A-Z][A-Z0-9]|[0-9][A-Z])(\d{2,4})([A-Z])?$/);
  if (withFlight) {
    return { code: withFlight[1]!, valid: true };
  }

  return { code: null, valid: false };
}

export type ParsedItineraryApplication = {
  segments: EditableTicketSegment[];
  /** Prefilled carrier code (existing valid value wins over derived). */
  primaryAirlineCode: string | null;
  /** Parser warnings for display; never blocks editing. */
  notes: string[];
};

/**
 * Parse raw GDS text into editable segments plus a primary-airline prefill.
 * The caller writes `segments` into the SAME state the submit payload reads.
 */
export function applyParsedItinerary(params: {
  rawItinerary: string;
  tripType: TicketTripType;
  currentPrimaryAirline?: string | null;
}): ParsedItineraryApplication {
  const result = parseGdsItinerary(params.rawItinerary);
  const directions = suggestSegmentDirections(
    result.segments.map((s) => ({
      departureAirport: s.departureAirport,
      arrivalAirport: s.arrivalAirport,
    })),
    params.tripType,
  );

  const segments: EditableTicketSegment[] = result.segments.map((s, index) => ({
    direction: directions[index] ?? "outbound",
    airlineCode: s.airlineCode ?? "",
    flightNumber: s.flightNumber ?? "",
    bookingClass: s.bookingClass ?? "",
    departureAirport: s.departureAirport ?? "",
    arrivalAirport: s.arrivalAirport ?? "",
    departureLocalDate: s.departureLocalDate ?? "",
    departureLocalTime: s.departureLocalTime ?? "",
    arrivalLocalDate: s.arrivalLocalDate ?? "",
    arrivalLocalTime: s.arrivalLocalTime ?? "",
    arrivalDayOffset: s.arrivalDayOffset,
    status: s.status ?? "",
    rawSegment: s.rawSegment,
  }));

  const existing = normalizePrimaryAirlineInput(params.currentPrimaryAirline);
  const derived =
    segments.find((seg) => normalizePrimaryAirlineInput(seg.airlineCode).code)
      ?.airlineCode ?? null;
  const primaryAirlineCode =
    (existing.valid && existing.code) ||
    (derived ? normalizePrimaryAirlineInput(derived).code : null);

  return {
    segments,
    primaryAirlineCode,
    notes: [
      ...result.warnings,
      ...result.segments.flatMap((s, i) =>
        s.warnings.map((w) => `#${i + 1}: ${w}`),
      ),
    ],
  };
}

/**
 * When raw itinerary is present but segments are empty, parse in the
 * background so the user is not forced to click "Parse itinerary" for PDF
 * raw-display save. Structured segments remain required for internal
 * persistence/issue validation.
 */
export function ensureSegmentsFromRawItinerary(params: {
  rawItinerary: string;
  tripType: TicketTripType;
  currentPrimaryAirline?: string | null;
  segments: EditableTicketSegment[];
}): ParsedItineraryApplication | null {
  if (params.segments.length > 0) return null;
  if (!params.rawItinerary.trim()) return null;
  return applyParsedItinerary({
    rawItinerary: params.rawItinerary,
    tripType: params.tripType,
    currentPrimaryAirline: params.currentPrimaryAirline,
  });
}
export function editableSegmentsToTicketPayload(
  segments: EditableTicketSegment[],
) {
  const cleanText = (value: string) => {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  };
  return segments.map((seg, index) => ({
    direction: seg.direction,
    segmentOrder: index,
    airlineCode: seg.airlineCode,
    flightNumber: seg.flightNumber,
    bookingClass: cleanText(seg.bookingClass),
    departureAirport: seg.departureAirport,
    arrivalAirport: seg.arrivalAirport,
    departureLocalDate: cleanText(seg.departureLocalDate),
    departureLocalTime: cleanText(seg.departureLocalTime),
    arrivalLocalDate: cleanText(seg.arrivalLocalDate),
    arrivalLocalTime: cleanText(seg.arrivalLocalTime),
    arrivalDayOffset: seg.arrivalDayOffset,
    status: cleanText(seg.status),
    rawSegment: cleanText(seg.rawSegment),
  }));
}

export type TicketingSaveGuardKey =
  | "parseFirst"
  | "addSegment"
  | "airlineInvalid"
  | "pnrRequired"
  | "paxMin";

/**
 * Pre-submit guard. Returns the first blocking problem as a message key, or
 * null when the form may submit. Segment checks come first — they carry the
 * "parse before save" UX.
 */
export function ticketingSaveGuard(params: {
  pnrCode: string;
  passengerCount: number;
  segmentCount: number;
  rawItinerary: string;
  primaryAirline: string;
}): TicketingSaveGuardKey | null {
  if (params.segmentCount === 0) {
    return params.rawItinerary.trim() ? "parseFirst" : "addSegment";
  }
  if (!normalizePrimaryAirlineInput(params.primaryAirline).valid) {
    return "airlineInvalid";
  }
  if (!params.pnrCode.trim()) {
    return "pnrRequired";
  }
  if (!Number.isInteger(params.passengerCount) || params.passengerCount < 1) {
    return "paxMin";
  }
  return null;
}
