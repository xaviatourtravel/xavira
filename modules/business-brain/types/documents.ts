export const BRAIN_DOCUMENT_TYPES = ["pdf", "image", "video", "url"] as const;
export type BrainDocumentType = (typeof BRAIN_DOCUMENT_TYPES)[number];

export const BRAIN_DOCUMENT_TYPE_LABELS: Record<BrainDocumentType, string> = {
  pdf: "PDF",
  image: "Image",
  video: "Video",
  url: "URL",
};

export const BRAIN_DOCUMENT_STATUSES = ["draft", "published"] as const;
export type BrainDocumentStatus = (typeof BRAIN_DOCUMENT_STATUSES)[number];

export const BRAIN_DOCUMENT_STATUS_LABELS: Record<BrainDocumentStatus, string> = {
  draft: "Draft",
  published: "Published",
};

export const BRAIN_DOCUMENT_TRIGGERS = [
  "customer_asks_itinerary",
  "customer_asks_brochure",
  "customer_asks_package_details",
  "customer_asks_visa",
  "customer_asks_payment",
  "customer_asks_company_profile",
] as const;

export type BrainDocumentTrigger = (typeof BRAIN_DOCUMENT_TRIGGERS)[number];

export const BRAIN_DOCUMENT_TRIGGER_LABELS: Record<BrainDocumentTrigger, string> = {
  customer_asks_itinerary: "Customer asks itinerary",
  customer_asks_brochure: "Customer asks brochure",
  customer_asks_package_details: "Customer asks package details",
  customer_asks_visa: "Customer asks visa",
  customer_asks_payment: "Customer asks payment",
  customer_asks_company_profile: "Customer asks company profile",
};

export type BrainDocumentFormValues = {
  name: string;
  description: string;
  documentType: BrainDocumentType;
  tags: string[];
  relatedProductIds: string[];
  relatedArticleIds: string[];
  autoSendEnabled: boolean;
  triggers: BrainDocumentTrigger[];
  aiNotes: string;
  status: BrainDocumentStatus;
};

export type BrainDocumentListItem = {
  id: string;
  name: string;
  documentType: BrainDocumentType;
  status: BrainDocumentStatus;
  autoSendEnabled: boolean;
  linkedProductCount: number;
  updatedAt: string;
  createdAt: string;
};

export type BrainDocumentRelatedProduct = {
  id: string;
  productId: string;
  productName: string;
};

export type BrainDocumentRelatedArticle = {
  id: string;
  articleId: string;
  articleTitle: string;
};

export type BrainDocumentDetail = BrainDocumentFormValues & {
  id: string;
  businessBrainId: string;
  storagePath: string | null;
  publicUrl: string | null;
  mimeType: string | null;
  fileSize: number | null;
  previewUrl: string | null;
  createdAt: string;
  updatedAt: string;
  relatedProducts: BrainDocumentRelatedProduct[];
  relatedArticles: BrainDocumentRelatedArticle[];
};

export const DEFAULT_BRAIN_DOCUMENT_FORM: BrainDocumentFormValues = {
  name: "",
  description: "",
  documentType: "pdf",
  tags: [],
  relatedProductIds: [],
  relatedArticleIds: [],
  autoSendEnabled: false,
  triggers: [],
  aiNotes: "",
  status: "draft",
};

export function inferDocumentTypeFromMime(mimeType: string): BrainDocumentType {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "pdf";
  return "pdf";
}

export function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
