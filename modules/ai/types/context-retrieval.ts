import type {
  BehaviorContext,
  BusinessBrainContext,
  CompanyDNAContext,
  DocumentContext,
  HandoverRuleContext,
  KnowledgeContext,
  ProductContext,
  QualificationRulesContext,
  ReplyStyleContext,
} from "@/modules/business-brain/types/context";

export type RetrievalSummary = {
  productCount: number;
  articleCount: number;
  documentCount: number;
  behaviorCount: number;
  matchedKeywords: string[];
  intent: string;
};

export type RetrievedBusinessBrainContext = {
  companyDNA: CompanyDNAContext | null;
  relevantProducts: ProductContext[];
  relevantArticles: KnowledgeContext[];
  relevantDocuments: DocumentContext[];
  relevantBehaviors: BehaviorContext[];
  handoverRules: HandoverRuleContext[];
  replyStyle: ReplyStyleContext | null;
  qualificationRules: QualificationRulesContext | null;
  retrievalSummary: RetrievalSummary;
};

export type RetrieveRelevantContextParams = {
  workspaceId: string;
  customerMessage: string;
  intent: string;
  businessBrainContext: BusinessBrainContext;
};

export const RETRIEVAL_LIMITS = {
  products: 3,
  articles: 5,
  documents: 3,
  behaviors: 10,
} as const;

export function toPromptBusinessBrainContext(
  retrieved: RetrievedBusinessBrainContext,
): BusinessBrainContext {
  return {
    companyDNA: retrieved.companyDNA,
    products: retrieved.relevantProducts,
    knowledge: retrieved.relevantArticles,
    documents: retrieved.relevantDocuments,
    behaviors: retrieved.relevantBehaviors,
    handoverRules: retrieved.handoverRules,
    replyStyle: retrieved.replyStyle,
    qualificationRules: retrieved.qualificationRules,
  };
}
