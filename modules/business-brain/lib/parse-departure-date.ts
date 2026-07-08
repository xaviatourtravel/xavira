import type { Locale } from "@/lib/i18n/config";

const MONTH_NAMES: Record<string, number> = {
  jan: 1,
  january: 1,
  januari: 1,
  feb: 2,
  february: 2,
  februari: 2,
  mar: 3,
  march: 3,
  maret: 3,
  apr: 4,
  april: 4,
  may: 5,
  mei: 5,
  jun: 6,
  june: 6,
  juni: 6,
  jul: 7,
  july: 7,
  juli: 7,
  aug: 8,
  august: 8,
  agustus: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  okt: 10,
  october: 10,
  oktober: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
  desember: 12,
};

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function resolveMonth(name: string): number | null {
  return MONTH_NAMES[name.toLowerCase()] ?? null;
}

function toIsoDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function dedupeAndSort(dates: string[]): string[] {
  return [...new Set(dates)].sort();
}

function tryIsoOrDmy(input: string): string[] {
  const isoMatch = input.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const iso = toIsoDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
    return iso ? [iso] : [];
  }

  const dmyMatch = input.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const iso = toIsoDate(Number(dmyMatch[3]), Number(dmyMatch[2]), Number(dmyMatch[1]));
    return iso ? [iso] : [];
  }

  return [];
}

function tryCommaDayListWithSharedMonthYear(input: string): string[] {
  const match = input.match(/^([\d\s,]+)\s+([a-zA-Z]+)\s+(\d{4})$/);
  if (!match || !match[1].includes(",")) return [];

  const month = resolveMonth(match[2]);
  const year = Number(match[3]);
  if (!month) return [];

  const days = match[1]
    .split(/\s*,\s*/)
    .map((day) => Number(day.trim()))
    .filter((day) => Number.isFinite(day) && day >= 1 && day <= 31);

  if (days.length === 0) return [];

  const dates = days
    .map((day) => toIsoDate(year, month, day))
    .filter((date): date is string => date !== null);

  return dates.length === days.length ? dates : [];
}

function tryRangeDates(input: string): string[] {
  const normalized = input.replace(/\s+/g, " ");

  let match = normalized.match(/^(\d{1,2})\s*(?:-|–|—)\s*(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/i);
  if (!match) {
    match = normalized.match(
      /^(\d{1,2})\s+(?:sampai|s\/d)\s+(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/i,
    );
  }
  if (!match) return [];

  const start = Number(match[1]);
  const end = Number(match[2]);
  const month = resolveMonth(match[3]);
  const year = Number(match[4]);
  if (!month || start > end) return [];

  const dates: string[] = [];
  for (let day = start; day <= end; day += 1) {
    const iso = toIsoDate(year, month, day);
    if (!iso) return [];
    dates.push(iso);
  }

  return dates;
}

function parseDateSegment(text: string, fallbackYear?: number): string | null {
  const trimmed = text.trim().replace(/\s+/g, " ");

  const isoOrDmy = tryIsoOrDmy(trimmed);
  if (isoOrDmy.length === 1) return isoOrDmy[0] ?? null;

  const namedWithYear = trimmed.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/);
  if (namedWithYear) {
    const month = resolveMonth(namedWithYear[2]);
    if (month) {
      return toIsoDate(Number(namedWithYear[3]), month, Number(namedWithYear[1]));
    }
  }

  const namedNoYear = trimmed.match(/^(\d{1,2})\s+([a-zA-Z]+)$/);
  if (namedNoYear && fallbackYear) {
    const month = resolveMonth(namedNoYear[2]);
    if (month) {
      return toIsoDate(fallbackYear, month, Number(namedNoYear[1]));
    }
  }

  return null;
}

function tryMultiSegmentDates(input: string): string[] {
  if (!input.includes(",")) return [];

  const normalized = input.replace(/\s+/g, " ");

  if (/^[\d\s,]+\s+[a-zA-Z]+\s+\d{4}$/.test(normalized)) return [];
  if (/^\d{1,2}\s+[a-zA-Z]+,?\s+\d{4}$/.test(normalized)) return [];

  const segments = input.split(/,\s*(?=\d)/).map((segment) => segment.trim()).filter(Boolean);
  if (segments.length < 2) return [];
  if (!segments.every((segment) => /[a-zA-Z]/.test(segment))) return [];

  let fallbackYear: number | undefined;
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const yearMatch = segments[index]?.match(/\b(\d{4})\b/);
    if (yearMatch) {
      fallbackYear = Number(yearMatch[1]);
      break;
    }
  }

  const dates: string[] = [];
  for (const segment of segments) {
    const iso = parseDateSegment(segment, fallbackYear);
    if (!iso) return [];
    dates.push(iso);
  }

  return dates;
}

function trySingleNamedDate(input: string): string[] {
  const normalized = input.trim().replace(/\s+/g, " ");
  const namedMatch = normalized.match(/^(\d{1,2})\s+([a-zA-Z]+),?\s+(\d{4})$/);
  if (!namedMatch) return [];

  const month = resolveMonth(namedMatch[2]);
  if (!month) return [];

  const iso = toIsoDate(Number(namedMatch[3]), month, Number(namedMatch[1]));
  return iso ? [iso] : [];
}

/**
 * Parse one or more departure dates into ISO format (YYYY-MM-DD).
 */
export function parseDepartureDates(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];

  const trimmed = value.trim().replace(/\s+/g, " ");

  const parsers = [
    tryIsoOrDmy,
    tryCommaDayListWithSharedMonthYear,
    tryRangeDates,
    tryMultiSegmentDates,
    trySingleNamedDate,
  ];

  for (const parser of parsers) {
    const dates = parser(trimmed);
    if (dates.length > 0) {
      return dedupeAndSort(dates);
    }
  }

  return [];
}

/**
 * Parse a single departure date string into ISO format (YYYY-MM-DD).
 */
export function parseDepartureDate(value: string | null | undefined): string | null {
  const dates = parseDepartureDates(value);
  return dates[0] ?? null;
}

/** Localized preview label for parsed ISO departure dates. */
export function formatDepartureDatePreview(
  isoDate: string | null | undefined,
  locale: Locale | string = "id",
): string {
  if (!isoDate) return "—";

  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return "—";

  const date = new Date(year, month - 1, day);

  if (locale === "en") {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Localized preview for multiple departure dates. */
export function formatDepartureDatesPreview(
  dates: string[],
  locale: Locale | string = "id",
): string {
  if (dates.length === 0) return "—";
  if (dates.length === 1) return formatDepartureDatePreview(dates[0], locale);
  return dates.map((date) => formatDepartureDatePreview(date, locale)).join(", ");
}
