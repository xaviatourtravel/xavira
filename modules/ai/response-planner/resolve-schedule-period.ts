import { parseDepartureDate } from "@/modules/business-brain/lib/parse-departure-date";
import { DEFAULT_AI_TIMEZONE } from "@/modules/ai/runtime/build-runtime-context";

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

export type SchedulePeriodType =
  | "today"
  | "tomorrow"
  | "this_week"
  | "next_week"
  | "this_month"
  | "next_month"
  | "end_of_month"
  | "named_month"
  | "named_month_year"
  | "date_range"
  | "unknown";

export type ResolvedSchedulePeriod = {
  periodType: SchedulePeriodType;
  startDate: string | null;
  endDate: string | null;
  month: number | null;
  year: number | null;
  timezone: string;
  interpretationLabel: string | null;
};

/** @deprecated Use ResolvedSchedulePeriod */
export type SchedulePeriodConstraint = {
  month: number | null;
  year: number | null;
  startDate: string | null;
  endDate: string | null;
  label: string | null;
};

function resolveTimezone(timezone?: string | null): string {
  const trimmed = timezone?.trim();
  if (!trimmed) return DEFAULT_AI_TIMEZONE;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: trimmed });
    return trimmed;
  } catch {
    return DEFAULT_AI_TIMEZONE;
  }
}

function formatIsoDateInTimezone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getZonedParts(date: Date, timeZone: string): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  return { year, month, day };
}

function resolveMonth(name: string): number | null {
  return MONTH_NAMES[name.toLowerCase()] ?? null;
}

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

function endOfMonth(year: number, month: number): string {
  const endDay = new Date(year, month, 0).getDate();
  return toIsoDate(year, month, endDay) ?? `${year}-${pad2(month)}-${pad2(endDay)}`;
}

function inferYearForMonth(month: number, referenceDate: Date, timeZone: string): number {
  const { year, month: refMonth } = getZonedParts(referenceDate, timeZone);
  if (month < refMonth) return year + 1;
  return year;
}

function toConstraint(period: ResolvedSchedulePeriod): SchedulePeriodConstraint {
  return {
    month: period.month,
    year: period.year,
    startDate: period.startDate,
    endDate: period.endDate,
    label: period.interpretationLabel,
  };
}

