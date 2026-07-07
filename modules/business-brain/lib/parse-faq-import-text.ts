import {
  extractFaqHeaderId,
  isFaqBlockBoundaryLine,
  isFaqFieldKeyLine,
  isFaqHeaderLine,
  isFaqSectionSeparatorLine,
  isFaqSectionStartLine,
  parseFaqFieldLine,
  parseFaqMetadataLine,
  type FaqImportFieldKey,
} from "@/modules/business-brain/lib/faq-import-field-aliases";
import type {
  FaqImportApplyItem,
  ParsedFaqImport,
  ParsedFaqImportItem,
} from "@/modules/business-brain/types/faq-import";

type FaqBlockDraft = {
  id?: string;
  importedFaqId?: string;
  productId?: string;
  rawLines: string[];
  fields: Partial<Record<FaqImportFieldKey, string>>;
};

export type ParseFaqImportOptions = {
  currentProductId?: string | null;
};

function createDraft(): FaqBlockDraft {
  return {
    rawLines: [],
    fields: {},
  };
}

function draftRawText(draft: FaqBlockDraft): string {
  return draft.rawLines.join("\n").trim();
}

function draftHasQuestionAndAnswer(draft: FaqBlockDraft): boolean {
  return Boolean(draft.fields.QUESTION?.trim() && draft.fields.ANSWER?.trim());
}

function parseTriggerPhrases(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(/[;\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function finalizeFaqBlock(
  draft: FaqBlockDraft,
  options?: ParseFaqImportOptions,
): { item: ParsedFaqImportItem | null; warnings: string[] } {
  const warnings: string[] = [];
  const question = draft.fields.QUESTION?.trim() ?? "";
  const answer = draft.fields.ANSWER?.trim() ?? "";

  if (!question || !answer) {
    return { item: null, warnings };
  }

  const nextStep = draft.fields.NEXT_STEP?.trim();

  if (
    options?.currentProductId?.trim() &&
    draft.productId?.trim() &&
    draft.productId.trim() !== options.currentProductId.trim()
  ) {
    warnings.push(`product_id_mismatch:${draft.productId.trim()}`);
  }

  return {
    item: {
      id: draft.id,
      importedFaqId: draft.importedFaqId,
      productId: draft.productId,
      question,
      triggerPhrases: parseTriggerPhrases(draft.fields.TRIGGER_PHRASES),
      answer,
      nextStep: nextStep || undefined,
      rawText: draftRawText(draft),
    },
    warnings,
  };
}

function parseDraftLines(draft: FaqBlockDraft) {
  draft.fields = {};
  draft.id = undefined;
  draft.importedFaqId = undefined;
  draft.productId = undefined;

  let currentKey: FaqImportFieldKey | null = null;
  let currentValue: string[] = [];

  const flushField = () => {
    if (!currentKey) return;
    draft.fields[currentKey] = currentValue.join("\n").trim();
    currentKey = null;
    currentValue = [];
  };

  for (const line of draft.rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (isFaqHeaderLine(trimmed)) {
      draft.id = extractFaqHeaderId(trimmed) ?? draft.id;
      continue;
    }

    if (isFaqSectionSeparatorLine(trimmed)) {
      continue;
    }

    const metadata = parseFaqMetadataLine(trimmed);
    if (metadata) {
      flushField();
      if (metadata.key === "FAQ_ID") {
        draft.importedFaqId = metadata.value || draft.importedFaqId;
      }
      if (metadata.key === "PRODUCT_ID") {
        draft.productId = metadata.value || draft.productId;
      }
      continue;
    }

    const field = parseFaqFieldLine(trimmed);
    if (field) {
      flushField();
      currentKey = field.key;
      if (field.inlineValue) {
        currentValue = [field.inlineValue];
      }
      continue;
    }

    if (currentKey) {
      currentValue.push(trimmed);
    }
  }

  flushField();
}

function parseFaqBlocks(input: string): FaqBlockDraft[] {
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const drafts: FaqBlockDraft[] = [];
  let draft: FaqBlockDraft | null = null;

  const finalizeCurrent = () => {
    if (!draft) return;
    parseDraftLines(draft);
    drafts.push(draft);
    draft = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (isFaqSectionSeparatorLine(trimmed)) {
      finalizeCurrent();
      continue;
    }

    if (!draft) {
      if (isFaqSectionStartLine(trimmed) || isFaqFieldKeyLine(trimmed)) {
        draft = createDraft();
        draft.rawLines.push(line);
      }
      continue;
    }

    parseDraftLines(draft);
    if (isFaqBlockBoundaryLine(trimmed, draftHasQuestionAndAnswer(draft))) {
      finalizeCurrent();
      draft = createDraft();
      draft.rawLines.push(line);
      continue;
    }

    draft.rawLines.push(line);
  }

  finalizeCurrent();
  return drafts;
}

export function buildFaqImportContent(
  item: Pick<ParsedFaqImportItem, "answer" | "nextStep" | "triggerPhrases">,
): string {
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

export function parseFaqImportText(
  input: string,
  options?: ParseFaqImportOptions,
): ParsedFaqImport {
  const warnings: string[] = [];
  const ignoredSections: string[] = [];
  const faqs: ParsedFaqImportItem[] = [];

  for (const block of parseFaqBlocks(input)) {
    const { item, warnings: blockWarnings } = finalizeFaqBlock(block, options);
    warnings.push(...blockWarnings);

    if (item) {
      faqs.push(item);
      continue;
    }

    const rawText = draftRawText(block);
    if (rawText) {
      ignoredSections.push(rawText.slice(0, 120));
    }
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
    if (isFaqSectionStartLine(lines[index] ?? "")) {
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

export function parseCombinedProductImportInput(
  input: string,
  options?: ParseFaqImportOptions,
): {
  productText: string;
  faqText: string;
  faqImport: ParsedFaqImport;
} {
  const { productText, faqText } = splitProductAndFaqImportText(input);
  const faqImport = faqText
    ? parseFaqImportText(faqText, options)
    : { faqs: [], warnings: [], ignoredSections: [] };

  return { productText, faqText, faqImport };
}

export function mapParsedFaqsToApplyItems(
  faqs: Array<{
    question: string;
    answer: string;
    nextStep?: string;
    triggerPhrases: string[];
  }>,
): FaqImportApplyItem[] {
  return faqs.map((faq) => ({
    question: faq.question,
    content: buildFaqImportContent(faq),
  }));
}

export function summarizeFaqImport(parsed: ParsedFaqImport): {
  total: number;
  missingTriggerPhrases: number;
  productIdMismatches: number;
} {
  const missingTriggerPhrases = parsed.faqs.filter(
    (faq) => faq.triggerPhrases.length === 0,
  ).length;

  const productIdMismatches = parsed.warnings.filter((warning) =>
    warning.startsWith("product_id_mismatch:"),
  ).length;

  return {
    total: parsed.faqs.length,
    missingTriggerPhrases,
    productIdMismatches,
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
