import type { GreetingType } from "@/modules/ai/conversation-state/types";
import { detectGreetingType } from "@/modules/ai/conversation-state/greeting-decision";

export type Daypart = "pagi" | "siang" | "sore" | "malam";

const DEFAULT_TIMEZONE = "Asia/Jakarta";

export function resolveWorkspaceDaypart(timezone: string | null | undefined, now = new Date()): Daypart {
  const tz = timezone?.trim() || DEFAULT_TIMEZONE;
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      hour12: false,
    }).format(now),
  );

  if (hour >= 5 && hour < 11) return "pagi";
  if (hour >= 11 && hour < 15) return "siang";
  if (hour >= 15 && hour < 19) return "sore";
  return "malam";
}

export function resolveVerifiedCompanyName(
  companyName: string | null | undefined,
): string | null {
  const trimmed = companyName?.trim();
  if (!trimmed || trimmed.length < 2) return null;
  return trimmed;
}

export function buildGreetingTemplate(input: {
  greetingType: GreetingType;
  companyName: string | null;
  timezone?: string | null;
  now?: Date;
}): string {
  const company = resolveVerifiedCompanyName(input.companyName);
  const daypart = resolveWorkspaceDaypart(input.timezone, input.now);

  if (input.greetingType === "english") {
    return company
      ? `Hello! Thanks for contacting ${company}. How can we help today?`
      : "Hello! How can we help today?";
  }

  if (input.greetingType === "islamic") {
    return company
      ? `Wa'alaikumsalam, Kak. Terima kasih sudah menghubungi ${company}. Ada yang bisa kami bantu hari ini?`
      : "Wa'alaikumsalam, Kak. Ada yang bisa kami bantu hari ini?";
  }

  const greetingPrefix =
    input.greetingType === "indonesian" || input.greetingType === "generic"
      ? `Halo Kak, selamat ${daypart}.`
      : `Halo Kak, selamat ${daypart}.`;

  if (company) {
    return `${greetingPrefix} Terima kasih sudah menghubungi ${company}. Ada yang bisa kami bantu hari ini?`;
  }

  return `${greetingPrefix} Ada yang bisa kami bantu hari ini?`;
}

export function resolveGreetingTypeFromMessage(message: string): GreetingType {
  return detectGreetingType(message);
}
