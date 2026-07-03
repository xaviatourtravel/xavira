import type { ConversationMemoryMap } from "@/modules/ai/types/memory";
import { MEMORY_KEY_LABELS } from "@/modules/ai/types/memory";
import type { LeadQualificationSnapshot } from "@/modules/ai/types/lead-qualification";
import { LEAD_QUALIFICATION_FIELD_RULES } from "@/modules/ai/types/lead-qualification";
import type { WhatsappAiAuditEvent } from "@/lib/whatsapp-inbox/ai/activity-events";
import { resolveWhatsappAiState } from "@/lib/whatsapp-inbox/ai/constants";
import type { MessageRow } from "@/types/omnichannel-inbox";
import type { WhatsappAiState } from "@/types/whatsapp-inbox";

export type CommandCenterMemoryField = {
  key: string;
  label: string;
  value: string | null;
};

export type CommandCenterNextAction = {
  id: "ask_budget" | "send_brochure" | "recommend_package" | "handover" | "take_over";
  label: string;
  description: string;
};

export type CommandCenterStats = {
  customerSince: string | null;
  replyTimeLabel: string | null;
  aiMessageCount: number;
  humanMessageCount: number;
  lastAiReplyAt: string | null;
};

export type RecommendedDocumentItem = {
  id: string;
  name: string;
  documentType: string;
  previewUrl: string | null;
};

const MEMORY_DISPLAY_KEYS = [
  "destination",
  "departure_month",
  "departure_date",
  "passenger_count",
  "budget",
  "trip_type",
  "special_request",
  "customer_language",
] as const;

function pickValue(
  qualification: LeadQualificationSnapshot | null | undefined,
  memory: ConversationMemoryMap | null | undefined,
  qualificationKey: keyof LeadQualificationSnapshot["fields"],
  memoryKey: keyof ConversationMemoryMap,
): string | null {
  const fromQualification = qualification?.fields[qualificationKey]?.trim();
  if (fromQualification) return fromQualification;
  return memory?.[memoryKey]?.memoryValue?.trim() || null;
}

function buildDeparture(
  qualification: LeadQualificationSnapshot | null | undefined,
  memory: ConversationMemoryMap | null | undefined,
): string | null {
  return (
    pickValue(qualification, memory, "departure_month", "departure_month") ||
    pickValue(qualification, memory, "departure_date", "departure_date")
  );
}

export function buildCommandCenterMemoryFields(
  memory: ConversationMemoryMap | null | undefined,
): CommandCenterMemoryField[] {
  const fields: CommandCenterMemoryField[] = [];

  for (const key of MEMORY_DISPLAY_KEYS) {
    if (key === "departure_date") {
      const month = memory?.departure_month?.memoryValue?.trim();
      if (month) continue;
    }

    const label =
      key === "departure_month" || key === "departure_date"
        ? "Departure"
        : key === "customer_language"
          ? "Language"
          : MEMORY_KEY_LABELS[key];

    const value = memory?.[key]?.memoryValue?.trim() || null;

    if (key === "departure_month") {
      const date = memory?.departure_date?.memoryValue?.trim();
      fields.push({
        key: "departure",
        label: "Departure",
        value: monthValue(memory) || date || null,
      });
      continue;
    }

    if (key === "departure_date") continue;

    fields.push({ key, label, value });
  }

  return fields;
}

function monthValue(memory: ConversationMemoryMap | null | undefined) {
  return memory?.departure_month?.memoryValue?.trim() || null;
}

export function getMemoryLastUpdated(
  memory: ConversationMemoryMap | null | undefined,
): string | null {
  const entries = Object.values(memory ?? {});
  if (entries.length === 0) return null;

  let latest: string | null = null;
  for (const entry of entries) {
    if (!latest || Date.parse(entry.updatedAt) > Date.parse(latest)) {
      latest = entry.updatedAt;
    }
  }
  return latest;
}

export function buildCommandCenterSummaryLines(input: {
  leadQualification?: LeadQualificationSnapshot | null;
  conversationMemory?: ConversationMemoryMap | null;
}): string[] {
  const qualification = input.leadQualification;
  const memory = input.conversationMemory;
  const lines: string[] = [];

  const destination = pickValue(qualification, memory, "destination", "destination");
  const departure = buildDeparture(qualification, memory);
  const passengers = pickValue(qualification, memory, "passenger_count", "passenger_count");
  const budget = pickValue(qualification, memory, "budget", "budget");
  const tripType = pickValue(qualification, memory, "trip_type", "trip_type");
  const specialRequest = pickValue(
    qualification,
    memory,
    "special_request",
    "special_request",
  );

  if (destination) {
    lines.push(`Customer is interested in ${destination}.`);
  }
  if (departure) {
    lines.push(`Departure planned for ${departure}.`);
  }
  if (passengers) {
    lines.push(`${passengers} passengers.`);
  }
  if (budget) {
    lines.push(`Budget around ${budget}.`);
  } else if (destination || departure || passengers) {
    lines.push("Budget not collected yet.");
  }
  if (tripType) {
    lines.push(`Trip type: ${tripType}.`);
  }
  if (specialRequest) {
    lines.push(`Special request: ${specialRequest}.`);
  }

  return lines;
}

