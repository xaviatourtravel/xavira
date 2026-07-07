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

/**
 * Parse departure date strings into ISO format (YYYY-MM-DD).
 */
export function parseDepartureDate(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;

  const trimmed = value.trim().replace(/,/g, "").replace(/\s+/g, " ");

  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    return toIsoDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  }

  const dmyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    return toIsoDate(Number(dmyMatch[3]), Number(dmyMatch[2]), Number(dmyMatch[1]));
  }

  const namedMatch = trimmed.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/);
  if (namedMatch) {
    const day = Number(namedMatch[1]);
    const month = MONTH_NAMES[namedMatch[2].toLowerCase()];
    const year = Number(namedMatch[3]);
    if (month) return toIsoDate(year, month, day);
  }

  return null;
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
