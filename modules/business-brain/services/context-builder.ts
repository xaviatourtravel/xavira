import { parseBrainSnapshot } from "@/modules/business-brain/lib/brain-snapshot";
import {
  applyBusinessBrainContextFilters,
  mapDraftRowsToBusinessBrainContext,
  mapSnapshotToBusinessBrainContext,
} from "@/modules/business-brain/lib/map-brain-context";
import { listBrainBehaviors } from "@/modules/business-brain/repositories/brain-behavior-repository";
import { listBrainArticles } from "@/modules/business-brain/repositories/brain-article-repository";
import { listBrainDocuments } from "@/modules/business-brain/repositories/brain-document-repository";
import { listBrainProducts } from "@/modules/business-brain/repositories/brain-product-repository";
import { findBrainVersionById } from "@/modules/business-brain/repositories/brain-version-repository";
import { findBusinessBrainByOrganizationId } from "@/modules/business-brain/repositories/business-brain-repository";
import { findCompanyDnaByBusinessBrainId } from "@/modules/business-brain/repositories/company-dna-repository";
import {
  EMPTY_BUSINESS_BRAIN_CONTEXT,
  type BuildBusinessBrainContextOptions,
  type BusinessBrainContext,
  type BusinessBrainContextResult,
} from "@/modules/business-brain/types/context";

function logContextBuilt(meta: BusinessBrainContextResult["meta"], context: BusinessBrainContext) {
  console.info("[BusinessBrain] context_built", {
    workspaceId: meta.workspaceId,
    source: meta.source,
    businessBrainId: meta.businessBrainId,
    publishedVersionId: meta.publishedVersionId,
    publishedVersionNumber: meta.publishedVersionNumber,
    counts: {
      products: context.products.length,
      knowledge: context.knowledge.length,
      documents: context.documents.length,
      behaviors: context.behaviors.length,
      handoverRules: context.handoverRules.length,
      hasCompanyDNA: !!context.companyDNA,
      hasReplyStyle: !!context.replyStyle,
      hasQualificationRules: !!context.qualificationRules,
    },
  });
}

function logMissingPublishedBrain(workspaceId: string, businessBrainId: string | null) {
  console.warn("[BusinessBrain] missing_published_brain", {
    workspaceId,
    businessBrainId,
  });
}

function buildEmptyResult(workspaceId: string): BusinessBrainContextResult {
  return {
    ...EMPTY_BUSINESS_BRAIN_CONTEXT,
    meta: {
      workspaceId,
      businessBrainId: null,
      source: "empty",
      publishedVersionId: null,
      publishedVersionNumber: null,
      builtAt: new Date().toISOString(),
    },
  };
}

async function loadDraftContext(businessBrainId: string): Promise<BusinessBrainContext> {
  const [companyDna, products, knowledge, documents, behaviors] = await Promise.all([
    findCompanyDnaByBusinessBrainId(businessBrainId),
    listBrainProducts(businessBrainId),
    listBrainArticles(businessBrainId),
    listBrainDocuments(businessBrainId),
    listBrainBehaviors(businessBrainId),
  ]);

  return mapDraftRowsToBusinessBrainContext({
    companyDna,
    products,
    knowledge,
    documents,
    behaviors,
    includeUnpublished: true,
  });
}

async function loadPublishedContext(
  businessBrainId: string,
  publishedVersionId: string,
): Promise<BusinessBrainContext | null> {
  const version = await findBrainVersionById(publishedVersionId);
  if (!version || version.business_brain_id !== businessBrainId) {
    return null;
  }

  const snapshot = parseBrainSnapshot(version.snapshot);
  if (!snapshot) {
    return null;
  }

  return mapSnapshotToBusinessBrainContext(snapshot);
}

export async function buildBusinessBrainContext(
  workspaceId: string,
  options: BuildBusinessBrainContextOptions = {},
): Promise<BusinessBrainContextResult> {
  const brain = await findBusinessBrainByOrganizationId(workspaceId);
  if (!brain) {
    return buildEmptyResult(workspaceId);
  }

  const builtAt = new Date().toISOString();
  let context: BusinessBrainContext = EMPTY_BUSINESS_BRAIN_CONTEXT;
  let source: BusinessBrainContextResult["meta"]["source"] = "empty";
  let publishedVersionNumber: number | null = null;

  if (options.includeDraft) {
    context = await loadDraftContext(brain.id);
    source = "draft";
  } else if (brain.published_version_id) {
    const publishedContext = await loadPublishedContext(brain.id, brain.published_version_id);
    if (publishedContext) {
      context = publishedContext;
      source = "published";
      const version = await findBrainVersionById(brain.published_version_id);
      publishedVersionNumber = version?.version_number ?? null;
    } else {
      logMissingPublishedBrain(workspaceId, brain.id);
    }
  } else {
    logMissingPublishedBrain(workspaceId, brain.id);
  }

  const filteredContext = applyBusinessBrainContextFilters(context, {
    productId: options.productId,
    customerMessage: options.customerMessage,
  });

  const result: BusinessBrainContextResult = {
    ...filteredContext,
    meta: {
      workspaceId,
      businessBrainId: brain.id,
      source,
      publishedVersionId: brain.published_version_id,
      publishedVersionNumber,
      builtAt,
    },
  };

  logContextBuilt(result.meta, filteredContext);
  return result;
}

export async function buildBusinessBrainContextBody(
  workspaceId: string,
  options?: BuildBusinessBrainContextOptions,
): Promise<BusinessBrainContext> {
  const result = await buildBusinessBrainContext(workspaceId, options);
  const { meta: _meta, ...context } = result;
  void _meta;
  return context;
}
