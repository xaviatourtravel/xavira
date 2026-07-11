import type { BusinessBrainContext } from "@/modules/business-brain/types/context";
import type { BusinessBrainCompleteness } from "@/modules/ai/base-brain/types";
import type { IntentFallbackStrategy } from "@/modules/ai/base-brain/types";
import { resolveIntentFallbackStrategy } from "@/modules/ai/base-brain/missing-information-policy";

export function assessBusinessBrainCompleteness(
  context: BusinessBrainContext,
): BusinessBrainCompleteness {
  const hasIdentity = Boolean(context.companyDNA?.companyName?.trim());
  const productCount = context.products.length;
  const knowledgeCount = context.knowledge.length;
  const documentCount = context.documents.length;
  const factCount = productCount + knowledgeCount + documentCount;

  if (!hasIdentity && factCount === 0) {
    return "empty";
  }

  if (hasIdentity && factCount >= 2) {
    return "complete";
  }

  return "partial";
}

export function resolveFallbackStrategy(intent: string): IntentFallbackStrategy {
  return resolveIntentFallbackStrategy(intent);
}

export function buildUsedSourceCatalog(input: {
  companyDNA: BusinessBrainContext["companyDNA"];
  products: Array<{ id: string; name: string }>;
  knowledge: Array<{ id: string; title: string }>;
  documents: Array<{ id: string; name: string }>;
}): string[] {
  const catalog: string[] = [];

  if (input.companyDNA) {
    catalog.push("Company DNA");
  }

  for (const product of input.products) {
    catalog.push(`Product: ${product.name}`);
  }

  for (const article of input.knowledge) {
    catalog.push(`Knowledge: ${article.title}`);
  }

  for (const document of input.documents) {
    catalog.push(`Document: ${document.name}`);
  }

  return catalog;
}