export function resolveSchedulePeriod(
  message: string,
  options?: { referenceDate?: Date; timezone?: string | null },
): ResolvedSchedulePeriod | null {
  const referenceDate = options?.referenceDate ?? new Date();
  const timezone = resolveTimezone(options?.timezone);
  const normalized = message.trim().toLowerCase();
  if (!normalized) return null;

  const zoned = getZonedParts(referenceDate, timezone);

  if (/\b(hari\s+ini|today)\b/i.test(normalized)) {
    const iso = toIsoDate(zoned.year, zoned.month, zoned.day);
    return {
      periodType: "today",
      startDate: iso,
      endDate: iso,
      month: zoned.month,
      year: zoned.year,
      timezone,
      interpretationLabel: "hari ini",
    };
  }

  if (/\b(besok|tomorrow)\b/i.test(normalized)) {
    const tomorrow = new Date(referenceDate.getTime() + 24 * 60 * 60 * 1000);
    const parts = getZonedParts(tomorrow, timezone);
    const iso = toIsoDate(parts.year, parts.month, parts.day);
    return {
      periodType: "tomorrow",
      startDate: iso,
      endDate: iso,
      month: parts.month,
      year: parts.year,
      timezone,
      interpretationLabel: "besok",
    };
  }

  if (/\b(minggu\s+depan|next\s+week)\b/i.test(normalized)) {
    const start = new Date(referenceDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
    const startParts = getZonedParts(start, timezone);
    const endParts = getZonedParts(end, timezone);
    return {
      periodType: "next_week",
      startDate: toIsoDate(startParts.year, startParts.month, startParts.day),
      endDate: toIsoDate(endParts.year, endParts.month, endParts.day),
      month: startParts.month,
      year: startParts.year,
      timezone,
      interpretationLabel: "minggu depan",
    };
  }

  if (/\b(bulan\s+depan|next\s+month)\b/i.test(normalized)) {
    let month = zoned.month + 1;
    let year = zoned.year;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    return {
      periodType: "next_month",
      startDate: toIsoDate(year, month, 1),
      endDate: endOfMonth(year, month),
      month,
      year,
      timezone,
      interpretationLabel: `bulan depan (${MONTH_LABELS[month] ?? month} ${year})`,
    };
  }

  if (/\b(bulan\s+ini|this\s+month)\b/i.test(normalized)) {
    return {
      periodType: "this_month",
      startDate: toIsoDate(zoned.year, zoned.month, 1),
      endDate: endOfMonth(zoned.year, zoned.month),
      month: zoned.month,
      year: zoned.year,
      timezone,
      interpretationLabel: "bulan ini",
    };
  }

  if (/\b(akhir\s+bulan|end\s+of\s+(the\s+)?month)\b/i.test(normalized)) {
    const endDay = new Date(zoned.year, zoned.month, 0).getDate();
    const startDay = Math.max(1, endDay - 6);
    return {
      periodType: "end_of_month",
      startDate: toIsoDate(zoned.year, zoned.month, startDay),
      endDate: endOfMonth(zoned.year, zoned.month),
      month: zoned.month,
      year: zoned.year,
      timezone,
      interpretationLabel: "akhir bulan",
    };
  }

  const monthYearMatch = normalized.match(
    /\b(jan(?:uari|uary)?|feb(?:ruari|ruary)?|mar(?:et|ch)?|apr(?:il)?|mei|may|jun(?:i|e)?|jul(?:i|y)?|ag(?:ustus|ust)?|sep(?:t(?:ember)?)?|okt(?:ober)?|oct(?:ober)?|nov(?:ember)?|des(?:ember)?|dec(?:ember)?)\s+(\d{4})\b/i,
  );
  if (monthYearMatch) {
    const month = resolveMonth(monthYearMatch[1]);
    const year = Number(monthYearMatch[2]);
    if (month && Number.isFinite(year)) {
      return {
        periodType: "named_month_year",
        startDate: toIsoDate(year, month, 1),
        endDate: endOfMonth(year, month),
        month,
        year,
        timezone,
        interpretationLabel: `${monthYearMatch[1]} ${year}`,
      };
    }
  }

  const monthOnlyMatch = normalized.match(
    /\b(?:bulan\s+)?(jan(?:uari|uary)?|feb(?:ruari|ruary)?|mar(?:et|ch)?|apr(?:il)?|mei|may|jun(?:i|e)?|jul(?:i|y)?|ag(?:ustus|ust)?|sep(?:t(?:ember)?)?|okt(?:ober)?|oct(?:ober)?|nov(?:ember)?|des(?:ember)?|dec(?:ember)?)\b/i,
  );
  if (monthOnlyMatch) {
    const month = resolveMonth(monthOnlyMatch[1]);
    if (month) {
      const year = inferYearForMonth(month, referenceDate, timezone);
      return {
        periodType: "named_month",
        startDate: toIsoDate(year, month, 1),
        endDate: endOfMonth(year, month),
        month,
        year,
        timezone,
        interpretationLabel: `${monthOnlyMatch[1]} ${year}`,
      };
    }
  }

  const isoRange = normalized.match(/\b(\d{4}-\d{2}-\d{2})\s*(?:sampai|s\/d|-|to)\s*(\d{4}-\d{2}-\d{2})\b/i);
  if (isoRange) {
    return {
      periodType: "date_range",
      startDate: isoRange[1],
      endDate: isoRange[2],
      month: null,
      year: null,
      timezone,
      interpretationLabel: `${isoRange[1]} – ${isoRange[2]}`,
    };
  }

  return null;
}

const MONTH_LABELS: Record<number, string> = {
  1: "Januari",
  2: "Februari",
  3: "Maret",
  4: "April",
  5: "Mei",
  6: "Juni",
  7: "Juli",
  8: "Agustus",
  9: "September",
  10: "Oktober",
  11: "November",
  12: "Desember",
};

export function extractSchedulePeriodFromMessage(
  message: string,
  referenceDate = new Date(),
  timezone?: string | null,
): SchedulePeriodConstraint | null {
  const resolved = resolveSchedulePeriod(message, { referenceDate, timezone });
  return resolved ? toConstraint(resolved) : null;
}

export function normalizeDepartureToIso(
  departureDate: string,
): { iso: string | null; malformed: boolean } {
  const iso = parseDepartureDate(departureDate);
  return {
    iso,
    malformed: Boolean(departureDate.trim()) && !iso,
  };
}

export type MentionedMonth = {
  month: number;
  year: number | null;
};

export function extractMentionedMonthsFromReply(reply: string): MentionedMonth[] {
  const found: MentionedMonth[] = [];
  const normalized = reply.toLowerCase();

  for (const [name, month] of Object.entries(MONTH_NAMES)) {
    if (new RegExp(`\\b${name}\\b`, "i").test(normalized)) {
      const yearMatch = normalized.match(new RegExp(`\\b${name}\\s+(\\d{4})\\b`, "i"));
      found.push({ month, year: yearMatch ? Number(yearMatch[1]) : null });
    }
  }

  for (const match of normalized.matchAll(/\b(\d{4})-(\d{2})-\d{2}\b/g)) {
    found.push({ month: Number(match[2]), year: Number(match[1]) });
  }

  for (const match of normalized.matchAll(/\b\d{1,2}\s+([a-z]+)\s+(\d{4})\b/gi)) {
    const month = resolveMonth(match[1]);
    if (month) {
      found.push({ month, year: Number(match[2]) });
    }
  }

  return found;
}

export function mentionedMonthOutsideRequestedPeriod(
  mentioned: MentionedMonth,
  period: {
    month: number | null;
    year: number | null;
    startDate: string | null;
    endDate: string | null;
  },
): boolean {
  const periodMonth =
    period.month ?? (period.startDate ? Number(period.startDate.slice(5, 7)) : null);
  const periodYear =
    period.year ?? (period.startDate ? Number(period.startDate.slice(0, 4)) : null);

  if (!periodMonth) return false;
  if (mentioned.month === periodMonth) {
    if (mentioned.year && periodYear && mentioned.year !== periodYear) return true;
    return false;
  }

  if (!mentioned.year || !periodYear || mentioned.year === periodYear) {
    return true;
  }

  return false;
}

export function departureMatchesPeriod(
  isoDate: string,
  constraint: SchedulePeriodConstraint | ResolvedSchedulePeriod | null,
): boolean {
  if (!constraint) return true;

  if (constraint.startDate && constraint.endDate) {
    return isoDate >= constraint.startDate && isoDate <= constraint.endDate;
  }

  const [year, month] = isoDate.split("-").map(Number);
  if (constraint.month && month !== constraint.month) return false;
  if (constraint.year && year !== constraint.year) return false;
  return true;
}
