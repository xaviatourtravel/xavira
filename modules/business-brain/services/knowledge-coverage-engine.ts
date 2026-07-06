import {
  parseDepartureItems,
  parsePricingItems,
  parseStringArray,
} from "@/modules/business-brain/lib/product-knowledge-score";
import {
  computeKnowledgeCoverageFromSnapshot,
  emptyKnowledgeCoverageResult,
  type KnowledgeCoverageSnapshot,
} from "@/modules/business-brain/lib/knowledge-coverage-calculator";
import { listBrainArticles } from "@/modules/business-brain/repositories/brain-article-repository";
import { listBrainBehaviors } from "@/modules/business-brain/repositories/brain-behavior-repository";
import {
  listBrainDocuments,
  listDocumentTriggersByDocumentIds,
} from "@/modules/business-brain/repositories/brain-document-repository";
import type { BrainProductRow } from "@/modules/business-brain/repositories/brain-product-repository";
import { listBrainProducts } from "@/modules/business-brain/repositories/brain-product-repository";
import { findBusinessBrainByOrganizationId } from "@/modules/business-brain/repositories/business-brain-repository";
import {
  findCompanyDnaByBusinessBrainId,
  mapCompanyDnaRow,
} from "@/modules/business-brain/repositories/company-dna-repository";
import { listProductIdsWithItinerary } from "@/modules/business-brain/repositories/product-document-repository";
import type { HandoverRuleConfig } from "@/modules/business-brain/types/behaviors";
import type { BrainDocumentTrigger } from "@/modules/business-brain/types/documents";
import type { KnowledgeCoverageResult } from "@/modules/business-brain/types/knowledge-coverage";

function parseKeywords(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === "string");
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string");
      }
    } catch {
      return raw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function parseDocumentTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === "string");
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string");
      }
    } catch {
      return raw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function mapProductRow(
  product: BrainProductRow,
  itineraryProductIds: Set<string>,
): KnowledgeCoverageSnapshot["products"][number] {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    destination: product.destination,
    description: product.description,
    status: product.status,
    highlights: parseStringArray(product.highlights),
    pricingCount: parsePricingItems(product.pricing).length,
    departureCount: parseDepartureItems(product.departures).length,
    hasItinerary: itineraryProductIds.has(product.id),
  };
}

function buildSnapshot(input: {
  articles: Awaited<ReturnType<typeof listBrainArticles>>;
  products: BrainProductRow[];
  documents: Awaited<ReturnType<typeof listBrainDocuments>>;
  documentTriggers: Map<string, BrainDocumentTrigger[]>;
  itineraryProductIds: Set<string>;
  companyDnaRow: Awaited<ReturnType<typeof findCompanyDnaByBusinessBrainId>>;
  behaviors: Awaited<ReturnType<typeof listBrainBehaviors>>;
}): KnowledgeCoverageSnapshot {
  const companyDna = input.companyDnaRow ? mapCompanyDnaRow(input.companyDnaRow) : null;

  const complaintHandoverEnabled = input.behaviors.some((behavior) => {
    if (!behavior.enabled || behavior.type !== "HANDOVER_RULE") return false;
    const config = behavior.config as HandoverRuleConfig;
    return config?.triggerIntent === "complaint";
  });

  const privateTripHandoverEnabled = input.behaviors.some((behavior) => {
    if (!behavior.enabled || behavior.type !== "HANDOVER_RULE") return false;
    const config = behavior.config as HandoverRuleConfig;
    return config?.triggerIntent === "custom_private_trip";
  });

  return {
    articles: input.articles.map((article) => ({
      id: article.id,
      title: article.title,
      category: article.category,
      status: article.status,
      content: article.content,
      keywords: parseKeywords(article.keywords),
    })),
    products: input.products.map((product) =>
      mapProductRow(product, input.itineraryProductIds),
    ),
    documents: input.documents.map((document) => ({
      id: document.id,
      name: document.name,
      description: document.description,
      tags: parseDocumentTags(document.tags),
      triggers: input.documentTriggers.get(document.id) ?? [],
    })),
    identity: companyDna
      ? {
          companyName: companyDna.companyName,
          about: companyDna.about,
          website: companyDna.website,
        }
      : null,
    complaintHandoverEnabled,
    privateTripHandoverEnabled,
  };
}

export async function calculateKnowledgeCoverage(params: {
  workspaceId: string;
}): Promise<KnowledgeCoverageResult> {
  const workspaceId = params.workspaceId.trim();
  if (!workspaceId) {
    return emptyKnowledgeCoverageResult();
  }

  const brain = await findBusinessBrainByOrganizationId(workspaceId);
  if (!brain) {
    return emptyKnowledgeCoverageResult();
  }

  const [companyDnaRow, products, articles, documents, behaviors] = await Promise.all([
    findCompanyDnaByBusinessBrainId(brain.id),
    listBrainProducts(brain.id),
    listBrainArticles(brain.id),
    listBrainDocuments(brain.id),
    listBrainBehaviors(brain.id),
  ]);

  const productIds = products.map((product) => product.id);
  const documentIds = documents.map((document) => document.id);

  const [itineraryProductIds, documentTriggers] = await Promise.all([
    listProductIdsWithItinerary(productIds),
    listDocumentTriggersByDocumentIds(documentIds),
  ]);

  const snapshot = buildSnapshot({
    articles,
    products,
    documents,
    documentTriggers,
    itineraryProductIds,
    companyDnaRow,
    behaviors,
  });

  return computeKnowledgeCoverageFromSnapshot(snapshot);
}
