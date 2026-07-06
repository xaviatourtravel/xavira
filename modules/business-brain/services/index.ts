import { calculateBusinessBrainHealth } from "@/modules/business-brain/services/calculate-business-brain-health";
import { calculateBusinessBrainCoach } from "@/modules/business-brain/services/calculate-business-brain-coach";
import { emptyBusinessBrainTimelineResult } from "@/modules/business-brain/lib/build-business-brain-timeline";
import type { BusinessBrainOverviewSummary } from "@/modules/business-brain/types";

/** @deprecated Use getBusinessBrainOverview */
export function getBusinessBrainDashboardPlaceholder(): BusinessBrainOverviewSummary {
  const emptyInput = {
    identity: null,
    products: [],
    knowledge: [],
    documents: [],
    behaviors: [],
    isPublished: false,
  };
  const health = calculateBusinessBrainHealth(emptyInput);
  const coach = calculateBusinessBrainCoach(emptyInput);

  return {
    health,
    coach,
    timeline: emptyBusinessBrainTimelineResult(),
    brainHealthPercent: 0,
    aiReadinessPercent: 0,
    estimatedAiAccuracy: health.estimatedAiAccuracy,
    knowledgeCount: 0,
    productCount: 0,
    documentCount: 0,
    publishStatus: "draft",
    metrics: [],
    suggestions: [],
    recentChanges: [],
  };
}

export { getBusinessBrainOverview } from "@/modules/business-brain/services/business-brain-overview-service";

export { calculateBusinessBrainHealth } from "@/modules/business-brain/services/calculate-business-brain-health";

export { calculateBusinessBrainCoach } from "@/modules/business-brain/services/calculate-business-brain-coach";

export { calculateKnowledgeCoverage } from "@/modules/business-brain/services/knowledge-coverage-engine";
export {
  getCompanyDNA,
  saveDraft,
  updateCompanyDNA,
} from "@/modules/business-brain/services/company-dna-service";

export {
  archive,
  create,
  getProduct,
  getProducts,
  publish,
  update,
} from "@/modules/business-brain/services/business-brain-product-service";

export {
  create as createKnowledgeArticle,
  deleteArticle,
  getArticle,
  getArticles,
  publish as publishKnowledgeArticle,
  search,
  update as updateKnowledgeArticle,
} from "@/modules/business-brain/services/business-brain-knowledge-service";

export {
  deleteDocument,
  getDocument,
  getDocuments,
  publish as publishDocument,
  update as updateDocument,
  upload,
  uploadUrl,
} from "@/modules/business-brain/services/business-brain-document-service";

export {
  create as createBehavior,
  deleteBehavior,
  disable as disableBehavior,
  enable as enableBehavior,
  getBehaviors,
  getBehaviorsByType,
  update as updateBehavior,
  updateQualificationRules,
  updateReplyStyle,
} from "@/modules/business-brain/services/business-brain-behavior-service";

export {
  getActionPermission,
  getActionPermissions,
  updateActionPermission,
} from "@/modules/business-brain/services/business-brain-action-permission-service";

export {
  getAvailableContext,
  listSavedExamples,
  runTest as runPlaygroundTest,
  saveExample as savePlaygroundExample,
} from "@/modules/business-brain/services/business-brain-playground-service";

export {
  getDraftSummary,
  getPublishStatus,
  getVersions,
  publish as publishBusinessBrain,
} from "@/modules/business-brain/services/business-brain-publish-service";

export {
  buildBusinessBrainContext,
  buildBusinessBrainContextBody,
} from "@/modules/business-brain/services/context-builder";

export {
  buildWhatsAppSalesPrompt,
  buildWhatsAppSalesPromptSample,
  buildUsedSourceCatalog,
  sanitizeRetrievedContext,
  sanitizePromptContext,
} from "@/modules/business-brain/services/prompt-builder";
