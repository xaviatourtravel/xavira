import { addDays, addMonths, addWeeks, format, subDays } from "date-fns";

export const DEFAULT_AI_TIMEZONE = "Asia/Jakarta";

const TIMEZONE_ABBREVIATIONS: Record<string, string> = {
  "Asia/Jakarta": "WIB",
  "Asia/Makassar": "WITA",
  "Asia/Jayapura": "WIT",
};

export type TemporalContext = {
  timezone: string;
  isoDate: string;
  isoTimestamp: string;
  currentTime: string;
  currentMonth: string;
  currentYear: string;
  dayOfWeek: string;
  friendlyDate: string;
  friendlyDateTime: string;
  utcOffsetLabel: string;
  resolved: {
    today: string;
    tomorrow: string;
    yesterday: string;
    thisWeekStart: string;
    nextWeekStart: string;
    thisMonth: string;
    nextMonth: string;
    thisYear: string;
    nextYear: string;
  };
};

export type BuildTemporalContextOptions = {
  now?: Date;
  timezone?: string | null;
};

function resolveTimezone(timezone?: string | null): string {
  const trimmed = timezone?.trim();
  return trimmed || DEFAULT_AI_TIMEZONE;
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

export function buildTemporalContext(
  options?: BuildTemporalContextOptions,
): TemporalContext {
  const now = options?.now ?? new Date();
  const timezone = resolveTimezone(options?.timezone);
  const isoDate = formatIsoDateInTimezone(now, timezone);
  const calendarDate = parseIsoDate(isoDate);

  const currentTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  const currentMonth = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "long",
  }).format(now);

  const currentYear = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
  }).format(now);

  const dayOfWeek = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
  }).format(now);

  const friendlyDate = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  const utcOffsetLabel = formatUtcOffset(now, timezone);
  const timezoneAbbreviation = getTimezoneAbbreviation(timezone, now);

  const tomorrow = format(addDays(calendarDate, 1), "yyyy-MM-dd");
  const yesterday = format(subDays(calendarDate, 1), "yyyy-MM-dd");
  const thisWeekStart = getWeekStartIsoDate(isoDate);
  const nextWeekStart = format(addWeeks(parseIsoDate(thisWeekStart), 1), "yyyy-MM-dd");
  const thisMonth = format(calendarDate, "MMMM yyyy");
  const nextMonth = format(addMonths(calendarDate, 1), "MMMM yyyy");
  const thisYear = format(calendarDate, "yyyy");
  const nextYear = String(Number(thisYear) + 1);

  return {
    timezone,
    isoDate,
    isoTimestamp: now.toISOString(),
    currentTime,
    currentMonth,
    currentYear,
    dayOfWeek,
    friendlyDate,
    friendlyDateTime: `${currentTime} ${timezoneAbbreviation}`,
    utcOffsetLabel,
    resolved: {
      today: isoDate,
      tomorrow,
      yesterday,
      thisWeekStart,
      nextWeekStart,
      thisMonth,
      nextMonth,
      thisYear,
      nextYear,
    },
  };
}

export function formatTemporalContextBlock(context: TemporalContext): string {
  return [
    "Current datetime:",
    context.friendlyDate,
    `${context.friendlyDateTime}`,
    `Timezone: ${context.timezone} (${context.utcOffsetLabel})`,
    "",
    "Current Date:",
    context.isoDate,
    "",
    "Current Time:",
    context.currentTime,
    "",
    "Timezone:",
    context.timezone,
    "",
    "Current Month:",
    context.currentMonth,
    "",
    "Current Year:",
    context.currentYear,
    "",
    "Day of Week:",
    context.dayOfWeek,
    "",
    "ISO Timestamp:",
    context.isoTimestamp,
  ].join("\n");
}

export function formatTemporalResolutionRules(context: TemporalContext): string {
  return [
    "Temporal awareness rules:",
    "- Use ONLY the runtime values above as the current date and time. Never guess or assume today's date.",
    "- Resolve relative phrases in the workspace timezone using these mappings:",
    `  today → ${context.resolved.today}`,
    `  tomorrow → ${context.resolved.tomorrow}`,
    `  yesterday → ${context.resolved.yesterday}`,
    `  this week → week starting ${context.resolved.thisWeekStart}`,
    `  next week → week starting ${context.resolved.nextWeekStart}`,
    `  this month → ${context.resolved.thisMonth}`,
    `  next month → ${context.resolved.nextMonth}`,
    `  this year → ${context.resolved.thisYear}`,
    `  next year → ${context.resolved.nextYear}`,
  ].join("\n");
}

export function injectTemporalBeforeContent(
  content: string,
  options?: BuildTemporalContextOptions,
): string {
  const context = buildTemporalContext(options);

  return [
    formatTemporalContextBlock(context),
    "",
    content,
  ].join("\n");
}

export function withTemporalContext(
  prompt: string,
  options?: BuildTemporalContextOptions,
): string {
  const context = buildTemporalContext(options);

  return [
    formatTemporalContextBlock(context),
    "",
    formatTemporalResolutionRules(context),
    "",
    prompt,
  ].join("\n");
}

export function augmentSystemPromptWithTemporalContext(
  systemPrompt: string,
  options?: BuildTemporalContextOptions,
): string {
  const context = buildTemporalContext(options);

  return [
    formatTemporalContextBlock(context),
    "",
    formatTemporalResolutionRules(context),
    "",
    systemPrompt,
  ].join("\n");
}
