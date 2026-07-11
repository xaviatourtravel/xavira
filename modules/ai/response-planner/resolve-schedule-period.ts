import { parseDepartureDate } from "@/modules/business-brain/lib/parse-departure-date";

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

export type SchedulePeriodConstraint = {
  month: number | null;
  year: number | null;
  startDate: string | null;
  endDate: string | null;
  label: string | null;
};

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

function inferYearForMonth(month: number, referenceDate: Date): number {
  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth() + 1;
  if (month < refMonth) {
    return refYear + 1;
  }
  return refYear;
}

export function extractSchedulePeriodFromMessage(
  message: string,
  referenceDate = new Date(),
): SchedulePeriodConstraint | null {
  const normalized = message.trim().toLowerCase();
  if (!normalized) return null;

  const monthYearMatch = normalized.match(
    /\b(jan(?:uari|uary)?|feb(?:ruari|ruary)?|mar(?:et|ch)?|apr(?:il)?|mei|may|jun(?:i|e)?|jul(?:i|y)?|ag(?:ustus|ust)?|sep(?:t(?:ember)?)?|okt(?:ober)?|oct(?:ober)?|nov(?:ember)?|des(?:ember)?|dec(?:ember)?)\s+(\d{4})\b/i,
  );
  if (monthYearMatch) {
    const month = resolveMonth(monthYearMatch[1]);
    const year = Number(monthYearMatch[2]);
    if (month && Number.isFinite(year)) {
      const start = toIsoDate(year, month, 1);
      const endDay = new Date(year, month, 0).getDate();
      const end = toIsoDate(year, month, endDay);
      return {
        month,
        year,
        startDate: start,
        endDate: end,
        label: `${monthYearMatch[1]} ${year}`,
      };
    }
  }

  const monthOnlyMatch = normalized.match(
    /\b(?:bulan\s+)?(jan(?:uari|uary)?|feb(?:ruari|ruary)?|mar(?:et|ch)?|apr(?:il)?|mei|may|jun(?:i|e)?|jul(?:i|y)?|ag(?:ustus|ust)?|sep(?:t(?:ember)?)?|okt(?:ober)?|oct(?:ober)?|nov(?:ember)?|des(?:ember)?|dec(?:ember)?)\b/i,
  );
  if (monthOnlyMatch) {
    const month = resolveMonth(monthOnlyMatch[1]);
    if (month) {
      const year = inferYearForMonth(month, referenceDate);
      const start = toIsoDate(year, month, 1);
      const endDay = new Date(year, month, 0).getDate();
      const end = toIsoDate(year, month, endDay);
      return {
        month,
        year,
        startDate: start,
        endDate: end,
        label: `${monthOnlyMatch[1]} ${year}`,
      };
    }
  }

  const isoRange = normalized.match(/\b(\d{4}-\d{2}-\d{2})\s*(?:sampai|s\/d|-|to)\s*(\d{4}-\d{2}-\d{2})\b/i);
  if (isoRange) {
    return {
      month: null,
      year: null,
      startDate: isoRange[1],
      endDate: isoRange[2],
      label: `${isoRange[1]} – ${isoRange[2]}`,
    };
  }

  return null;
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

export function departureMatchesPeriod(
  isoDate: string,
  constraint: SchedulePeriodConstraint | null,
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
