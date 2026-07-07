import { addDays, addMonths, addWeeks, format, subDays } from "date-fns";

export const DEFAULT_AI_TIMEZONE = "Asia/Jakarta";

export type AiRuntimeLocale = "id" | "en";

const TIMEZONE_ABBREVIATIONS: Record<string, string> = {
  "Asia/Jakarta": "WIB",
  "Asia/Makassar": "WITA",
  "Asia/Jayapura": "WIT",
};

const LOCALE_TAGS: Record<AiRuntimeLocale, string> = {
  id: "id-ID",
  en: "en-US",
};

export type AiRuntimeContext = {
  currentDate: string;
  currentTime: string;
  currentDateTime: string;
  isoDate: string;
  isoTimestamp: string;
  timezone: string;
  locale: AiRuntimeLocale;
  dayOfWeek: string;
  month: string;
  year: string;
  workspaceName: string;
  workspaceId: string;
  currentUser: string;
  businessName: string;
  environment: string;
  utcOffsetLabel: string;
  timezoneAbbreviation: string;
  resolved: {
    today: string;
    todayLabel: string;
    tomorrow: string;
    tomorrowLabel: string;
    yesterday: string;
    yesterdayLabel: string;
    thisWeekStart: string;
    nextWeekStart: string;
    thisMonth: string;
    nextMonth: string;
    thisYear: string;
    nextYear: string;
  };
};

export type BuildRuntimeContextInput = {
  now?: Date;
  timezone?: string | null;
  locale?: AiRuntimeLocale | null;
  workspaceId?: string | null;
  workspaceName?: string | null;
  currentUser?: string | null;
  businessName?: string | null;
  environment?: string | null;
};

function resolveTimezone(timezone?: string | null): string {
  const trimmed = timezone?.trim();
  return trimmed || DEFAULT_AI_TIMEZONE;
}

function resolveLocale(locale?: AiRuntimeLocale | null): AiRuntimeLocale {
  return locale === "en" ? "en" : "id";
}

function resolveEnvironment(environment?: string | null): string {
  if (environment?.trim()) {
    return environment.trim();
  }

  if (process.env.VERCEL_ENV === "production") {
    return "Production";
  }

  if (process.env.VERCEL_ENV === "preview") {
    return "Preview";
  }

  if (process.env.NODE_ENV === "development") {
    return "Development";
  }

  return "Production";
}

function formatIsoDateInTimezone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatUtcOffset(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  }).formatToParts(date);

  const offset = parts.find((part) => part.type === "timeZoneName")?.value ?? "UTC";
  return offset.replace("GMT", "UTC");
}

function getTimezoneAbbreviation(timeZone: string, date: Date): string {
  return TIMEZONE_ABBREVIATIONS[timeZone] ?? formatUtcOffset(date, timeZone);
}

function getWeekStartIsoDate(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return format(addDays(date, diff), "yyyy-MM-dd");
}

