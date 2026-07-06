import type { BbUiKey } from "@/lib/i18n/bb-ui-dictionary";
import { formatTranslation } from "@/lib/i18n/dictionary";
import type {
  HandoverTriggerIntent,
  QualificationConfig,
} from "@/modules/business-brain/types/behaviors";
import type {
  BrainArticleCategory,
  BrainArticleStatus,
  BrainArticleVisibility,
} from "@/modules/business-brain/types/knowledge";
import type {
  BrainDocumentStatus,
  BrainDocumentType,
  BrainDocumentTrigger,
} from "@/modules/business-brain/types/documents";
import type { BrainProductStatus } from "@/modules/business-brain/types/products";
import type {
  DepartureStatus,
  ProductDocumentType,
} from "@/modules/business-brain/types/products";
import type { BrainBehaviorType } from "@/modules/business-brain/types/behaviors";
import type { KnowledgeCoverageStatus } from "@/modules/business-brain/types/knowledge-coverage";
import type {
  AiGoal,
  BrandPersonality,
  CompanyDnaIndustry,
  SalesStyle,
} from "@/modules/business-brain/types/company-dna";

type BbFn = (key: BbUiKey) => string;

const ARTICLE_CATEGORY_KEYS: Record<BrainArticleCategory, BbUiKey> = {
  faq: "categoryFaq",
  payment: "categoryPayment",
  visa: "categoryVisa",
  halal: "categoryHalal",
  terms: "categoryTerms",
  refund: "categoryRefund",
  insurance: "categoryInsurance",
  custom: "categoryCustom",
};

const VISIBILITY_KEYS: Record<BrainArticleVisibility, BbUiKey> = {
  internal: "visibilityInternal",
  ai_only: "visibilityAiOnly",
  public: "visibilityPublic",
};

const DOCUMENT_TYPE_KEYS: Record<BrainDocumentType, BbUiKey> = {
  pdf: "docTypePdf",
  image: "docTypeImage",
  video: "docTypeVideo",
  url: "docTypeUrl",
};

const BEHAVIOR_TYPE_KEYS: Record<BrainBehaviorType, BbUiKey> = {
  ALWAYS_DO: "alwaysDo",
  NEVER_DO: "neverDo",
  HANDOVER_RULE: "handoverRules",
  REPLY_STYLE: "replyStyle",
  QUALIFICATION_RULE: "qualificationRules",
};

const BEHAVIOR_TYPE_DESC_KEYS: Record<BrainBehaviorType, BbUiKey> = {
  ALWAYS_DO: "behaviorTypeAlwaysDoDesc",
  NEVER_DO: "behaviorTypeNeverDoDesc",
  HANDOVER_RULE: "behaviorTypeHandoverDesc",
  REPLY_STYLE: "behaviorTypeReplyStyleDesc",
  QUALIFICATION_RULE: "behaviorTypeQualificationDesc",
};

const DEPARTURE_STATUS_KEYS: Record<DepartureStatus, BbUiKey> = {
  open: "departureOpen",
  full: "departureFull",
  waiting_list: "departureWaitingList",
};

const PRODUCT_DOCUMENT_TYPE_KEYS: Record<ProductDocumentType, BbUiKey> = {
  itinerary: "productDocItinerary",
  brochure: "productDocBrochure",
  gallery: "productDocGallery",
  video: "video",
};

export function bbProductStatusLabel(bb: BbFn, status: BrainProductStatus): string {
  return bb(status);
}

export function bbArticleStatusLabel(bb: BbFn, status: BrainArticleStatus): string {
  return bb(status);
}

export function bbDocumentStatusLabel(bb: BbFn, status: BrainDocumentStatus): string {
  return bb(status);
}

export function bbArticleCategoryLabel(bb: BbFn, category: BrainArticleCategory): string {
  return bb(ARTICLE_CATEGORY_KEYS[category]);
}

