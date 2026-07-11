import type { BrainPublishSection } from "@/modules/business-brain/types/publish";

const METADATA_FIELDS = new Set([
  "created_at",
  "updated_at",
  "business_brain_id",
  "capturedAt",
]);

export type CanonicalEntityRecord = Record<string, unknown>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeEntityStatus(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  if (value === "archived") {
    return "archived";
  }

  if (value === "draft" || value === "published") {
    return "active";
  }

  return value;
}

export function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }

  if (!isPlainObject(value)) {
    return value === undefined ? null : value;
  }

  const sortedEntries = Object.keys(value)
    .sort()
    .map((key) => [key, sortKeysDeep(value[key])] as const);

  return Object.fromEntries(sortedEntries);
}

function stripFields(
  record: Record<string, unknown>,
  fields: Set<string>,
): CanonicalEntityRecord {
  const next: CanonicalEntityRecord = {};

  for (const [key, value] of Object.entries(record)) {
    if (fields.has(key)) {
      continue;
    }
    next[key] = value;
  }

  return next;
}

function canonicalizeArrayField(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }

  const normalized = value.map((item) => sortKeysDeep(item));
  if (normalized.every((item) => typeof item === "string")) {
    return [...(normalized as string[])].sort((left, right) => left.localeCompare(right));
  }

  return normalized;
}

export function canonicalizeCompanyDna(
  record: Record<string, unknown> | null,
): CanonicalEntityRecord | null {
  if (!record) {
    return null;
  }

  const stripped = stripFields(record, METADATA_FIELDS);
  return sortKeysDeep(stripped) as CanonicalEntityRecord;
}

export function canonicalizeProduct(record: Record<string, unknown>): CanonicalEntityRecord {
  const stripped = stripFields(record, METADATA_FIELDS);
  const next: CanonicalEntityRecord = { ...stripped };

  if ("status" in next) {
    next.status = normalizeEntityStatus(next.status);
  }

  if ("highlights" in next) {
    next.highlights = canonicalizeArrayField(next.highlights);
  }
  if ("pricing" in next) {
    next.pricing = canonicalizeArrayField(next.pricing);
  }
  if ("departures" in next) {
    next.departures = canonicalizeArrayField(next.departures);
  }
  if ("included" in next) {
    next.included = canonicalizeArrayField(next.included);
  }
  if ("excluded" in next) {
    next.excluded = canonicalizeArrayField(next.excluded);
  }

  return sortKeysDeep(next) as CanonicalEntityRecord;
}

export function canonicalizeKnowledge(record: Record<string, unknown>): CanonicalEntityRecord {
  const stripped = stripFields(record, METADATA_FIELDS);
  const next: CanonicalEntityRecord = { ...stripped };

  if ("status" in next) {
    next.status = normalizeEntityStatus(next.status);
  }

  if ("keywords" in next) {
    next.keywords = canonicalizeArrayField(next.keywords);
  }

  return sortKeysDeep(next) as CanonicalEntityRecord;
}

export function canonicalizeDocument(record: Record<string, unknown>): CanonicalEntityRecord {
  const stripped = stripFields(record, METADATA_FIELDS);
  const next: CanonicalEntityRecord = { ...stripped };

  if ("status" in next) {
    next.status = normalizeEntityStatus(next.status);
  }

  if ("tags" in next) {
    next.tags = canonicalizeArrayField(next.tags);
  }

  return sortKeysDeep(next) as CanonicalEntityRecord;
}

export function canonicalizeBehavior(record: Record<string, unknown>): CanonicalEntityRecord {
  const stripped = stripFields(record, METADATA_FIELDS);
  const next: CanonicalEntityRecord = { ...stripped };

  if ("config" in next && isPlainObject(next.config)) {
    next.config = sortKeysDeep(next.config);
  }

  return sortKeysDeep(next) as CanonicalEntityRecord;
}

export function sortEntitiesById<T extends Record<string, unknown>>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    const leftId = typeof left.id === "string" ? left.id : "";
    const rightId = typeof right.id === "string" ? right.id : "";
    return leftId.localeCompare(rightId);
  });
}

export function stableCanonicalString(value: unknown): string {
  return JSON.stringify(sortKeysDeep(value));
}

export function entityDisplayName(
  section: BrainPublishSection,
  record: Record<string, unknown>,
): string {
  switch (section) {
    case "companyDna":
      return (
        (typeof record.company_name === "string" && record.company_name.trim()) ||
        (typeof record.companyName === "string" && record.companyName.trim()) ||
        "Company Identity"
      );
    case "products":
      return (typeof record.name === "string" && record.name.trim()) || "Unnamed Product";
    case "knowledge":
      return (typeof record.title === "string" && record.title.trim()) || "Unnamed Knowledge";
    case "documents":
      return (typeof record.name === "string" && record.name.trim()) || "Unnamed Document";
    case "behaviors":
      return (typeof record.name === "string" && record.name.trim()) || "Unnamed Rule";
    default:
      return "Unnamed Item";
  }
}

export function isEntityArchived(record: Record<string, unknown>): boolean {
  return record.status === "archived";
}

export function isEntityActiveForLiveContext(record: Record<string, unknown>): boolean {
  const status = typeof record.status === "string" ? record.status : "active";
  return status !== "archived";
}

export function canonicalizeEntityForSection(
  section: BrainPublishSection,
  record: Record<string, unknown>,
): CanonicalEntityRecord {
  switch (section) {
    case "companyDna":
      return canonicalizeCompanyDna(record) ?? {};
    case "products":
      return canonicalizeProduct(record);
    case "knowledge":
      return canonicalizeKnowledge(record);
    case "documents":
      return canonicalizeDocument(record);
    case "behaviors":
      return canonicalizeBehavior(record);
    default:
      return sortKeysDeep(stripFields(record, METADATA_FIELDS)) as CanonicalEntityRecord;
  }
}

export function canonicalizeEntityListForSection(
  section: BrainPublishSection,
  records: Array<Record<string, unknown>>,
): CanonicalEntityRecord[] {
  return sortEntitiesById(records).map((record) => canonicalizeEntityForSection(section, record));
}
