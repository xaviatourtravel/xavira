export const BRAIN_PRODUCT_STATUSES = ["draft", "published", "archived"] as const;
export type BrainProductStatus = (typeof BRAIN_PRODUCT_STATUSES)[number];

export const BRAIN_PRODUCT_CATEGORIES = [
  "Umrah Package",
  "Hajj Package",
  "Tour Package",
  "Domestic Tour",
  "International Tour",
  "Custom Package",
  "Other",
] as const;

export type BrainProductCategory = (typeof BRAIN_PRODUCT_CATEGORIES)[number];

export const PRODUCT_DOCUMENT_TYPES = [
  "itinerary",
  "brochure",
  "gallery",
  "video",
] as const;

export type ProductDocumentType = (typeof PRODUCT_DOCUMENT_TYPES)[number];

export const DEPARTURE_STATUSES = ["open", "full", "waiting_list"] as const;
export type DepartureStatus = (typeof DEPARTURE_STATUSES)[number];

export const PRODUCT_CURRENCIES = ["IDR", "USD", "SGD", "MYR"] as const;
export type ProductCurrency = (typeof PRODUCT_CURRENCIES)[number];

export type ProductPricingItem = {
  id: string;
  packageName: string;
  price: number;
  currency: ProductCurrency;
  validUntil: string;
  earlyBird?: string;
  promo?: string;
};

export type ProductDepartureItem = {
  id: string;
  departureDate: string;
  availableSeats: number;
  status: DepartureStatus;
};

export type BrainProductFormValues = {
  name: string;
  category: BrainProductCategory | "";
  destination: string;
  status: BrainProductStatus;
  description: string;
  highlights: string[];
  pricing: ProductPricingItem[];
  departures: ProductDepartureItem[];
  included: string[];
  excluded: string[];
  aiNotes: string;
};

export type ProductDocumentRecord = {
  id: string;
  productId: string;
  documentType: ProductDocumentType;
  fileName: string | null;
  filePath: string | null;
  fileUrl: string | null;
  mimeType: string | null;
  createdAt: string;
};

export type ProductFaqLinkRecord = {
  id: string;
  productId: string;
  knowledgeEntryId: string;
  knowledgeTitle: string;
  knowledgeCategory: string;
  createdAt: string;
};

export type BrainProductListItem = {
  id: string;
  name: string;
  category: string;
  destination: string;
  status: BrainProductStatus;
  updatedAt: string;
  knowledgeScore: number;
  documentCount: number;
  faqCount: number;
};

export type BrainProductDetail = BrainProductFormValues & {
  id: string;
  businessBrainId: string;
  createdAt: string;
  updatedAt: string;
  knowledgeScore: number;
  documents: ProductDocumentRecord[];
  faqLinks: ProductFaqLinkRecord[];
};

export const DEFAULT_BRAIN_PRODUCT_FORM: BrainProductFormValues = {
  name: "",
  category: "",
  destination: "",
  status: "draft",
  description: "",
  highlights: [],
  pricing: [],
  departures: [],
  included: [],
  excluded: [],
  aiNotes: "",
};

export const BRAIN_PRODUCT_STATUS_LABELS: Record<BrainProductStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export const PRODUCT_DOCUMENT_TYPE_LABELS: Record<ProductDocumentType, string> = {
  itinerary: "Itinerary PDF",
  brochure: "Brochure",
  gallery: "Gallery",
  video: "Video",
};

export const DEPARTURE_STATUS_LABELS: Record<DepartureStatus, string> = {
  open: "Open",
  full: "Full",
  waiting_list: "Waiting List",
};

export const HIGHLIGHT_SUGGESTIONS = [
  "Muslim Friendly",
  "Direct Flight",
  "No Hidden Cost",
  "High Speed Train",
  "Halal Meals",
  "5-Star Hotel",
  "Guided Tour",
  "Small Group",
] as const;
