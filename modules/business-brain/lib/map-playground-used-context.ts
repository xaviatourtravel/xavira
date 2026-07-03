import { toPromptBusinessBrainContext } from "@/modules/ai/types/context-retrieval";
import type { RetrievedBusinessBrainContext } from "@/modules/ai/types/context-retrieval";
import { mapBusinessBrainContextToPlayground } from "@/modules/business-brain/lib/map-context-to-playground";
import type { BusinessBrainContext } from "@/modules/business-brain/types/context";
import type { PlaygroundAvailableContext } from "@/modules/business-brain/types/playground";

function sourceMatchesId(source: string, id: string): boolean {
  const normalized = source.toLowerCase();
  const needle = id.toLowerCase();
  return normalized === needle || normalized.endsWith(`:${needle}`) || normalized.includes(needle);
}

function sourceMatchesLabel(source: string, label: string): boolean {
  const normalizedSource = source.trim().toLowerCase();
  const normalizedLabel = label.trim().toLowerCase();
  return (
    normalizedSource === normalizedLabel ||
    normalizedSource.includes(normalizedLabel) ||
    normalizedLabel.includes(normalizedSource)
  );
}

function filterItemsBySources<T extends { id: string; name?: string; title?: string }>(
  items: T[],
  usedSources: string[],
  labelPrefix: string,
): T[] {
  if (usedSources.length === 0) {
    return items;
  }

  return items.filter((item) => {
    const label = item.name ?? item.title ?? "";
    return usedSources.some(
      (source) =>
        sourceMatchesId(source, item.id) ||
        sourceMatchesLabel(source, `${labelPrefix}: ${label}`) ||
        (label ? sourceMatchesLabel(source, label) : false),
    );
  });
}

export function mapUsedContextToPlayground(
  context: BusinessBrainContext | RetrievedBusinessBrainContext,
  usedSources: string[],
): PlaygroundAvailableContext {
  const normalizedContext: BusinessBrainContext =
    "relevantProducts" in context ? toPromptBusinessBrainContext(context) : context;

  const filteredContext: BusinessBrainContext = {
    companyDNA:
      usedSources.length === 0 ||
      usedSources.some((source) => source.toLowerCase().includes("company"))
        ? normalizedContext.companyDNA
        : null,
    products: filterItemsBySources(normalizedContext.products, usedSources, "Product"),
    knowledge: filterItemsBySources(normalizedContext.knowledge, usedSources, "Knowledge"),
    documents: filterItemsBySources(normalizedContext.documents, usedSources, "Document"),
    behaviors: filterItemsBySources(normalizedContext.behaviors, usedSources, "Behavior"),
    handoverRules: filterItemsBySources(
      normalizedContext.handoverRules,
      usedSources,
      "Handover",
    ),
    replyStyle: normalizedContext.replyStyle,
    qualificationRules: normalizedContext.qualificationRules,
  };

  return mapBusinessBrainContextToPlayground(filteredContext);
}
