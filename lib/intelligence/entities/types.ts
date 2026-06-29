export const EXTRACTED_ENTITY_FIELDS = [
  "name",
  "destination",
  "departure",
  "pax",
  "budget",
  "city",
  "phone",
  "email",
] as const;

export type ExtractedEntityField = (typeof EXTRACTED_ENTITY_FIELDS)[number];

export type EntityField = {
  field: ExtractedEntityField;
  label: string;
  value: string | null;
  confidence: import("@/lib/intelligence/types/common").ConfidenceLevel;
};

export type ExtractedEntities = {
  fields: EntityField[];
};

export const ENTITY_FIELD_LABELS: Record<ExtractedEntityField, string> = {
  name: "Name",
  destination: "Destination",
  departure: "Departure",
  pax: "Pax",
  budget: "Budget",
  city: "City",
  phone: "Phone",
  email: "Email",
};
