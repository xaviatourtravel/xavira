export {
  ensureBusinessBrain,
  findBusinessBrainByOrganizationId,
  touchBusinessBrainDraftUpdatedAt,
  updateBusinessBrainPublishState,
} from "@/modules/business-brain/repositories/business-brain-repository";

export {
  findCompanyDnaByBusinessBrainId,
  mapCompanyDnaRow,
  upsertCompanyDna,
} from "@/modules/business-brain/repositories/company-dna-repository";

export {
  countProductDocumentsByProductIds,
  countProductFaqLinksByProductIds,
  createBrainProduct,
  findBrainProductById,
  listBrainProducts,
  mapBrainProductFormValues,
  mapBrainProductRowToListItem,
  updateBrainProduct,
  updateBrainProductStatus,
} from "@/modules/business-brain/repositories/brain-product-repository";

export {
  deleteProductDocument,
  findProductDocumentById,
  insertProductDocument,
  listProductDocuments,
} from "@/modules/business-brain/repositories/product-document-repository";

export {
  deleteProductFaqLink,
  insertProductFaqLink,
  listProductFaqLinks,
} from "@/modules/business-brain/repositories/product-faq-link-repository";

export {
  createBrainArticle,
  deleteBrainArticle,
  findBrainArticleById,
  listBrainArticles,
  mapBrainArticleFormValues,
  mapBrainArticleListItem,
  updateBrainArticle,
  updateBrainArticleStatus,
} from "@/modules/business-brain/repositories/brain-article-repository";

export {
  listArticleProductLinks,
  replaceArticleProductLinks,
} from "@/modules/business-brain/repositories/brain-article-product-repository";

export {
  listDocumentArticleLinks,
  listDocumentProductLinks,
  replaceDocumentArticleLinks,
  replaceDocumentProductLinks,
} from "@/modules/business-brain/repositories/brain-document-relations-repository";

export {
  deleteBrainDocument,
  findBrainDocumentById,
  insertBrainDocument,
  listBrainDocuments,
  listDocumentTriggers,
  mapBrainDocumentListFields,
  replaceDocumentTriggers,
  updateBrainDocument,
  updateBrainDocumentStatus,
  countDocumentProductsByDocumentIds,
} from "@/modules/business-brain/repositories/brain-document-repository";

export {
  deleteBrainBehavior,
  findBrainBehaviorById,
  insertBrainBehavior,
  listBrainBehaviors,
  listBrainBehaviorsByType,
  mapBrainBehaviorRow,
  setBrainBehaviorEnabled,
  updateBrainBehavior,
} from "@/modules/business-brain/repositories/brain-behavior-repository";

export {
  findBrainVersionById,
  getMaxVersionNumber,
  insertBrainVersion,
  listBrainVersions,
  supersedePublishedVersions,
} from "@/modules/business-brain/repositories/brain-version-repository";

/** Repository layer for Business Brain — wire to Supabase in a future iteration. */
export const businessBrainRepository = {
  async listRecentChanges() {
    return [] as const;
  },
};