export function bbArticleVisibilityLabel(bb: BbFn, visibility: BrainArticleVisibility): string {
  return bb(VISIBILITY_KEYS[visibility]);
}

export function bbDocumentTypeLabel(bb: BbFn, type: BrainDocumentType): string {
  return bb(DOCUMENT_TYPE_KEYS[type]);
}

export function bbBehaviorTypeLabel(bb: BbFn, type: BrainBehaviorType): string {
  return bb(BEHAVIOR_TYPE_KEYS[type]);
}

export function bbBehaviorTypeDescription(bb: BbFn, type: BrainBehaviorType): string {
  return bb(BEHAVIOR_TYPE_DESC_KEYS[type]);
}

export function bbDepartureStatusLabel(bb: BbFn, status: DepartureStatus): string {
  return bb(DEPARTURE_STATUS_KEYS[status]);
}

export function bbProductDocumentTypeLabel(bb: BbFn, type: ProductDocumentType): string {
  return bb(PRODUCT_DOCUMENT_TYPE_KEYS[type]);
}

export function bbKnowledgeScoreLabel(bb: BbFn, score: number): string {
  if (score >= 80) return bb("scoreStrong");
  if (score >= 50) return bb("scoreGood");
  if (score >= 25) return bb("scoreBasic");
  return bb("scoreLow");
}

export function bbDocsCount(bb: BbFn, count: number): string {
  return formatTranslation(bb("docsCount"), { count });
}

export function bbDisplayProductName(bb: BbFn, name: string): string {
  if (!name.trim() || name === "Untitled Product") {
    return bb("untitledProduct");
  }
  return name;
}

export function bbDisplayArticleTitle(bb: BbFn, title: string): string {
  if (!title.trim() || title === "Untitled Article") {
    return bb("untitledArticle");
  }
  return title;
}

export function bbDisplayDocumentName(bb: BbFn, name: string): string {
  if (!name.trim() || name === "Untitled Document") {
    return bb("untitledDocument");
  }
  return name;
}

const DOCUMENT_TRIGGER_KEYS: Record<BrainDocumentTrigger, BbUiKey> = {
  customer_asks_itinerary: "triggerCustomerAsksItinerary",
  customer_asks_brochure: "triggerCustomerAsksBrochure",
  customer_asks_package_details: "triggerCustomerAsksPackageDetails",
  customer_asks_visa: "triggerCustomerAsksVisa",
  customer_asks_payment: "triggerCustomerAsksPayment",
  customer_asks_company_profile: "triggerCustomerAsksCompanyProfile",
};

const COVERAGE_STATUS_KEYS: Record<KnowledgeCoverageStatus, BbUiKey> = {
  Excellent: "coverageExcellent",
  Good: "coverageGood",
  Fair: "coverageFair",
  Poor: "coveragePoor",
};

export function bbDocumentTriggerLabel(bb: BbFn, trigger: BrainDocumentTrigger): string {
  return bb(DOCUMENT_TRIGGER_KEYS[trigger]);
}

export function bbCoverageStatusLabel(bb: BbFn, status: KnowledgeCoverageStatus): string {
  return bb(COVERAGE_STATUS_KEYS[status]);
}

export function bbScorePercent(bb: BbFn, score: number): string {
  return formatTranslation(bb("scorePercent"), { score });
}

const HANDOVER_TRIGGER_KEYS: Record<HandoverTriggerIntent, BbUiKey> = {
  negotiation: "triggerNegotiation",
  payment_proof: "triggerPaymentProof",
  complaint: "triggerComplaint",
  refund: "triggerRefund",
  phone_call_request: "triggerPhoneCallRequest",
  custom_private_trip: "triggerCustomPrivateTrip",
};

const QUALIFICATION_FIELD_KEYS: Record<keyof QualificationConfig, BbUiKey> = {
  destination: "destination",
  departureMonth: "departureMonth",
  passengerCount: "passengerCount",
  budget: "budget",
  privateOrGroup: "privateOrGroup",
  specialNeeds: "specialNeeds",
};

