"use server";

import { requireProfile } from "@/lib/auth/session";
import { listBrainArticles } from "@/modules/business-brain/repositories/brain-article-repository";
import { listBrainBehaviors } from "@/modules/business-brain/repositories/brain-behavior-repository";
import {
  listBrainDocuments,
  listDocumentTriggersByDocumentIds,
} from "@/modules/business-brain/repositories/brain-document-repository";
import { listBrainProducts } from "@/modules/business-brain/repositories/brain-product-repository";
import { findBusinessBrainByOrganizationId } from "@/modules/business-brain/repositories/business-brain-repository";
import {
  findCompanyDnaByBusinessBrainId,
  mapCompanyDnaRow,
} from "@/modules/business-brain/repositories/company-dna-repository";
import { listProductIdsWithItinerary } from "@/modules/business-brain/repositories/product-document-repository";
import { parsePricingItems } from "@/modules/business-brain/lib/product-knowledge-score";
import {
  calculateBusinessBrainCoach,
  emptyBusinessBrainCoachResult,
} from "@/modules/business-brain/services/calculate-business-brain-coach";
import type { HandoverRuleConfig } from "@/modules/business-brain/types/behaviors";
import type { BusinessBrainHealthInput } from "@/modules/business-brain/types/business-brain-health";

function parseKeywords(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export async function loadBusinessBrainCoachAction() {
  const { profile } = await requireProfile();
  const organizationId = profile.organization_id?.trim() ?? "";
  if (!organizationId) {
    return emptyBusinessBrainCoachResult();
  }

  const brain = await findBusinessBrainByOrganizationId(organizationId);
  if (!brain) {
    return emptyBusinessBrainCoachResult();
  }

  const [companyDnaRow, products, knowledge, documents, behaviors] = await Promise.all([
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

  const companyDna = companyDnaRow ? mapCompanyDnaRow(companyDnaRow) : null;

  const input: BusinessBrainHealthInput = {
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
    behaviors: behaviors.map((behavior) => {
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
    }),
    isPublished: brain.status === "published",
  };

  return calculateBusinessBrainCoach(input);
}
