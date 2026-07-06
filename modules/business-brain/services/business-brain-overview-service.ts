import { listBrainArticles } from "@/modules/business-brain/repositories/brain-article-repository";
import { listBrainBehaviors } from "@/modules/business-brain/repositories/brain-behavior-repository";
import {
  listBrainDocuments,
  listDocumentTriggersByDocumentIds,
} from "@/modules/business-brain/repositories/brain-document-repository";
import { listBrainProducts } from "@/modules/business-brain/repositories/brain-product-repository";
import {
  findBusinessBrainByOrganizationId,
  type BusinessBrainRow,
} from "@/modules/business-brain/repositories/business-brain-repository";
import {
  findCompanyDnaByBusinessBrainId,
  mapCompanyDnaRow,
  type CompanyDnaRow,
} from "@/modules/business-brain/repositories/company-dna-repository";
import { listProductIdsWithItinerary } from "@/modules/business-brain/repositories/product-document-repository";
import { parsePricingItems } from "@/modules/business-brain/lib/product-knowledge-score";
import { calculateBusinessBrainHealth } from "@/modules/business-brain/services/calculate-business-brain-health";
import { calculateBusinessBrainCoach } from "@/modules/business-brain/services/calculate-business-brain-coach";
import {
  buildBusinessBrainTimeline,
  emptyBusinessBrainTimelineResult,
} from "@/modules/business-brain/lib/build-business-brain-timeline";
import { listBrainVersions } from "@/modules/business-brain/repositories/brain-version-repository";
import type {
  BusinessBrainOverviewSummary,
  BusinessBrainRecentChange,
} from "@/modules/business-brain/types";
import type {
  BusinessBrainHealthInput,
  BusinessBrainHealthBehaviorInput,
} from "@/modules/business-brain/types/business-brain-health";
import type { HandoverRuleConfig } from "@/modules/business-brain/types/behaviors";

function formatTimestampLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function buildRecentChanges(input: {
  brain: BusinessBrainRow | null;
  companyDna: CompanyDnaRow | null;
  products: Array<{ id: string; name: string; updated_at: string }>;
  knowledge: Array<{ id: string; title: string; updated_at: string }>;
  documents: Array<{ id: string; name: string; updated_at: string }>;
}): BusinessBrainRecentChange[] {
  const items: Array<{ id: string; label: string; at: string }> = [];

  if (input.brain?.draft_updated_at) {
    items.push({
      id: `brain-${input.brain.id}`,
      label: "Business Brain draft updated",
      at: input.brain.draft_updated_at,
    });
  }

  if (input.companyDna?.updated_at) {
    items.push({
      id: `dna-${input.companyDna.id}`,
      label: "Identity updated",
      at: input.companyDna.updated_at,
    });
  }

  for (const product of input.products) {
    items.push({
      id: `product-${product.id}`,
      label: `Product updated: ${product.name?.trim() || "Untitled"}`,
      at: product.updated_at,
    });
  }

  for (const article of input.knowledge) {
    items.push({
      id: `article-${article.id}`,
      label: `Knowledge updated: ${article.title?.trim() || "Untitled"}`,
      at: article.updated_at,
    });
  }

  for (const document of input.documents) {
    items.push({
      id: `document-${document.id}`,
      label: `Document updated: ${document.name?.trim() || "Untitled"}`,
      at: document.updated_at,
    });
  }

  return items
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      label: item.label,
      timestampLabel: formatTimestampLabel(item.at),
    }));
}

function parseKeywords(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function mapBehaviorInputs(
  behaviors: Awaited<ReturnType<typeof listBrainBehaviors>>,
): BusinessBrainHealthBehaviorInput[] {
  return behaviors.map((behavior) => {
    let triggerIntent: string | undefined;

    if (behavior.type === "HANDOVER_RULE" && behavior.config) {
      const config = behavior.config as HandoverRuleConfig;
      triggerIntent = config.triggerIntent;
    }

    return {
      type: behavior.type,
      enabled: behavior.enabled,
      name: behavior.name,
      triggerIntent,
    };
  });
}

function emptyOverview(): BusinessBrainOverviewSummary {
  const health = calculateBusinessBrainHealth({
    identity: null,
    products: [],
    knowledge: [],
    documents: [],
    behaviors: [],
    isPublished: false,
  });
  const coach = calculateBusinessBrainCoach({
    identity: null,
    products: [],
    knowledge: [],
    documents: [],
    behaviors: [],
    isPublished: false,
  });

  return {
    health,
    coach,
    timeline: emptyBusinessBrainTimelineResult(),
    brainHealthPercent: health.overallScore,
    aiReadinessPercent: health.overallScore,
    estimatedAiAccuracy: health.estimatedAiAccuracy,
    knowledgeCount: 0,
    productCount: 0,
    documentCount: 0,
    publishStatus: "draft",
    metrics: [],
    suggestions: health.recommendations.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      href: item.targetPage,
    })),
    recentChanges: [],
  };
}

