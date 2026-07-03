import type {
  HandoverAssignRole,
  HandoverRuleConfig,
  HandoverTriggerIntent,
  QualificationConfig,
  ReplyStyleConfig,
} from "@/modules/business-brain/types/behaviors";
import type {
  AiGoal,
  BrandPersonality,
  CommunicationStyle,
  CompanyDnaIndustry,
  SalesStyle,
} from "@/modules/business-brain/types/company-dna";
import type { BrainDocumentType } from "@/modules/business-brain/types/documents";
import type { BrainArticleCategory, BrainArticleVisibility } from "@/modules/business-brain/types/knowledge";
import type {
  BrainProductCategory,
  ProductDepartureItem,
  ProductPricingItem,
} from "@/modules/business-brain/types/products";

export type BusinessBrainContextSource = "published" | "draft" | "empty";

export type CompanyDNAContext = {
  companyName: string;
  industry: CompanyDnaIndustry | "";
  website: string;
  about: string;
  brandPersonality: BrandPersonality[];
  communicationStyle: CommunicationStyle;
  salesStyle: SalesStyle;
  aiGoals: AiGoal[];
  neverRules: string[];
};

export type ProductContext = {
  id: string;
  name: string;
  category: BrainProductCategory | "";
  destination: string;
  description: string;
  highlights: string[];
  pricing: ProductPricingItem[];
  departures: ProductDepartureItem[];
  included: string[];
  excluded: string[];
  aiNotes: string;
  status: string;
};

export type KnowledgeContext = {
  id: string;
  title: string;
  category: BrainArticleCategory;
  content: string;
  keywords: string[];
  visibility: BrainArticleVisibility;
  status: string;
};

export type DocumentContext = {
  id: string;
  name: string;
  description: string;
  documentType: BrainDocumentType;
  tags: string[];
  publicUrl: string | null;
  autoSendEnabled: boolean;
  aiNotes: string;
  status: string;
};

export type BehaviorContext = {
  id: string;
  type: "ALWAYS_DO" | "NEVER_DO";
  name: string;
  description: string;
  enabled: boolean;
};

export type HandoverRuleContext = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  triggerIntent: HandoverTriggerIntent;
  assignToRole: HandoverAssignRole;
  handoffMessage: string;
};

export type ReplyStyleContext = {
  id: string;
  enabled: boolean;
  config: ReplyStyleConfig;
};

export type QualificationRulesContext = {
  id: string;
  enabled: boolean;
  config: QualificationConfig;
};

export type BusinessBrainContext = {
  companyDNA: CompanyDNAContext | null;
  products: ProductContext[];
  knowledge: KnowledgeContext[];
  documents: DocumentContext[];
  behaviors: BehaviorContext[];
  handoverRules: HandoverRuleContext[];
  replyStyle: ReplyStyleContext | null;
  qualificationRules: QualificationRulesContext | null;
};

export type BusinessBrainContextMeta = {
  workspaceId: string;
  businessBrainId: string | null;
  source: BusinessBrainContextSource;
  publishedVersionId: string | null;
  publishedVersionNumber: number | null;
  builtAt: string;
};

export type BusinessBrainContextResult = BusinessBrainContext & {
  meta: BusinessBrainContextMeta;
};

export type BuildBusinessBrainContextOptions = {
  productId?: string;
  customerMessage?: string;
  includeDraft?: boolean;
};

export const EMPTY_BUSINESS_BRAIN_CONTEXT: BusinessBrainContext = {
  companyDNA: null,
  products: [],
  knowledge: [],
  documents: [],
  behaviors: [],
  handoverRules: [],
  replyStyle: null,
  qualificationRules: null,
};
