const JAKARTA_TIME_ZONE = "Asia/Jakarta";
const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function getTodayLeadDateValue(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: JAKARTA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function toLeadDateInputValue(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

export function parseLeadDateInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (!DATE_INPUT_PATTERN.test(trimmed)) {
    return null;
  }

  const [year, month, day] = trimmed.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return trimmed;
}

export function resolveLeadDateForCreate(value: string): string {
  return parseLeadDateInput(value) ?? getTodayLeadDateValue();
}

export function formatLeadDate(
  value: string,
  options?: { style?: "medium" | "long" },
) {
  const dateStyle = options?.style ?? "medium";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle,
    timeZone: JAKARTA_TIME_ZONE,
  }).format(new Date(`${value.slice(0, 10)}T12:00:00`));
}