export async function getBusinessBrainOverview(
  organizationId: string,
): Promise<BusinessBrainOverviewSummary> {
  if (!organizationId.trim()) {
    return emptyOverview();
  }

  const brain = await findBusinessBrainByOrganizationId(organizationId);
  if (!brain) {
    return emptyOverview();
  }

  const [companyDnaRow, products, knowledge, documents, behaviors, versions] =
    await Promise.all([
      findCompanyDnaByBusinessBrainId(brain.id),
      listBrainProducts(brain.id),
      listBrainArticles(brain.id),
      listBrainDocuments(brain.id),
      listBrainBehaviors(brain.id),
      listBrainVersions(brain.id),
    ]);

  const productIds = products.map((product) => product.id);
  const documentIds = documents.map((document) => document.id);

  const [itineraryProductIds, documentTriggers] = await Promise.all([
    listProductIdsWithItinerary(productIds),
    listDocumentTriggersByDocumentIds(documentIds),
  ]);

  const companyDna = companyDnaRow ? mapCompanyDnaRow(companyDnaRow) : null;

  const healthInput: BusinessBrainHealthInput = {
    identity: companyDna
      ? {
          companyName: companyDna.companyName,
          industry: companyDna.industry,
          about: companyDna.about,
          brandPersonality: companyDna.brandPersonality,
          aiGoals: companyDna.aiGoals,
          neverRules: companyDna.neverRules,
        }
      : null,
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      status: product.status,
      description: product.description,
      pricingCount: parsePricingItems(product.pricing).length,
      hasItinerary: itineraryProductIds.has(product.id),
    })),
    knowledge: knowledge.map((article) => ({
      id: article.id,
      title: article.title,
      category: article.category,
      status: article.status,
      content: article.content,
      keywords: parseKeywords(article.keywords),
    })),
    documents: documents.map((document) => ({
      id: document.id,
      name: document.name,
      status: document.status,
      autoSendEnabled: document.auto_send_enabled,
      triggers: documentTriggers.get(document.id) ?? [],
    })),
    behaviors: mapBehaviorInputs(behaviors),
    isPublished: brain.status === "published",
  };

  const health = calculateBusinessBrainHealth(healthInput);
  const coach = calculateBusinessBrainCoach(healthInput);
  const timeline = buildBusinessBrainTimeline({
    brain: {
      id: brain.id,
      published_at: brain.published_at,
    },
    companyDna: companyDnaRow
      ? { id: companyDnaRow.id, updated_at: companyDnaRow.updated_at }
      : null,
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      status: product.status,
      created_at: product.created_at,
      updated_at: product.updated_at,
    })),
    knowledge: knowledge.map((article) => ({
      id: article.id,
      title: article.title,
      status: article.status,
      created_at: article.created_at,
      updated_at: article.updated_at,
    })),
    documents: documents.map((document) => ({
      id: document.id,
      name: document.name,
      status: document.status,
      created_at: document.created_at,
      updated_at: document.updated_at,
    })),
    behaviors: behaviors.map((behavior) => ({
      id: behavior.id,
      name: behavior.name,
      created_at: behavior.created_at,
      updated_at: behavior.updated_at,
    })),
    versions: versions.map((version) => ({
      id: version.id,
      version_number: version.version_number,
      published_at: version.published_at,
      status: version.status,
    })),
  });
  const publishStatus: "draft" | "published" =
    brain.status === "published" ? "published" : "draft";

  return {
    health,
    coach,
    timeline,
    brainHealthPercent: health.overallScore,
    aiReadinessPercent: health.overallScore,
    estimatedAiAccuracy: health.estimatedAiAccuracy,
    knowledgeCount: knowledge.length,
    productCount: products.length,
    documentCount: documents.length,
    publishStatus,
    metrics: [],
    suggestions: health.recommendations.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      href: item.targetPage,
    })),
    recentChanges: buildRecentChanges({
      brain,
      companyDna: companyDnaRow,
      products,
      knowledge,
      documents,
    }),
  };
}