function formatFriendlyDate(
  date: Date,
  locale: AiRuntimeLocale,
  timeZone: string,
): string {
  const localeTag = LOCALE_TAGS[locale];

  if (locale === "en") {
    return new Intl.DateTimeFormat(localeTag, {
      timeZone,
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  return new Intl.DateTimeFormat(localeTag, {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatFriendlyDateFromIso(
  isoDate: string,
  locale: AiRuntimeLocale,
  timeZone: string,
): string {
  return formatFriendlyDate(parseIsoDate(isoDate), locale, timeZone);
}

function formatMonthYear(date: Date, locale: AiRuntimeLocale, timeZone: string): string {
  const localeTag = LOCALE_TAGS[locale];
  const month = new Intl.DateTimeFormat(localeTag, {
    timeZone,
    month: "long",
  }).format(date);
  const year = new Intl.DateTimeFormat(localeTag, {
    timeZone,
    year: "numeric",
  }).format(date);

  return `${month} ${year}`;
}

export function resolveLocaleFromCommunicationLanguage(
  language?: string | null,
): AiRuntimeLocale {
  const normalized = language?.trim().toLowerCase();

  if (normalized === "english") {
    return "en";
  }

  if (normalized === "indonesian" || normalized === "mixed") {
    return "id";
  }

  return "id";
}

export function buildRuntimeContext(
  input?: BuildRuntimeContextInput,
): AiRuntimeContext {
  const now = input?.now ?? new Date();
  const timezone = resolveTimezone(input?.timezone);
  const locale = resolveLocale(input?.locale);
  const localeTag = LOCALE_TAGS[locale];
  const isoDate = formatIsoDateInTimezone(now, timezone);
  const calendarDate = parseIsoDate(isoDate);

  const currentTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  const month = new Intl.DateTimeFormat(localeTag, {
    timeZone: timezone,
    month: "long",
  }).format(now);

  const year = new Intl.DateTimeFormat(localeTag, {
    timeZone: timezone,
    year: "numeric",
  }).format(now);

  const dayOfWeek = new Intl.DateTimeFormat(localeTag, {
    timeZone: timezone,
    weekday: "long",
  }).format(now);

  const currentDate = formatFriendlyDate(now, locale, timezone);
  const utcOffsetLabel = formatUtcOffset(now, timezone);
  const timezoneAbbreviation = getTimezoneAbbreviation(timezone, now);
  const currentDateTime = `${currentTime} ${timezoneAbbreviation}`;

  const tomorrowIso = format(addDays(calendarDate, 1), "yyyy-MM-dd");
  const yesterdayIso = format(subDays(calendarDate, 1), "yyyy-MM-dd");
  const thisWeekStart = getWeekStartIsoDate(isoDate);
  const nextWeekStart = format(addWeeks(parseIsoDate(thisWeekStart), 1), "yyyy-MM-dd");
  const thisMonth = formatMonthYear(calendarDate, locale, timezone);
  const nextMonth = formatMonthYear(addMonths(calendarDate, 1), locale, timezone);
  const thisYear = format(calendarDate, "yyyy");
  const nextYear = String(Number(thisYear) + 1);

  return {
    currentDate,
    currentTime,
    currentDateTime,
    isoDate,
    isoTimestamp: now.toISOString(),
    timezone,
    locale,
    dayOfWeek,
    month,
    year,
    workspaceName: input?.workspaceName?.trim() || "Workspace",
    workspaceId: input?.workspaceId?.trim() || "",
    currentUser: input?.currentUser?.trim() || "System",
    businessName: input?.businessName?.trim() || "Business",
    environment: resolveEnvironment(input?.environment),
    utcOffsetLabel,
    timezoneAbbreviation,
    resolved: {
      today: isoDate,
      todayLabel: currentDate,
      tomorrow: tomorrowIso,
      tomorrowLabel: formatFriendlyDateFromIso(tomorrowIso, locale, timezone),
      yesterday: yesterdayIso,
      yesterdayLabel: formatFriendlyDateFromIso(yesterdayIso, locale, timezone),
      thisWeekStart,
      nextWeekStart,
      thisMonth,
      nextMonth,
      thisYear,
      nextYear,
    },
  };
}

export function buildRuntimePrompt(context: AiRuntimeContext): string {
  return [
    "Runtime Context",
    "",
    "Current datetime:",
    context.currentDate,
    context.currentDateTime,
    "",
    "Timezone:",
    `${context.timezone} (${context.utcOffsetLabel})`,
    "",
    "Current month:",
    context.month,
    "",
    "Current year:",
    context.year,
    "",
    "Workspace:",
    context.workspaceName,
    "",
    "Current user:",
    context.currentUser,
    "",
    "Business:",
    context.businessName,
    "",
    "Environment:",
    context.environment,
    "",
    "Rules:",
    "",
    `- "today" means ${context.resolved.todayLabel}`,
    `- "tomorrow" means ${context.resolved.tomorrowLabel}`,
    `- "yesterday" means ${context.resolved.yesterdayLabel}`,
    `- "this week" means week starting ${context.resolved.thisWeekStart}`,
    `- "next week" means week starting ${context.resolved.nextWeekStart}`,
    `- "this month" means ${context.resolved.thisMonth}`,
    `- "next month" means ${context.resolved.nextMonth}`,
    `- "this year" means ${context.resolved.thisYear}`,
    `- "next year" means ${context.resolved.nextYear}`,
    "- Never assume another date.",
    "- Never fabricate current time.",
    `- ISO date: ${context.isoDate}`,
    `- ISO timestamp: ${context.isoTimestamp}`,
  ].join("\n");
}

export function prependRuntimePrompt(
  content: string,
  input?: BuildRuntimeContextInput,
): string {
  const context = buildRuntimeContext(input);

  return [buildRuntimePrompt(context), "", content].join("\n");
}

export function withRuntimeContext(
  prompt: string,
  input?: BuildRuntimeContextInput,
): string {
  return prependRuntimePrompt(prompt, input);
}
