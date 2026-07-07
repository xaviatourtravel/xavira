import {
  extractFaqHeaderId,
  isFaqHeaderLine,
  isFaqSectionSeparatorLine,
  resolveFaqFieldKey,
  splitFaqFieldLine,
} from "@/modules/business-brain/lib/faq-import-field-aliases";
import type {
  FaqImportApplyItem,
  ParsedFaqImport,
  ParsedFaqImportItem,
} from "@/modules/business-brain/types/faq-import";

type FaqBlockDraft = {
  id?: string;
  rawText: string;
  fields: Partial<
    Record<"QUESTION" | "TRIGGER_PHRASES" | "ANSWER" | "NEXT_STEP", string>
  >;
};

function parseTriggerPhrases(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(/[;\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractFieldBlocks(blockText: string) {
  const lines = blockText.replace(/\r\n/g, "\n").split("\n");
  const fields: FaqBlockDraft["fields"] = {};

  let currentKey: keyof FaqBlockDraft["fields"] | null = null;
  let currentValue: string[] = [];

  const flush = () => {
    if (!currentKey) return;
    fields[currentKey] = currentValue.join("\n").trim();
    currentKey = null;
    currentValue = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (isFaqHeaderLine(trimmed)) {
      continue;
    }

    if (isFaqSectionSeparatorLine(trimmed)) {
      continue;
    }

    const parsedLine = splitFaqFieldLine(trimmed);
    if (parsedLine) {
      const canonicalKey = resolveFaqFieldKey(parsedLine.rawKey);
      if (canonicalKey) {
        flush();
        currentKey = canonicalKey;
        if (parsedLine.inlineValue) {
          currentValue = [parsedLine.inlineValue];
        }
        continue;
      }
    }

    if (currentKey) {
      currentValue.push(trimmed);
    }
  }

  flush();
  return fields;
}

function splitIntoFaqBlocks(input: string): FaqBlockDraft[] {
  const normalized = input.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const lines = normalized.split("\n");
  const blocks: FaqBlockDraft[] = [];
  let currentLines: string[] = [];
  let currentId: string | undefined;

  const pushBlock = () => {
    const rawText = currentLines.join("\n").trim();
    if (!rawText) {
      currentLines = [];
      currentId = undefined;
      return;
    }

    const headerLine = currentLines.find((line) => isFaqHeaderLine(line));
    const id = headerLine ? extractFaqHeaderId(headerLine) : currentId;
    blocks.push({
      id,
      rawText,
      fields: extractFieldBlocks(rawText),
    });
    currentLines = [];
    currentId = undefined;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (isFaqHeaderLine(trimmed)) {
      if (currentLines.length > 0) {
        pushBlock();
      }
      currentId = extractFaqHeaderId(trimmed);
      currentLines.push(trimmed);
      continue;
    }

    if (isFaqSectionSeparatorLine(trimmed)) {
      if (currentLines.length > 0) {
        pushBlock();
      }
      continue;
    }

    currentLines.push(line);
  }

  pushBlock();

  if (blocks.length === 0) {
    return [
      {
        rawText: normalized,
        fields: extractFieldBlocks(normalized),
      },
    ];
  }

  return blocks;
}

function finalizeFaqBlock(block: FaqBlockDraft): ParsedFaqImportItem | null {
  const question = block.fields.QUESTION?.trim() ?? "";
  const answer = block.fields.ANSWER?.trim() ?? "";
  if (!question || !answer) {
    return null;
  }

  const nextStep = block.fields.NEXT_STEP?.trim();

  return {
    id: block.id,
    question,
    triggerPhrases: parseTriggerPhrases(block.fields.TRIGGER_PHRASES),
    answer,
    nextStep: nextStep || undefined,
    rawText: block.rawText,
  };
}

export function buildFaqImportContent(item: Pick<ParsedFaqImportItem, "answer" | "nextStep" | "triggerPhrases">): string {
  const parts: string[] = [];

  if (item.triggerPhrases.length > 0) {
    parts.push(`Trigger phrases: ${item.triggerPhrases.join("; ")}`);
    parts.push("");
  }

  parts.push(item.answer.trim());

  if (item.nextStep?.trim()) {
    parts.push("");
    parts.push("Next step:");
    parts.push(item.nextStep.trim());
  }

  return parts.join("\n");
}

export function normalizeFaqQuestion(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function parseFaqImportText(input: string): ParsedFaqImport {
  const warnings: string[] = [];
  const ignoredSections: string[] = [];
  const faqs: ParsedFaqImportItem[] = [];

  const blocks = splitIntoFaqBlocks(input);

  for (const block of blocks) {
    const parsed = finalizeFaqBlock(block);
    if (parsed) {
      faqs.push(parsed);
      continue;
    }

    ignoredSections.push(block.rawText.slice(0, 120));
  }

  return { faqs, warnings, ignoredSections };
}

export function splitProductAndFaqImportText(input: string): {
  productText: string;
  faqText: string;
} {
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  let faqStartIndex = -1;

  for (let index = 0; index < lines.length; index += 1) {
    if (isFaqHeaderLine(lines[index] ?? "")) {
      faqStartIndex = index;
      break;
    }
  }

  if (faqStartIndex < 0) {
    return { productText: input.trim(), faqText: "" };
  }

  return {
    productText: lines.slice(0, faqStartIndex).join("\n").trim(),
    faqText: lines.slice(faqStartIndex).join("\n").trim(),
  };
}

export function parseCombinedProductImportInput(input: string): {
  productText: string;
  faqText: string;
  faqImport: ParsedFaqImport;
} {
  const { productText, faqText } = splitProductAndFaqImportText(input);
  const faqImport = faqText ? parseFaqImportText(faqText) : { faqs: [], warnings: [], ignoredSections: [] };

  return { productText, faqText, faqImport };
}

export function mapParsedFaqsToApplyItems(
  faqs: Array<{
    question: string;
    answer: string;
    nextStep?: string;
    triggerPhrases: string[];
  }>,
) {
  return faqs.map((faq) => ({
    question: faq.question,
    content: buildFaqImportContent(faq),
  }));
}

export function summarizeFaqImport(parsed: ParsedFaqImport): {
  total: number;
  missingTriggerPhrases: number;
} {
  const missingTriggerPhrases = parsed.faqs.filter(
    (faq) => faq.triggerPhrases.length === 0,
  ).length;

  return {
    total: parsed.faqs.length,
    missingTriggerPhrases,
  };
}

export function detectDuplicateFaqQuestions(
  faqs: ParsedFaqImportItem[],
  existingQuestions: string[],
): string[] {
  const seen = new Set(existingQuestions.map(normalizeFaqQuestion));
  const duplicates: string[] = [];

  for (const faq of faqs) {
    const normalized = normalizeFaqQuestion(faq.question);
    if (seen.has(normalized)) {
      duplicates.push(faq.question);
      continue;
    }
    seen.add(normalized);
  }

  return duplicates;
}
