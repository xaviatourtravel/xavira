export const BRAIN_ARTICLE_CATEGORIES = [
  "faq",
  "payment",
  "visa",
  "halal",
  "terms",
  "refund",
  "insurance",
  "custom",
] as const;

export type BrainArticleCategory = (typeof BRAIN_ARTICLE_CATEGORIES)[number];

export const BRAIN_ARTICLE_CATEGORY_LABELS: Record<BrainArticleCategory, string> = {
  faq: "FAQ",
  payment: "Payment",
  visa: "Visa",
  halal: "Halal",
  terms: "Terms",
  refund: "Refund",
  insurance: "Insurance",
  custom: "Custom",
};

export const BRAIN_ARTICLE_VISIBILITIES = ["internal", "ai_only", "public"] as const;
export type BrainArticleVisibility = (typeof BRAIN_ARTICLE_VISIBILITIES)[number];

export const BRAIN_ARTICLE_VISIBILITY_LABELS: Record<BrainArticleVisibility, string> = {
  internal: "Internal",
  ai_only: "AI Only",
  public: "Public",
};

export const BRAIN_ARTICLE_STATUSES = ["draft", "published"] as const;
export type BrainArticleStatus = (typeof BRAIN_ARTICLE_STATUSES)[number];

export const BRAIN_ARTICLE_STATUS_LABELS: Record<BrainArticleStatus, string> = {
  draft: "Draft",
  published: "Published",
};

export type BrainArticleAiMetadata = {
  confidenceWeight?: number | null;
  priority?: number | null;
  relatedDocuments?: string[];
};

export type BrainArticleFormValues = {
  title: string;
  category: BrainArticleCategory;
  content: string;
  keywords: string[];
  visibility: BrainArticleVisibility;
  status: BrainArticleStatus;
  relatedProductIds: string[];
  aiMetadata: BrainArticleAiMetadata;
};

export type BrainArticleListItem = {
  id: string;
  title: string;
  category: BrainArticleCategory;
  status: BrainArticleStatus;
  visibility: BrainArticleVisibility;
  updatedAt: string;
};

export type BrainArticleRelatedProduct = {
  id: string;
  productId: string;
  productName: string;
};

export type BrainArticleDetail = BrainArticleFormValues & {
  id: string;
  businessBrainId: string;
  createdAt: string;
  updatedAt: string;
  relatedProducts: BrainArticleRelatedProduct[];
};

export const DEFAULT_BRAIN_ARTICLE_FORM: BrainArticleFormValues = {
  title: "",
  category: "faq",
  content: "",
  keywords: [],
  visibility: "ai_only",
  status: "draft",
  relatedProductIds: [],
  aiMetadata: {
    confidenceWeight: null,
    priority: null,
    relatedDocuments: [],
  },
};

export type BrainArticleSearchFilters = {
  query?: string;
  category?: BrainArticleCategory | "all";
  status?: BrainArticleStatus | "all";
};
