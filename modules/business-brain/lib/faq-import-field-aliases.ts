export const FAQ_IMPORT_FIELD_KEYS = [
  "QUESTION",
  "TRIGGER_PHRASES",
  "ANSWER",
  "NEXT_STEP",
] as const;

export type FaqImportFieldKey = (typeof FAQ_IMPORT_FIELD_KEYS)[number];

export const FAQ_IMPORT_FIELD_ALIASES: Record<
  FaqImportFieldKey,
  readonly string[]
> = {
  QUESTION: ["Question", "Q", "Pertanyaan"],
  TRIGGER_PHRASES: [
    "Trigger Phrases",
    "Trigger Phrase",
    "Trigger",
    "Frasa Pemicu",
    "Frase Pemicu",
    "Pemicu",
  ],
  ANSWER: ["Answer", "A", "Jawaban"],
  NEXT_STEP: ["Next Step", "Next Steps", "Langkah Berikutnya", "Langkah Selanjutnya"],
};

const ALIAS_TO_CANONICAL = new Map<string, FaqImportFieldKey>();

for (const canonical of FAQ_IMPORT_FIELD_KEYS) {
  ALIAS_TO_CANONICAL.set(normalizeFaqFieldKey(canonical), canonical);
  for (const alias of FAQ_IMPORT_FIELD_ALIASES[canonical]) {
    ALIAS_TO_CANONICAL.set(normalizeFaqFieldKey(alias), canonical);
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
  return ALIAS_TO_CANONICAL.get(normalized) ?? null;
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

  if (resolveFaqFieldKey(trimmed)) {
    return { rawKey: trimmed, inlineValue: "" };
  }

  return null;
}

export const FAQ_HEADER_PATTERN = /^FAQ\s*#?\s*0*(\d+)\s*$/i;
export const FAQ_SECTION_SEPARATOR_PATTERN = /^-{3,}\s*$/;

export function isFaqHeaderLine(line: string): boolean {
  return FAQ_HEADER_PATTERN.test(line.trim());
}

export function isFaqSectionSeparatorLine(line: string): boolean {
  return FAQ_SECTION_SEPARATOR_PATTERN.test(line.trim());
}

export function extractFaqHeaderId(line: string): string | undefined {
  const match = line.trim().match(FAQ_HEADER_PATTERN);
  if (!match?.[1]) return undefined;
  return match[1].replace(/^0+/, "") || match[1];
}
