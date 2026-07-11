import type { ConversationMemoryMap } from "@/modules/ai/types/memory";
import type { LeadQualificationSnapshot } from "@/modules/ai/types/lead-qualification";
import type {
  CollectedInformationKey,
  CollectedInformationMap,
  CollectedInformationEntry,
  QuestionSemanticKey,
} from "@/modules/ai/conversation-state/types";
import { MAX_COLLECTED_INFORMATION_ENTRIES } from "@/modules/ai/conversation-state/types";

const MEMORY_TO_COLLECTED_KEY: Partial<
  Record<string, CollectedInformationKey>
> = {
  destination: "requestedService",
  departure_month: "preferredDate",
  departure_date: "preferredDate",
  passenger_count: "participantCount",
  budget: "budgetRange",
  trip_type: "scope",
  private_or_group: "scope",
  special_request: "notes",
  customer_language: "contactPreference",
};

const QUALIFICATION_TO_QUESTION_KEY: Record<string, QuestionSemanticKey> = {
  destination: "requested_service",
  departure: "preferred_date",
  passenger_count: "participant_count",
  budget: "budget_range",
  trip_type: "scope",
  special_request: "notes",
};

export function mergeCollectedInformation(
  existing: CollectedInformationMap,
  incoming: CollectedInformationMap,
): CollectedInformationMap {
  const merged: CollectedInformationMap = { ...existing };

  for (const [key, entry] of Object.entries(incoming) as Array<
    [CollectedInformationKey, CollectedInformationEntry]
  >) {
    const value = entry.value?.trim();
    if (!value) continue;

    const previous = merged[key];
    if (previous?.value?.trim() && !value) {
      continue;
    }

    merged[key] = entry;
  }

  const keys = Object.keys(merged) as CollectedInformationKey[];
  if (keys.length <= MAX_COLLECTED_INFORMATION_ENTRIES) {
    return merged;
  }

  const trimmed: CollectedInformationMap = {};
  for (const key of keys.slice(-MAX_COLLECTED_INFORMATION_ENTRIES)) {
    trimmed[key] = merged[key];
  }

  return trimmed;
}

export function buildCollectedInformationFromMemory(
  memory: ConversationMemoryMap,
  sourceMessageId: string | null,
  now = new Date(),
): CollectedInformationMap {
  const collected: CollectedInformationMap = {};
  const updatedAt = now.toISOString();

  for (const [memoryKey, entry] of Object.entries(memory)) {
    const mappedKey = MEMORY_TO_COLLECTED_KEY[memoryKey];
    const value = entry?.memoryValue?.trim();
    if (!mappedKey || !value) continue;

    collected[mappedKey] = {
      value,
      sourceMessageId,
      updatedAt,
    };
  }

  return collected;
}

export function listCollectedInformationKeys(
  collected: CollectedInformationMap,
): CollectedInformationKey[] {
  return (Object.keys(collected) as CollectedInformationKey[]).filter((key) =>
    Boolean(collected[key]?.value?.trim()),
  );
}

export function resolveAnsweredQuestionKeys(input: {
  collectedInformation: CollectedInformationMap;
  qualification?: LeadQualificationSnapshot | null;
}): QuestionSemanticKey[] {
  const answered = new Set<QuestionSemanticKey>();

  if (input.collectedInformation.requestedService?.value) {
    answered.add("requested_service");
  }
  if (input.collectedInformation.preferredDate?.value) {
    answered.add("preferred_date");
  }
  if (input.collectedInformation.participantCount?.value) {
    answered.add("participant_count");
  }
  if (input.collectedInformation.budgetRange?.value) {
    answered.add("budget_range");
  }
  if (input.collectedInformation.scope?.value) {
    answered.add("scope");
  }
  if (input.collectedInformation.location?.value) {
    answered.add("location");
  }
  if (input.collectedInformation.notes?.value) {
    answered.add("notes");
  }

  if (input.qualification) {
    for (const field of input.qualification.fieldProgress) {
      if (!field.completed) continue;
      const semantic = QUALIFICATION_TO_QUESTION_KEY[field.key];
      if (semantic) {
        answered.add(semantic);
      }
    }
  }

  return [...answered];
}

export function resolveUnansweredQuestionKeys(input: {
  answeredQuestionKeys: QuestionSemanticKey[];
  questionsAsked: QuestionSemanticKey[];
  qualification?: LeadQualificationSnapshot | null;
}): QuestionSemanticKey[] {
  const unanswered = new Set<QuestionSemanticKey>();
  const answered = new Set(input.answeredQuestionKeys);

  if (input.qualification?.nextMissingField) {
    const semantic = QUALIFICATION_TO_QUESTION_KEY[input.qualification.nextMissingField];
    if (semantic && !answered.has(semantic)) {
      unanswered.add(semantic);
    }
  }

  for (const key of input.questionsAsked) {
    if (!answered.has(key)) {
      unanswered.add(key);
    }
  }

  return [...unanswered];
}

export function mapQualificationFieldToQuestionKey(
  fieldKey: string,
): QuestionSemanticKey | null {
  return QUALIFICATION_TO_QUESTION_KEY[fieldKey] ?? null;
}

export function inferQuestionKeysFromReply(reply: string): QuestionSemanticKey[] {
  const normalized = reply.toLowerCase();
  const keys: QuestionSemanticKey[] = [];

  if (/(destinasi|destination|paket|layanan|service)/i.test(normalized)) {
    keys.push("requested_service");
  }
  if (/(bulan|tanggal|jadwal|schedule|when|date)/i.test(normalized)) {
    keys.push("preferred_date");
  }
  if (/(berapa\s+orang|participant|pax|jumlah)/i.test(normalized)) {
    keys.push("participant_count");
  }
  if (/(budget|anggaran|harga|price)/i.test(normalized)) {
    keys.push("budget_range");
  }
  if (/(lokasi|location|kota)/i.test(normalized)) {
    keys.push("location");
  }

  return keys;
}
