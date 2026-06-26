import {
  CUSTOMER_AI_SUMMARY_CACHE_KEY,
  type CustomerAiIntentLevel,
  type CustomerAiMissingField,
  type CustomerAiSummary,
  type CustomerAiTemperature,
} from "./types";

const INTENT_LEVELS: CustomerAiIntentLevel[] = ["Low", "Medium", "High"];
const TEMPERATURES: CustomerAiTemperature[] = ["Cold", "Warm", "Hot"];
const MISSING_FIELD_VALUES: CustomerAiMissingField[] = [
  "phone",
  "travel date",
  "pax",
  "budget",
  "package preference",
];

function normalizeIntentLevel(value: unknown): CustomerAiIntentLevel {
  if (typeof value === "string") {
    const match = INTENT_LEVELS.find(
      (level) => level.toLowerCase() === value.trim().toLowerCase(),
    );
    if (match) {
      return match;
    }
  }

  return "Medium";
}

function normalizeTemperature(value: unknown): CustomerAiTemperature {
  if (typeof value === "string") {
    const match = TEMPERATURES.find(
      (temp) => temp.toLowerCase() === value.trim().toLowerCase(),
    );
    if (match) {
      return match;
    }
  }

  return "Warm";
}

function normalizeMissingFields(value: unknown): CustomerAiMissingField[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().toLowerCase())
    .map((item) =>
      MISSING_FIELD_VALUES.find((field) => field.toLowerCase() === item),
    )
    .filter((item): item is CustomerAiMissingField => Boolean(item));
}

function mergeMissingFields(
  aiFields: CustomerAiMissingField[],
  ruleBasedFields: CustomerAiMissingField[],
) {
  return [...new Set([...ruleBasedFields, ...aiFields])];
}

export function parseCustomerAiSummaryResponse(
  raw: string,
  ruleBasedMissingFields: CustomerAiMissingField[],
): {
  success: true;
  data: CustomerAiSummary;
} | {
  success: false;
  message: string;
} {
  const trimmed = raw.trim();
  const jsonText = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim()
    : trimmed;

  try {
    const parsed = JSON.parse(jsonText) as Record<string, unknown>;
    const customerSummary =
      typeof parsed.customerSummary === "string"
        ? parsed.customerSummary.trim()
        : "";

    if (!customerSummary) {
      return {
        success: false,
        message: "Gagal membuat ringkasan customer. Coba lagi.",
      };
    }

    const paxValue =
      typeof parsed.pax === "number"
        ? parsed.pax
        : Number.parseInt(String(parsed.pax ?? ""), 10);
    const pax = Number.isFinite(paxValue) && paxValue > 0 ? paxValue : null;

    const nextBestAction =
      typeof parsed.nextBestAction === "string"
        ? parsed.nextBestAction.trim()
        : "Follow up customer untuk konfirmasi kebutuhan perjalanan.";
    const suggestedFollowUpMessage =
      typeof parsed.suggestedFollowUpMessage === "string"
        ? parsed.suggestedFollowUpMessage.trim()
        : "";

    return {
      success: true,
      data: {
        customerSummary,
        destinationInterest:
          typeof parsed.destinationInterest === "string"
            ? parsed.destinationInterest.trim() || null
            : null,
        travelDateOrMonth:
          typeof parsed.travelDateOrMonth === "string"
            ? parsed.travelDateOrMonth.trim() || null
            : null,
        pax,
        budget:
          typeof parsed.budget === "string" ? parsed.budget.trim() || null : null,
        intentLevel: normalizeIntentLevel(parsed.intentLevel),
        leadTemperature: normalizeTemperature(parsed.leadTemperature),
        missingFields: mergeMissingFields(
          normalizeMissingFields(parsed.missingFields),
          ruleBasedMissingFields,
        ),
        nextBestAction,
        suggestedFollowUpMessage,
        insufficientData: parsed.insufficientData === true,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch {
    return {
      success: false,
      message: "Gagal memproses ringkasan AI. Coba lagi.",
    };
  }
}

export function readCustomerAiSummaryCache(
  metadata: Record<string, unknown> | null | undefined,
  fingerprint: string,
): CustomerAiSummary | null {
  const cached = metadata?.[CUSTOMER_AI_SUMMARY_CACHE_KEY];

  if (!cached || typeof cached !== "object") {
    return null;
  }

  const entry = cached as Record<string, unknown>;

  if (entry.fingerprint !== fingerprint) {
    return null;
  }

  if (typeof entry.customerSummary !== "string") {
    return null;
  }

  return {
    customerSummary: entry.customerSummary,
    destinationInterest:
      typeof entry.destinationInterest === "string"
        ? entry.destinationInterest
        : null,
    travelDateOrMonth:
      typeof entry.travelDateOrMonth === "string"
        ? entry.travelDateOrMonth
        : null,
    pax: typeof entry.pax === "number" ? entry.pax : null,
    budget: typeof entry.budget === "string" ? entry.budget : null,
    intentLevel: normalizeIntentLevel(entry.intentLevel),
    leadTemperature: normalizeTemperature(entry.leadTemperature),
    missingFields: normalizeMissingFields(entry.missingFields),
    nextBestAction:
      typeof entry.nextBestAction === "string"
        ? entry.nextBestAction
        : "Follow up customer.",
    suggestedFollowUpMessage:
      typeof entry.suggestedFollowUpMessage === "string"
        ? entry.suggestedFollowUpMessage
        : "",
    insufficientData: entry.insufficientData === true,
    generatedAt:
      typeof entry.generatedAt === "string"
        ? entry.generatedAt
        : new Date().toISOString(),
  };
}

export function buildCustomerAiSummaryCacheEntry(
  fingerprint: string,
  summary: CustomerAiSummary,
) {
  return {
    fingerprint,
    ...summary,
  };
}
