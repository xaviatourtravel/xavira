export type SnoozePreset = "tomorrow" | "3_days" | "1_week" | "custom";

export function parseSnoozePreset(value: string): SnoozePreset | null {
  switch (value.trim()) {
    case "tomorrow":
    case "3_days":
    case "1_week":
    case "custom":
      return value.trim() as SnoozePreset;
    default:
      return null;
  }
}

function endOfJakartaDay(date: Date) {
  const jakartaDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  return new Date(`${jakartaDate}T23:59:59+07:00`);
}

export function resolveSnoozeUntil(input: {
  preset: SnoozePreset;
  customDate?: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();

  switch (input.preset) {
    case "tomorrow": {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return endOfJakartaDay(tomorrow).toISOString();
    }
    case "3_days": {
      const target = new Date(now);
      target.setDate(target.getDate() + 3);
      return endOfJakartaDay(target).toISOString();
    }
    case "1_week": {
      const target = new Date(now);
      target.setDate(target.getDate() + 7);
      return endOfJakartaDay(target).toISOString();
    }
    case "custom": {
      const customDate = input.customDate?.trim();

      if (!customDate) {
        return null;
      }

      return endOfJakartaDay(new Date(`${customDate}T12:00:00`)).toISOString();
    }
  }
}

export function formatSnoozeUntilLabel(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}
