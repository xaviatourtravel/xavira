/**
 * Deterministic GDS itinerary parser.
 *
 * Handles the common linear itinerary display, e.g.:
 *   1 ET 629U 02AUG S CGKADD GN17 2035 0600 03AUG
 *   2 ET 462U 03AUG M ADDJED GN17 1100 1330 /E
 *
 * Guarantees:
 * - Fully deterministic; no AI, no network.
 * - Never invents a missing year or time zone.
 * - Malformed lines never throw — they return structured warnings.
 * - Every parsed field remains user-editable; raw text is always preserved.
 * - Arrival day offset is only derived when an explicit arrival date is present.
 *
 * This is NOT an authority for transit duration: it does not compute elapsed
 * time across time zones.
 */

import {
  normalizeAirlineCode,
  normalizeAirportCode,
} from "@/modules/finance/lib/airport-airline-directory";

export type ParsedFlightSegment = {
  segmentOrder: number;
  airlineCode: string | null;
  flightNumber: string | null;
  bookingClass: string | null;
  departureAirport: string | null;
  arrivalAirport: string | null;
  /** Raw day/month token as seen, e.g. "02AUG". Year intentionally unknown. */
  departureLocalDate: string | null;
  /** "HH:MM" 24h, or null when unparseable. */
  departureLocalTime: string | null;
  arrivalLocalDate: string | null;
  arrivalLocalTime: string | null;
  /** Whole-day offset of arrival vs departure; only set from an explicit date. */
  arrivalDayOffset: number;
  status: string | null;
  rawSegment: string;
  /** Non-fatal issues detected on this line. */
  warnings: string[];
};

export type GdsParseResult = {
  segments: ParsedFlightSegment[];
  /** Document-level warnings (e.g. lines that could not be parsed at all). */
  warnings: string[];
};

const MONTHS: Record<string, number> = {
  JAN: 0,
  FEB: 31,
  MAR: 59,
  APR: 90,
  MAY: 120,
  JUN: 151,
  JUL: 181,
  AUG: 212,
  SEP: 243,
  OCT: 273,
  NOV: 304,
  DEC: 334,
};

const DATE_TOKEN = /^(\d{2})([A-Z]{3})$/;
const TIME_TOKEN = /^([0-2]\d)([0-5]\d)$/;
const FLIGHT_TOKEN = /^(\d{1,4})([A-Z])?$/;
const AIRLINE_TOKEN = /^[A-Z0-9]{2,3}$/;
const COMBINED_AIRLINE_FLIGHT = /^([A-Z]{2}[A-Z0-9]?)(\d{1,4})([A-Z])?$/;

function isDateToken(token: string): boolean {
  const match = token.match(DATE_TOKEN);
  return match != null && match[2]! in MONTHS;
}

/** Nominal day-of-year (non-leap) used only for whole-day offset math. */
function nominalDayOfYear(token: string): number | null {
  const match = token.match(DATE_TOKEN);
  if (!match) return null;
  const day = Number(match[1]);
  const monthBase = MONTHS[match[2]!];
  if (monthBase == null || day < 1 || day > 31) return null;
  return monthBase + day;
}

function formatTime(token: string): string | null {
  const match = token.match(TIME_TOKEN);
  if (!match) return null;
  const hh = Number(match[1]);
  const mm = Number(match[2]);
  if (hh > 23 || mm > 59) return null;
  return `${match[1]}:${match[2]}`;
}

