import type { BusinessBrainContext } from "@/modules/business-brain/types/context";

function sourceMatchesId(source: string, id: string): boolean {
  const normalized = source.toLowerCase();
  const needle = id.toLowerCase();
  return (
    normalized === needle ||
    normalized.endsWith(`:${needle}`) ||
    normalized.includes(needle)
  );
}

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

function sourceMatchesName(source: string, name: string): boolean {
  const lower = source.toLowerCase();
  const slug = slugify(name);
  const label = name.trim().toLowerCase();
  return (
    lower.includes(slug) ||
    lower.endsWith(slug) ||
    lower.includes(label) ||
    lower.endsWith(`: ${label}`)
  );
}

function isCompanyDnaSource(source: string): boolean {
  const lower = source.toLowerCase();
  return lower.includes("company") || lower.includes("dna");
}

function formatRawSourceLabel(source: string): string {
  const colonIdx = source.indexOf(":");
  if (colonIdx > 0) {
    const type = source.slice(0, colonIdx).trim();
    const value = source
      .slice(colonIdx + 1)
      .trim()
      .replace(/-/g, " ");
    const category = type.charAt(0).toUpperCase() + type.slice(1);
    return `${category}: ${value}`;
  }

  return source;
}

function addUniqueLabel(labels: string[], seen: Set<string>, label: string) {
  if (!seen.has(label)) {
    seen.add(label);
    labels.push(label);
  }
}

/**
 * Resolve human-readable Business Brain source labels for internal transparency.
 * When the LLM returns no usedSources, falls back to all context sections in the prompt.
 */
export function resolveAiSourceLabels(
  context: BusinessBrainContext,
  usedSources: string[],
): string[] {
  const labels: string[] = [];
  const seen = new Set<string>();

  if (usedSources.length === 0) {
    if (context.companyDNA) {
      addUniqueLabel(labels, seen, "Company DNA");
    }
    for (const product of context.products) {
      addUniqueLabel(labels, seen, `Product: ${product.name}`);
    }
    for (const article of context.knowledge) {
      addUniqueLabel(labels, seen, `Knowledge: ${article.title}`);
    }
    for (const behavior of context.behaviors) {
      addUniqueLabel(labels, seen, `Behavior: ${behavior.name}`);
    }
    for (const document of context.documents) {
      addUniqueLabel(labels, seen, `Document: ${document.name}`);
    }
    return labels;
  }

  let companyMatched = false;

  for (const source of usedSources) {
    const normalizedSource = source.trim();
    if (
      normalizedSource === "Company DNA" ||
      (!companyMatched && isCompanyDnaSource(source) && context.companyDNA)
    ) {
      addUniqueLabel(labels, seen, "Company DNA");
      companyMatched = true;
      continue;
    }

    const product = context.products.find(
      (item) =>
        sourceMatchesId(source, item.id) ||
        sourceMatchesName(source, item.name) ||
        normalizedSource === `Product: ${item.name}`,
    );
    if (product) {
      addUniqueLabel(labels, seen, `Product: ${product.name}`);
      continue;
    }

    const article = context.knowledge.find(
      (item) =>
        sourceMatchesId(source, item.id) ||
        sourceMatchesName(source, item.title) ||
        normalizedSource === `Knowledge: ${item.title}`,
    );
    if (article) {
      addUniqueLabel(labels, seen, `Knowledge: ${article.title}`);
      continue;
    }

    const behavior = context.behaviors.find(
      (item) =>
        sourceMatchesId(source, item.id) || sourceMatchesName(source, item.name),
    );
    if (behavior) {
      addUniqueLabel(labels, seen, `Behavior: ${behavior.name}`);
      continue;
    }

    const document = context.documents.find(
      (item) =>
        sourceMatchesId(source, item.id) ||
        sourceMatchesName(source, item.name) ||
        normalizedSource === `Document: ${item.name}`,
    );
    if (document) {
      addUniqueLabel(labels, seen, `Document: ${document.name}`);
      continue;
    }

    const handover = context.handoverRules.find(
      (item) => sourceMatchesId(source, item.id) || sourceMatchesName(source, item.name),
    );
    if (handover) {
      addUniqueLabel(labels, seen, `Handover: ${handover.name}`);
      continue;
    }

    addUniqueLabel(labels, seen, formatRawSourceLabel(source));
  }

  return labels;
}

export function normalizeAiConfidenceScore(confidence: number): number {
  if (!Number.isFinite(confidence)) {
    return 0;
  }

  const normalized = confidence > 1 ? confidence / 100 : confidence;
  return Math.max(0, Math.min(1, Number(normalized.toFixed(2))));
}
