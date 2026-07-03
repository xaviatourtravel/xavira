export const QUALIFICATION_STATUSES = [
  "NEW",
  "QUALIFYING",
  "QUALIFIED",
  "HANDOVER_READY",
  "CLOSED",
] as const;

export type QualificationStatus = (typeof QUALIFICATION_STATUSES)[number];

export const LEAD_QUALIFICATION_FIELD_KEYS = [
  "destination",
  "departure",
  "passenger_count",
  "budget",
  "trip_type",
  "special_request",
] as const;

export type LeadQualificationFieldKey = (typeof LEAD_QUALIFICATION_FIELD_KEYS)[number];

export type LeadQualificationFieldValues = {
  destination: string | null;
  departure_month: string | null;
  departure_date: string | null;
  passenger_count: string | null;
  budget: string | null;
  trip_type: string | null;
  special_request: string | null;
};

export type LeadQualificationFieldProgress = {
  key: LeadQualificationFieldKey;
  label: string;
  completed: boolean;
  value: string | null;
  weight: number;
};

export type LeadQualificationSnapshot = {
  completionScore: number;
  qualificationStatus: QualificationStatus;
  missingFields: LeadQualificationFieldKey[];
  nextMissingField: LeadQualificationFieldKey | null;
  nextQuestion: string | null;
  fieldProgress: LeadQualificationFieldProgress[];
  fields: LeadQualificationFieldValues;
  lastAiQuestion: string | null;
};

export type LeadQualificationRecord = LeadQualificationFieldValues & {
  id: string;
  workspaceId: string;
  conversationId: string;
  customerId: string | null;
  completionScore: number;
  qualificationStatus: QualificationStatus;
  lastAiQuestion: string | null;
  createdAt: string;
  updatedAt: string;
};

export const LEAD_QUALIFICATION_FIELD_RULES: Array<{
  key: LeadQualificationFieldKey;
  label: string;
  weight: number;
  question: string;
  isComplete: (fields: LeadQualificationFieldValues) => boolean;
  getValue: (fields: LeadQualificationFieldValues) => string | null;
}> = [
  {
    key: "destination",
    label: "Destination",
    weight: 20,
    question: "Kakak tertarik ke destinasi mana ya?",
    isComplete: (fields) => Boolean(fields.destination?.trim()),
    getValue: (fields) => fields.destination?.trim() || null,
  },
  {
    key: "departure",
    label: "Departure",
    weight: 20,
    question: "Kakak rencana berangkat bulan apa?",
    isComplete: (fields) =>
      Boolean(fields.departure_month?.trim() || fields.departure_date?.trim()),
    getValue: (fields) =>
      fields.departure_month?.trim() || fields.departure_date?.trim() || null,
  },
  {
    key: "passenger_count",
    label: "Passengers",
    weight: 20,
    question: "Kakak berangkat berapa orang?",
    isComplete: (fields) => Boolean(fields.passenger_count?.trim()),
    getValue: (fields) => fields.passenger_count?.trim() || null,
  },
  {
    key: "budget",
    label: "Budget",
    weight: 20,
    question: "Boleh tahu kisaran budget yang disiapkan Kak?",
    isComplete: (fields) => Boolean(fields.budget?.trim()),
    getValue: (fields) => fields.budget?.trim() || null,
  },
  {
    key: "trip_type",
    label: "Trip Type",
    weight: 10,
    question: "Kakak lebih prefer private trip atau group tour?",
    isComplete: (fields) => Boolean(fields.trip_type?.trim()),
    getValue: (fields) => fields.trip_type?.trim() || null,
  },
  {
    key: "special_request",
    label: "Special Request",
    weight: 10,
    question: "Ada kebutuhan khusus yang perlu kami siapkan?",
    isComplete: (fields) => Boolean(fields.special_request?.trim()),
    getValue: (fields) => fields.special_request?.trim() || null,
  },
];

export function deriveQualificationStatus(score: number): QualificationStatus {
  if (score <= 0) return "NEW";
  if (score < 80) return "QUALIFYING";
  if (score < 100) return "QUALIFIED";
  return "HANDOVER_READY";
}

export const QUALIFICATION_HANDOFF_REASON = "Lead qualification complete";

export const QUALIFICATION_HANDOFF_MESSAGE =
  "Baik Kak, datanya sudah cukup jelas. Tim kami akan segera bantu lanjutkan penawaran terbaiknya ya.";

export function isQualificationHandoffReason(
  reason: string | null | undefined,
): boolean {
  return reason?.trim() === QUALIFICATION_HANDOFF_REASON;
}

export function getQualificationCollectedFields(
  snapshot: LeadQualificationSnapshot,
): Record<string, string> {
  const collected: Record<string, string> = {};

  for (const field of snapshot.fieldProgress) {
    if (field.value?.trim()) {
      collected[field.key] = field.value.trim();
    }
  }

  return collected;
}