/** Parse a single itinerary line into a structured segment (best-effort). */
export function parseGdsSegmentLine(
  line: string,
  fallbackOrder: number,
): ParsedFlightSegment | null {
  const rawSegment = line.trim();
  if (!rawSegment) return null;

  const warnings: string[] = [];
  const tokens = rawSegment.split(/\s+/);
  let i = 0;

  let segmentOrder = fallbackOrder;
  if (/^\d{1,2}$/.test(tokens[i] ?? "")) {
    segmentOrder = Number(tokens[i]);
    i += 1;
  }

  let airlineCode: string | null = null;
  let flightNumber: string | null = null;
  let bookingClass: string | null = null;

  const combined = tokens[i]?.match(COMBINED_AIRLINE_FLIGHT);
  if (combined) {
    airlineCode = normalizeAirlineCode(combined[1]!);
    flightNumber = combined[2]!;
    bookingClass = combined[3] ?? null;
    i += 1;
  } else if (tokens[i] && AIRLINE_TOKEN.test(tokens[i]!)) {
    airlineCode = normalizeAirlineCode(tokens[i]!);
    i += 1;
    const flight = tokens[i]?.match(FLIGHT_TOKEN);
    if (flight) {
      flightNumber = flight[1]!;
      bookingClass = flight[2] ?? null;
      i += 1;
    }
  }

  if (!airlineCode) warnings.push("Kode maskapai tidak dikenali");
  if (!flightNumber) warnings.push("Nomor penerbangan tidak dikenali");

  // Departure date (e.g. 02AUG)
  let departureLocalDate: string | null = null;
  if (tokens[i] && isDateToken(tokens[i]!)) {
    departureLocalDate = tokens[i]!.toUpperCase();
    i += 1;
  } else {
    warnings.push("Tanggal keberangkatan tidak dikenali");
  }

  // Optional single-letter day-of-week marker (S, M, T, W, F)
  if (tokens[i] && /^[A-Z]$/.test(tokens[i]!)) {
    i += 1;
  }

  // Route: either one 6-letter token (CGKADD) or two 3-letter tokens
  let departureAirport: string | null = null;
  let arrivalAirport: string | null = null;
  if (tokens[i] && /^[A-Z]{6}$/.test(tokens[i]!)) {
    departureAirport = normalizeAirportCode(tokens[i]!.slice(0, 3));
    arrivalAirport = normalizeAirportCode(tokens[i]!.slice(3, 6));
    i += 1;
  } else if (
    tokens[i] &&
    tokens[i + 1] &&
    /^[A-Z]{3}$/.test(tokens[i]!) &&
    /^[A-Z]{3}$/.test(tokens[i + 1]!)
  ) {
    departureAirport = normalizeAirportCode(tokens[i]!);
    arrivalAirport = normalizeAirportCode(tokens[i + 1]!);
    i += 2;
  } else {
    warnings.push("Rute bandara tidak dikenali");
  }

  // Optional status token (e.g. GN17, HK1) — alnum containing a digit
  if (tokens[i] && /^[A-Z]+\d+$/.test(tokens[i]!)) {
    // handled below as status
  }
  let status: string | null = null;
  if (tokens[i] && /[A-Z]/.test(tokens[i]!) && /\d/.test(tokens[i]!) && !TIME_TOKEN.test(tokens[i]!)) {
    status = tokens[i]!.toUpperCase();
    i += 1;
  }

  // Departure + arrival times
  let departureLocalTime: string | null = null;
  if (tokens[i] && TIME_TOKEN.test(tokens[i]!)) {
    departureLocalTime = formatTime(tokens[i]!);
    i += 1;
  }
  let arrivalLocalTime: string | null = null;
  if (tokens[i] && TIME_TOKEN.test(tokens[i]!)) {
    arrivalLocalTime = formatTime(tokens[i]!);
    i += 1;
  }

  // Optional trailing arrival date OR e-ticket / misc markers
  let arrivalLocalDate: string | null = null;
  if (tokens[i] && isDateToken(tokens[i]!)) {
    arrivalLocalDate = tokens[i]!.toUpperCase();
    i += 1;
  }

  let arrivalDayOffset = 0;
  if (arrivalLocalDate && departureLocalDate) {
    const dep = nominalDayOfYear(departureLocalDate);
    const arr = nominalDayOfYear(arrivalLocalDate);
    if (dep != null && arr != null) {
      let diff = arr - dep;
      if (diff < 0) diff += 365; // wrap year boundary deterministically
      arrivalDayOffset = diff;
    }
  }

  return {
    segmentOrder,
    airlineCode,
    flightNumber,
    bookingClass,
    departureAirport,
    arrivalAirport,
    departureLocalDate,
    departureLocalTime,
    arrivalLocalDate,
    arrivalLocalTime,
    arrivalDayOffset,
    status,
    rawSegment,
    warnings,
  };
}

/** Parse a full raw itinerary block into structured segments. */
export function parseGdsItinerary(raw: string): GdsParseResult {
  const warnings: string[] = [];
  const segments: ParsedFlightSegment[] = [];

  const lines = (raw ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { segments, warnings };
  }

  let order = 1;
  for (const line of lines) {
    let segment: ParsedFlightSegment | null = null;
    try {
      segment = parseGdsSegmentLine(line, order);
    } catch {
      // A malformed line must never crash the editor.
      warnings.push(`Baris tidak dapat diproses: "${line}"`);
      continue;
    }
    if (!segment) continue;
    // Reject lines with no usable structure at all.
    if (
      !segment.airlineCode &&
      !segment.flightNumber &&
      !segment.departureAirport &&
      !segment.arrivalAirport
    ) {
      warnings.push(`Baris tidak dikenali: "${line}"`);
      continue;
    }
    segments.push(segment);
    order = segment.segmentOrder + 1;
  }

  return { segments, warnings };
}