const BRAND_PERSONALITY_KEYS: Record<BrandPersonality, BbUiKey> = {
  Friendly: "brandFriendly",
  Professional: "brandProfessional",
  Casual: "casual",
  Luxury: "brandLuxury",
  Corporate: "brandCorporate",
  "Muslim Friendly": "brandMuslimFriendly",
  "Gen Z": "brandGenZ",
  Premium: "brandPremium",
  Minimalist: "brandMinimalist",
};

const INDUSTRY_KEYS: Record<CompanyDnaIndustry, BbUiKey> = {
  "Travel & Tour": "industryTravelTour",
  "Umrah & Hajj": "industryUmrahHajj",
  Hospitality: "industryHospitality",
  Retail: "industryRetail",
  "Food & Beverage": "industryFoodBeverage",
  "Professional Services": "industryProfessionalServices",
  Technology: "industryTechnology",
  Healthcare: "industryHealthcare",
  Education: "industryEducation",
  Other: "industryOther",
};

const AI_GOAL_KEYS: Record<AiGoal, BbUiKey> = {
  answer_faq: "goalAnswerFaq",
  recommend_products: "goalRecommendProducts",
  qualify_leads: "goalQualifyLeads",
  close_leads: "goalCloseLeads",
  customer_support: "goalCustomerSupport",
  upsell: "goalUpsell",
  cross_sell: "goalCrossSell",
};

const SALES_STYLE_KEYS: Record<SalesStyle, BbUiKey> = {
  educate_first: "educateFirst",
  consultative: "consultative",
  hard_sell: "hardSell",
  relationship_based: "relationshipBased",
};

export const ALWAYS_DO_EXAMPLE_KEYS = [
  "alwaysDoExAskDepartureMonth",
  "alwaysDoExAskPassengerCount",
  "alwaysDoExRecommendPackage",
  "alwaysDoExOfferBrochure",
  "alwaysDoExMuslimFriendly",
  "alwaysDoExConfirmBudget",
] as const satisfies readonly BbUiKey[];

export const NEVER_DO_EXAMPLE_KEYS = [
  "neverDoExNegotiatePrice",
  "neverDoExPromiseSeats",
  "neverDoExMentionCompetitors",
  "neverDoExMentionDesklabs",
  "neverDoExInventItinerary",
  "neverDoExConfirmWithoutHuman",
] as const satisfies readonly BbUiKey[];

export function bbHandoverTriggerLabel(bb: BbFn, intent: HandoverTriggerIntent): string {
  return bb(HANDOVER_TRIGGER_KEYS[intent]);
}

export function bbQualificationFieldLabel(
  bb: BbFn,
  field: keyof QualificationConfig,
): string {
  return bb(QUALIFICATION_FIELD_KEYS[field]);
}

export function bbBrandPersonalityLabel(bb: BbFn, personality: BrandPersonality): string {
  return bb(BRAND_PERSONALITY_KEYS[personality]);
}

export function bbIndustryLabel(bb: BbFn, industry: CompanyDnaIndustry): string {
  return bb(INDUSTRY_KEYS[industry]);
}

export function bbAiGoalLabel(bb: BbFn, goal: AiGoal): string {
  return bb(AI_GOAL_KEYS[goal]);
}

export function bbSalesStyleLabel(bb: BbFn, style: SalesStyle): string {
  return bb(SALES_STYLE_KEYS[style]);
}

export function bbHandoverExampleLabel(
  bb: BbFn,
  trigger: HandoverTriggerIntent,
  role: string,
): string {
  return formatTranslation(bb("handoverExampleLabel"), {
    trigger: bbHandoverTriggerLabel(bb, trigger),
    role,
  });
}

export function bbRemoveItemLabel(bb: BbFn, item: string): string {
  return formatTranslation(bb("removeItem"), { item });
}
