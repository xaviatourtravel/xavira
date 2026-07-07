export const FAQ_IMPORT_FIELD_KEYS = [
  "QUESTION",
  "TRIGGER_PHRASES",
  "ANSWER",
  "NEXT_STEP",
] as const;

export type FaqImportFieldKey = (typeof FAQ_IMPORT_FIELD_KEYS)[number];

export const FAQ_IMPORT_METADATA_KEYS = ["FAQ_ID", "PRODUCT_ID"] as const;
export type FaqImportMetadataKey = (typeof FAQ_IMPORT_METADATA_KEYS)[number];

export const FAQ_IMPORT_FIELD_ALIASES: Record<
  FaqImportFieldKey,
  readonly string[]
> = {
  QUESTION: ["Question", "Q", "Pertanyaan"],
  TRIGGER_PHRASES: [
    "Trigger Phrases",
    "Trigger Phrase",
    "Trigger",
    "Triggers",
    "Frasa Pemicu",
    "Frase Pemicu",
    "Pemicu",
  ],
  ANSWER: ["Answer", "A", "Jawaban"],
  NEXT_STEP: [
    "Next Step",
    "Next Steps",
    "Langkah Berikutnya",
    "Langkah Selanjutnya",
    "Follow Up",
    "Follow-Up",
  ],
};

export const FAQ_IMPORT_METADATA_ALIASES: Record<
  FaqImportMetadataKey,
  readonly string[]
> = {
  FAQ_ID: ["Faq Id", "FAQ ID", "Faq ID"],
  PRODUCT_ID: ["Product Id", "PRODUCT ID", "Product ID"],
};

const FIELD_ALIAS_TO_CANONICAL = new Map<string, FaqImportFieldKey>();
const METADATA_ALIAS_TO_CANONICAL = new Map<string, FaqImportMetadataKey>();

for (const canonical of FAQ_IMPORT_FIELD_KEYS) {
  FIELD_ALIAS_TO_CANONICAL.set(normalizeFaqFieldKey(canonical), canonical);
  for (const alias of FAQ_IMPORT_FIELD_ALIASES[canonical]) {
    FIELD_ALIAS_TO_CANONICAL.set(normalizeFaqFieldKey(alias), canonical);
  }
}

for (const canonical of FAQ_IMPORT_METADATA_KEYS) {
  METADATA_ALIAS_TO_CANONICAL.set(normalizeFaqFieldKey(canonical), canonical);
  for (const alias of FAQ_IMPORT_METADATA_ALIASES[canonical]) {
    METADATA_ALIAS_TO_CANONICAL.set(normalizeFaqFieldKey(alias), canonical);
  }
}

export function normalizeFaqFieldKey(raw: string): string {
  return raw
    .trim()
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")
    .toUpperCase();
}

export function resolveFaqFieldKey(rawKey: string): FaqImportFieldKey | null {
  const normalized = normalizeFaqFieldKey(rawKey);
  if (!normalized) return null;
  return FIELD_ALIAS_TO_CANONICAL.get(normalized) ?? null;
}

export function resolveFaqMetadataKey(rawKey: string): FaqImportMetadataKey | null {
  const normalized = normalizeFaqFieldKey(rawKey);
  if (!normalized) return null;
  return METADATA_ALIAS_TO_CANONICAL.get(normalized) ?? null;
}


export function splitFaqFieldLine(line: string): {
  rawKey: string;
  inlineValue: string;
} | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const separatorMatch = trimmed.match(/^(.+?)\s*(::|=>|->|=|:|\s-\s)\s*(.*)$/);
  if (separatorMatch) {
    return {
      rawKey: separatorMatch[1].trim(),
      inlineValue: separatorMatch[3].trim(),
    };
  }

  if (resolveFaqFieldKey(trimmed) || resolveFaqMetadataKey(trimmed)) {
    return { rawKey: trimmed, inlineValue: "" };
  }

  return null;
}

export function parseFaqMetadataLine(line: string): {
  key: FaqImportMetadataKey;
  value: string;
} | null {
  const parsed = splitFaqFieldLine(line);
  if (!parsed) return null;

  const key = resolveFaqMetadataKey(parsed.rawKey);
  if (!key) return null;

  return { key, value: parsed.inlineValue };
}

export function parseFaqFieldLine(line: string): {
  key: FaqImportFieldKey;
  inlineValue: string;
} | null {
  const parsed = splitFaqFieldLine(line);
  if (!parsed) return null;

  const key = resolveFaqFieldKey(parsed.rawKey);
  if (!key) return null;

  return { key, inlineValue: parsed.inlineValue };
}

export const FAQ_HEADER_PATTERN = /^FAQ\s*#?\s*0*(\d+)\s*$/i;
export const FAQ_SECTION_SEPARATOR_PATTERN = /^-{3,}\s*$/;

export function isFaqHeaderLine(line: string): boolean {
  return FAQ_HEADER_PATTERN.test(line.trim());
}

export function isFaqSectionSeparatorLine(line: string): boolean {
  return FAQ_SECTION_SEPARATOR_PATTERN.test(line.trim());
}

export function isFaqSectionStartLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (isFaqHeaderLine(trimmed)) return true;
  return parseFaqMetadataLine(trimmed)?.key === "FAQ_ID";
}

export function isFaqBlockBoundaryLine(
  line: string,
  draftHasQuestionAndAnswer: boolean,
): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (isFaqHeaderLine(trimmed)) return true;
  if (parseFaqMetadataLine(trimmed)?.key === "FAQ_ID") return true;

  if (draftHasQuestionAndAnswer) {
    const field = parseFaqFieldLine(trimmed);
    if (field?.key === "QUESTION") return true;
  }

  return false;
}

export function extractFaqHeaderId(line: string): string | undefined {
  const match = line.trim().match(FAQ_HEADER_PATTERN);
  if (!match?.[1]) return undefined;
  return match[1].replace(/^0+/, "") || match[1];
}

export function isFaqFieldKeyLine(line: string): boolean {
  return parseFaqFieldLine(line) !== null;
}
