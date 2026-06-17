const INDONESIAN_MONTHS =
  /(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})/i;

const ENGLISH_MONTHS =
  /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i;

const ENGLISH_MONTH_TO_ID: Record<string, string> = {
  january: "Januari",
  february: "Februari",
  march: "Maret",
  april: "April",
  may: "Mei",
  june: "Juni",
  july: "Juli",
  august: "Agustus",
  september: "September",
  october: "Oktober",
  november: "November",
  december: "Desember",
};

export type ParsedPackageStructure = {
  packageName: string;
  duration: string | null;
  departureMonth: string | null;
  destinations: string[];
};

export type ParsePackageStructureInput = {
  rawName: string;
  destination: string | null;
  departureDate: string | null;
  durationDays: number | null;
};

function capitalizeMonth(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function formatDurationFromDays(days: number) {
  if (days <= 1) {
    return "1 Hari";
  }

  return `${days} Hari ${days - 1} Malam`;
}

function formatDurationFromPattern(days: number, nights: number) {
  if (nights > 0) {
    return `${days} Hari ${nights} Malam`;
  }

  return `${days} Hari`;
}

function parseDurationToken(text: string) {
  const match = text.match(/\b(\d+)\s*[dD]\s*(\d+)\s*[nN]\b/);
  if (!match) {
    return null;
  }

  return formatDurationFromPattern(
    Number.parseInt(match[1], 10),
    Number.parseInt(match[2], 10),
  );
}

function parseDepartureMonth(text: string) {
  const idMatch = text.match(INDONESIAN_MONTHS);
  if (idMatch) {
    return `${capitalizeMonth(idMatch[1])} ${idMatch[2]}`;
  }

  const enMatch = text.match(ENGLISH_MONTHS);
  if (enMatch) {
    const month =
      ENGLISH_MONTH_TO_ID[enMatch[1].toLowerCase()] ??
      capitalizeMonth(enMatch[1]);
    return `${month} ${enMatch[2]}`;
  }

  return null;
}

function parseDepartureMonthFromDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function splitDestinationList(value: string) {
  return value
    .split(/\s*[—–\-,/|]\s*/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseDestinationsFromText(text: string) {
  const keMatch = text.match(/\bke\s+(.+)$/i);
  if (!keMatch) {
    return [];
  }

  return splitDestinationList(keMatch[1]);
}

function cleanPackageName(rawName: string) {
  const pipeParts = rawName.split("|");
  let name = pipeParts[0]?.trim() ?? rawName.trim();

  name = name
    .replace(/\b\d+\s*[dD]\s*\d+\s*[nN]\b/g, "")
    .replace(INDONESIAN_MONTHS, "")
    .replace(ENGLISH_MONTHS, "")
    .replace(/\bke\s+.+$/i, "")
    .replace(/[,\-|—–]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  return name || rawName.trim();
}

function mergeDestinations(...lists: string[][]) {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const list of lists) {
    for (const item of list) {
      const key = item.toLowerCase();
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      merged.push(item);
    }
  }

  return merged;
}

export function parsePackageStructure(
  input: ParsePackageStructureInput,
): ParsedPackageStructure {
  const detailText =
    input.rawName.includes("|")
      ? input.rawName.split("|").slice(1).join("|")
      : input.rawName;

  const duration =
    parseDurationToken(input.rawName) ??
    parseDurationToken(detailText) ??
    (input.durationDays != null
      ? formatDurationFromDays(input.durationDays)
      : null);

  const departureMonth =
    parseDepartureMonth(input.rawName) ??
    parseDepartureMonth(detailText) ??
    parseDepartureMonthFromDate(input.departureDate);

  const destinations = mergeDestinations(
    parseDestinationsFromText(input.rawName),
    parseDestinationsFromText(detailText),
    input.destination ? splitDestinationList(input.destination) : [],
  );

  return {
    packageName: cleanPackageName(input.rawName),
    duration,
    departureMonth,
    destinations,
  };
}
