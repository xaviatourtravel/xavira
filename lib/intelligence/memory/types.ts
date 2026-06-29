export const MEMORY_DIMENSIONS = [
  "identity",
  "travel_preference",
  "purchase_preference",
  "relationship",
  "objection",
  "history",
] as const;

export type MemoryDimension = (typeof MEMORY_DIMENSIONS)[number];

export type MemorySlice = {
  dimension: MemoryDimension;
  label: string;
  content: string | null;
  confidence: import("@/lib/intelligence/types/common").ConfidenceLevel;
};

export type CustomerMemory = {
  slices: MemorySlice[];
  updatedAt: string;
};

export const MEMORY_DIMENSION_LABELS: Record<MemoryDimension, string> = {
  identity: "Identity",
  travel_preference: "Travel Preference",
  purchase_preference: "Purchase Preference",
  relationship: "Relationship",
  objection: "Objection",
  history: "History",
};
