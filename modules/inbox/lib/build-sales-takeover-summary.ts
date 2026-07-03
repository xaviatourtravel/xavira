import type { ConversationMemoryMap } from "@/modules/ai/types/memory";
import type { LeadQualificationSnapshot } from "@/modules/ai/types/lead-qualification";
import type { WhatsappAiAuditEvent } from "@/lib/whatsapp-inbox/ai/activity-events";
import type { MessageRow } from "@/types/omnichannel-inbox";

export type SalesTakeoverSummaryModel = {
  handoffReason: string | null;
  destination: string | null;
  departure: string | null;
  passengerCount: string | null;
  budget: string | null;
  tripType: string | null;
  specialRequest: string | null;
  completionScore: number | null;
  aiConfidence: number | null;
  lastCustomerMessage: string | null;
  generatedSummary: string | null;
  hasQualificationData: boolean;
};

function pickFieldValue(
  qualification: LeadQualificationSnapshot | null | undefined,
  memory: ConversationMemoryMap | null | undefined,
  qualificationKey: keyof LeadQualificationSnapshot["fields"],
  memoryKey: keyof ConversationMemoryMap,
): string | null {
  const fromQualification = qualification?.fields[qualificationKey]?.trim();
  if (fromQualification) {
    return fromQualification;
  }

  const fromMemory = memory?.[memoryKey as keyof ConversationMemoryMap]?.memoryValue?.trim();
  return fromMemory || null;
}

function buildDepartureLabel(
  qualification: LeadQualificationSnapshot | null | undefined,
  memory: ConversationMemoryMap | null | undefined,
): string | null {
  const month = pickFieldValue(qualification, memory, "departure_month", "departure_month");
  const date = pickFieldValue(qualification, memory, "departure_date", "departure_date");

  return month || date || null;
}

function hasQualificationData(
  qualification: LeadQualificationSnapshot | null | undefined,
): boolean {
  if (!qualification) {
    return false;
  }

  return qualification.fieldProgress.some((field) => field.completed);
}

function resolveAiConfidence(
  aiActivityEvents: WhatsappAiAuditEvent[] | null | undefined,
  memory: ConversationMemoryMap | null | undefined,
): number | null {
  const handoffEvent = aiActivityEvents?.find(
    (event) => event.eventType === "AI_HANDOFF_TRIGGERED",
  );
  if (handoffEvent?.confidence != null) {
    return handoffEvent.confidence;
  }

  const intentEvent = aiActivityEvents?.find(
    (event) => event.eventType === "AI_INTENT_CLASSIFIED",
  );
  if (intentEvent?.confidence != null) {
    return intentEvent.confidence;
  }

  const memoryEntries = Object.values(memory ?? {});
  if (memoryEntries.length === 0) {
    return null;
  }

  const total = memoryEntries.reduce((sum, entry) => sum + entry.confidence, 0);
  return total / memoryEntries.length;
}

function getLastCustomerMessage(messages: MessageRow[]): string | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.direction !== "incoming") {
      continue;
    }

    const text = message.message_text?.trim();
    if (text) {
      return text;
    }
  }

  return null;
}

function buildGeneratedSummary(
  qualification: LeadQualificationSnapshot | null | undefined,
  memory: ConversationMemoryMap | null | undefined,
): string | null {
  const destination = pickFieldValue(qualification, memory, "destination", "destination");
  const departure = buildDepartureLabel(qualification, memory);
  const passengerCount = pickFieldValue(
    qualification,
    memory,
    "passenger_count",
    "passenger_count",
  );
  const budget = pickFieldValue(qualification, memory, "budget", "budget");
  const tripType = pickFieldValue(qualification, memory, "trip_type", "trip_type");

  const detailParts: string[] = [];

  if (destination) {
    detailParts.push(`paket ${destination}`);
  }

  if (departure) {
    detailParts.push(`untuk ${departure}`);
  }

  if (passengerCount) {
    detailParts.push(`${passengerCount} orang`);
  }

  if (budget) {
    detailParts.push(`budget sekitar ${budget}`);
  }

  if (tripType) {
    detailParts.push(`preferensi ${tripType}`);
  }

  if (detailParts.length === 0) {
    return null;
  }

  const completionScore = qualification?.completionScore ?? 0;
  const closing =
    completionScore >= 100
      ? "AI sudah mengumpulkan data utama dan menyarankan sales takeover untuk penawaran final."
      : "AI sudah mengumpulkan sebagian data utama dan menyarankan sales takeover.";

  return `Customer tertarik ${detailParts.join(", ")}. ${closing}`;
}

export function buildSalesTakeoverSummary(input: {
  handoffReason?: string | null;
  leadQualification?: LeadQualificationSnapshot | null;
  conversationMemory?: ConversationMemoryMap | null;
  aiActivityEvents?: WhatsappAiAuditEvent[] | null;
  messages: MessageRow[];
}): SalesTakeoverSummaryModel {
  const qualification = input.leadQualification ?? null;
  const memory = input.conversationMemory ?? null;

  return {
    handoffReason: input.handoffReason?.trim() || null,
    destination: pickFieldValue(qualification, memory, "destination", "destination"),
    departure: buildDepartureLabel(qualification, memory),
    passengerCount: pickFieldValue(
      qualification,
      memory,
      "passenger_count",
      "passenger_count",
    ),
    budget: pickFieldValue(qualification, memory, "budget", "budget"),
    tripType: pickFieldValue(qualification, memory, "trip_type", "trip_type"),
    specialRequest: pickFieldValue(
      qualification,
      memory,
      "special_request",
      "special_request",
    ),
    completionScore: qualification?.completionScore ?? null,
    aiConfidence: resolveAiConfidence(input.aiActivityEvents, memory),
    lastCustomerMessage: getLastCustomerMessage(input.messages),
    generatedSummary: buildGeneratedSummary(qualification, memory),
    hasQualificationData: hasQualificationData(qualification),
  };
}

export function formatSalesTakeoverConfidence(
  confidence: number | null | undefined,
): string | null {
  if (confidence == null || Number.isNaN(confidence)) {
    return null;
  }

  const normalized = confidence > 1 ? confidence : confidence * 100;
  return `${Math.round(normalized)}%`;
}
