import type { BusinessBrainDashboardPlaceholder } from "@/modules/business-brain/types";

/** Static placeholder dashboard until Business Brain data sources are wired. */
export function getBusinessBrainDashboardPlaceholder(): BusinessBrainDashboardPlaceholder {
  return {
    metrics: [
      {
        id: "brain-health",
        title: "Brain Health",
        description: "Overall completeness of your business knowledge.",
        statusLabel: "Not configured",
      },
      {
        id: "ai-readiness",
        title: "AI Readiness",
        description: "How prepared AI is to assist customers and your team.",
        statusLabel: "Setup pending",
      },
      {
        id: "knowledge",
        title: "Knowledge",
        description: "FAQs, policies, and operational notes for AI context.",
        statusLabel: "No entries linked",
      },
      {
        id: "products",
        title: "Products",
        description: "Packages, itineraries, and sellable offers.",
        statusLabel: "No catalog linked",
      },
      {
        id: "documents",
        title: "Documents",
        description: "Brochures, SOPs, and reference files.",
        statusLabel: "No documents uploaded",
      },
      {
        id: "publish-status",
        title: "Publish Status",
        description: "What is live for AI and customer-facing channels.",
        statusLabel: "Nothing published",
      },
    ],
    suggestions: [],
    recentChanges: [],
  };
}

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