export function buildCommandCenterNextAction(input: {
  aiState?: string | null;
  leadQualification?: LeadQualificationSnapshot | null;
  conversationMemory?: ConversationMemoryMap | null;
}): CommandCenterNextAction {
  const state = resolveWhatsappAiState(input.aiState);
  const qualification = input.leadQualification;
  const memory = input.conversationMemory;

  if (state === "READY_FOR_HUMAN") {
    return {
      id: "take_over",
      label: "Take Over",
      description: "Lead is ready. Take ownership and continue the offer.",
    };
  }

  if (qualification?.qualificationStatus === "HANDOVER_READY") {
    return {
      id: "handover",
      label: "Handover",
      description: "Qualification is complete. Hand over to sales.",
    };
  }

  const budget = pickValue(qualification, memory, "budget", "budget");
  const destination = pickValue(qualification, memory, "destination", "destination");
  const passengers = pickValue(qualification, memory, "passenger_count", "passenger_count");

  if (destination && !budget) {
    return {
      id: "ask_budget",
      label: "Ask Budget",
      description: "Budget is still missing for a complete qualification.",
    };
  }

  if (destination && budget && passengers) {
    return {
      id: "recommend_package",
      label: "Recommend Package",
      description: "Core details are ready. Suggest the best package fit.",
    };
  }

  if (destination) {
    return {
      id: "send_brochure",
      label: "Send Brochure",
      description: "Share destination materials to keep the customer engaged.",
    };
  }

  const nextMissing = qualification?.nextMissingField;
  const nextRule = LEAD_QUALIFICATION_FIELD_RULES.find(
    (rule) => rule.key === nextMissing,
  );

  if (nextRule?.key === "budget") {
    return {
      id: "ask_budget",
      label: "Ask Budget",
      description: "Budget is still missing for a complete qualification.",
    };
  }

  return {
    id: "send_brochure",
    label: "Send Brochure",
    description: "Share company or package materials to start the conversation.",
  };
}

export function buildCommandCenterStats(input: {
  createdAt?: string | null;
  messages: MessageRow[];
  aiActivityEvents?: WhatsappAiAuditEvent[] | null;
}): CommandCenterStats {
  const messages = input.messages ?? [];
  let aiMessageCount = 0;
  let humanMessageCount = 0;
  let lastAiReplyAt: string | null = null;
  let lastIncomingAt: string | null = null;
  let firstOutgoingAfterIncoming: string | null = null;

  for (const message of messages) {
    if (message.direction === "incoming") {
      lastIncomingAt = message.created_at;
      firstOutgoingAfterIncoming = null;
      continue;
    }

    const isAi =
      message.senderType === "ai" ||
      (message.senderType == null && !message.sent_by_user_id);

    if (isAi) {
      aiMessageCount += 1;
      lastAiReplyAt = message.created_at;
    } else {
      humanMessageCount += 1;
    }

    if (lastIncomingAt && !firstOutgoingAfterIncoming) {
      firstOutgoingAfterIncoming = message.created_at;
    }
  }

  const replyEvents = (input.aiActivityEvents ?? []).filter(
    (event) =>
      event.eventType === "AI_REPLY_SENT" ||
      event.eventType === "AI_LLM_REPLY_SENT",
  );
  if (replyEvents.length > 0) {
    const latestReply = replyEvents[0];
    if (!lastAiReplyAt || Date.parse(latestReply.timestamp) > Date.parse(lastAiReplyAt)) {
      lastAiReplyAt = latestReply.timestamp;
    }
  }

  let replyTimeLabel: string | null = null;
  if (lastIncomingAt && firstOutgoingAfterIncoming) {
    const deltaMs =
      Date.parse(firstOutgoingAfterIncoming) - Date.parse(lastIncomingAt);
    if (deltaMs >= 0) {
      replyTimeLabel = formatDuration(deltaMs);
    }
  }

  return {
    customerSince: input.createdAt ?? null,
    replyTimeLabel,
    aiMessageCount,
    humanMessageCount,
    lastAiReplyAt,
  };
}

function formatDuration(ms: number) {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

export function formatCommandCenterActivityLabel(event: WhatsappAiAuditEvent): string {
  switch (event.eventType) {
    case "AI_REPLY_SENT":
    case "AI_LLM_REPLY_SENT":
      return "AI replied";
    case "MEMORY_CREATED":
    case "MEMORY_UPDATED":
    case "MEMORY_EXTRACTION_COMPLETED":
      return "Memory updated";
    case "LEAD_QUALIFICATION_UPDATED":
      return "Lead qualified";
    case "AI_DOCUMENT_SENT":
      return "Document sent";
    case "AI_HANDOFF_TRIGGERED":
    case "AI_LLM_HANDOFF":
      return "Handover";
    case "AI_STATE_CHANGED":
      return "AI state changed";
    default:
      return event.label;
  }
}

export const COMMAND_CENTER_ACTIVITY_TYPES = new Set([
  "AI_REPLY_SENT",
  "AI_LLM_REPLY_SENT",
  "MEMORY_CREATED",
  "MEMORY_UPDATED",
  "MEMORY_EXTRACTION_COMPLETED",
  "LEAD_QUALIFICATION_UPDATED",
  "AI_DOCUMENT_SENT",
  "AI_HANDOFF_TRIGGERED",
  "AI_LLM_HANDOFF",
  "AI_STATE_CHANGED",
]);

export function filterCommandCenterActivity(
  events: WhatsappAiAuditEvent[] | null | undefined,
  limit = 5,
): WhatsappAiAuditEvent[] {
  return (events ?? [])
    .filter((event) => COMMAND_CENTER_ACTIVITY_TYPES.has(event.eventType))
    .slice(0, limit);
}

export function getQualificationFieldRows(
  qualification: LeadQualificationSnapshot | null | undefined,
) {
  if (!qualification) {
    return LEAD_QUALIFICATION_FIELD_RULES.map((rule) => ({
      key: rule.key,
      label: rule.label === "Passengers" ? "Passenger Count" : rule.label,
      completed: false,
      value: null as string | null,
    }));
  }

  return qualification.fieldProgress.map((field) => ({
    key: field.key,
    label: field.label === "Passengers" ? "Passenger Count" : field.label,
    completed: field.completed,
    value: field.value,
  }));
}

export type { WhatsappAiState };
