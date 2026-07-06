import type { BusinessBrainHealthInput } from "@/modules/business-brain/types/business-brain-health";
import {
  BUSINESS_BRAIN_COACH_CATEGORY_LABELS,
  BUSINESS_BRAIN_COACH_PROGRESS_ORDER,
  sortBusinessBrainCoachRecommendations,
  type BusinessBrainCoachCategory,
  type BusinessBrainCoachProgressItem,
  type BusinessBrainCoachRecommendation,
  type BusinessBrainCoachResult,
} from "@/modules/business-brain/types/business-brain-coach";

const CTA_ROUTES = {
  identity: "/business-brain/identity",
  knowledge: "/business-brain/knowledge",
  knowledgeRefund: "/business-brain/knowledge?category=refund",
  knowledgeVisa: "/business-brain/knowledge?category=visa",
  knowledgeFaq: "/business-brain/knowledge?category=faq",
  products: "/business-brain/products",
  documents: "/business-brain/documents",
  rules: "/business-brain/behaviors",
  publish: "/business-brain/publish",
  testAi: "/business-brain/playground",
} as const;

const WEIGHTS = {
  identity: 0.2,
  products: 0.2,
  knowledge: 0.25,
  documents: 0.15,
  rules: 0.2,
} as const;

function hasText(value: string, minLength = 1): boolean {
  return value.trim().length >= minLength;
}

function formatImpact(sectionPoints: number, sectionWeight: number): string {
  const overallGain = Math.round(sectionPoints * sectionWeight);
  return `+${Math.max(1, overallGain)}% AI Readiness`;
}

function impactValue(sectionPoints: number, sectionWeight: number): number {
  return Math.max(1, Math.round(sectionPoints * sectionWeight));
}

function knowledgeMentionsComplaint(
  articles: BusinessBrainHealthInput["knowledge"],
): boolean {
  const complaintPattern = /complaint|komplain|keluhan|handover/i;
  return articles.some((article) => {
    const haystack = [article.title, article.content, ...article.keywords]
      .join(" ")
      .toLowerCase();
    return complaintPattern.test(haystack);
  });
}

type CoachRecommendationDraft = Omit<
  BusinessBrainCoachRecommendation,
  "impact" | "impactValue"
> & {
  sectionPoints: number;
  sectionWeight: number;
};

function finalizeRecommendation(draft: CoachRecommendationDraft): BusinessBrainCoachRecommendation {
  return {
    id: draft.id,
    category: draft.category,
    title: draft.title,
    description: draft.description,
    impact: formatImpact(draft.sectionPoints, draft.sectionWeight),
    impactValue: impactValue(draft.sectionPoints, draft.sectionWeight),
    difficulty: draft.difficulty,
    estimatedTime: draft.estimatedTime,
    priority: draft.priority,
    targetPage: draft.targetPage,
    cta: draft.cta,
  };
}

function deriveProgress(input: BusinessBrainHealthInput): BusinessBrainCoachProgressItem[] {
  const identity = input.identity;
  const activeProducts = input.products.filter((product) => product.status !== "archived");
  const enabledRules = input.behaviors.filter((behavior) => behavior.enabled);

  const completion: Record<BusinessBrainCoachCategory, boolean> = {
    identity: Boolean(
      identity &&
        hasText(identity.companyName) &&
        hasText(identity.industry) &&
        hasText(identity.about, 20),
    ),
    products:
      activeProducts.length > 0 &&
      activeProducts.some((product) => hasText(product.description, 20)),
    knowledge: input.knowledge.length > 0,
    documents: input.documents.length > 0,
    rules: enabledRules.length > 0,
    publish: input.isPublished,
  };

  return BUSINESS_BRAIN_COACH_PROGRESS_ORDER.map((id) => ({
    id,
    label: BUSINESS_BRAIN_COACH_CATEGORY_LABELS[id],
    complete: completion[id],
  }));
}

function deriveRecommendations(input: BusinessBrainHealthInput): BusinessBrainCoachRecommendation[] {
  const drafts: CoachRecommendationDraft[] = [];
  const identity = input.identity;
  const categories = new Set(input.knowledge.map((article) => article.category));
  const activeProducts = input.products.filter((product) => product.status !== "archived");
  const productsWithItinerary = activeProducts.filter((product) => product.hasItinerary);
  const hasComplaintHandover = input.behaviors.some(
    (behavior) =>
      behavior.enabled &&
      behavior.type === "HANDOVER_RULE" &&
      behavior.triggerIntent === "complaint",
  );

  if (!identity || !hasText(identity.companyName)) {
    drafts.push({
      id: "identity-company-name",
      category: "identity",
      title: "Company Name Missing",
      description: "Your AI needs your business name to introduce itself correctly.",
      sectionPoints: 20,
      sectionWeight: WEIGHTS.identity,
      difficulty: "easy",
      estimatedTime: "2 min",
      priority: "critical",
      targetPage: CTA_ROUTES.identity,
      cta: "Complete Identity",
    });
  }

  if (!identity || !hasText(identity.industry)) {
    drafts.push({
      id: "identity-industry",
      category: "identity",
      title: "Industry Not Set",
      description: "Industry context helps your AI tailor answers to your business type.",
      sectionPoints: 20,
      sectionWeight: WEIGHTS.identity,
      difficulty: "easy",
      estimatedTime: "2 min",
      priority: "critical",
      targetPage: CTA_ROUTES.identity,
      cta: "Set Industry",
    });
  }

  if (!identity || !hasText(identity.about, 20)) {
    drafts.push({
      id: "identity-about",
      category: "identity",
      title: "Company Description Incomplete",
      description: "A clear description improves answer accuracy and tone in every conversation.",
      sectionPoints: 25,
      sectionWeight: WEIGHTS.identity,
      difficulty: "easy",
      estimatedTime: "5 min",
      priority: "critical",
      targetPage: CTA_ROUTES.identity,
      cta: "Add About Company",
    });
  }

  if (identity && identity.brandPersonality.length === 0) {
    drafts.push({
      id: "identity-personality",
      category: "identity",
      title: "Brand Personality Undefined",
      description: "Personality traits guide how your AI sounds when speaking to customers.",
      sectionPoints: 15,
      sectionWeight: WEIGHTS.identity,
      difficulty: "easy",
      estimatedTime: "5 min",
      priority: "optional",
      targetPage: CTA_ROUTES.identity,
      cta: "Add Brand Personality",
    });
  }

  if (activeProducts.length === 0) {
    drafts.push({
      id: "add-product",
      category: "products",
      title: "No Products Added",
      description: "Without products, your AI cannot recommend packages or itineraries.",
      sectionPoints: 20,
      sectionWeight: WEIGHTS.products,
      difficulty: "medium",
      estimatedTime: "15 min",
      priority: "critical",
      targetPage: CTA_ROUTES.products,
      cta: "Add Product",
    });
  }

  if (activeProducts.length > 0 && productsWithItinerary.length === 0) {
    drafts.push({
      id: "product-itinerary",
      category: "products",
      title: "Product Itineraries Missing",
      description: "Customers asking for schedules need itinerary files attached to products.",
      sectionPoints: 20,
      sectionWeight: WEIGHTS.products,
      difficulty: "medium",
      estimatedTime: "10 min",
      priority: "recommended",
      targetPage: CTA_ROUTES.products,
      cta: "Upload Itinerary",
    });
  }

  if (input.knowledge.length === 0) {
    drafts.push({
      id: "add-knowledge",
      category: "knowledge",
      title: "Knowledge Base Empty",
      description: "Policies and FAQs are the primary source of truth for your AI answers.",
      sectionPoints: 25,
      sectionWeight: WEIGHTS.knowledge,
      difficulty: "medium",
      estimatedTime: "15 min",
      priority: "critical",
      targetPage: CTA_ROUTES.knowledge,
      cta: "Add Knowledge",
    });
  }

  if (!categories.has("refund")) {
    drafts.push({
      id: "knowledge-refund",
      category: "knowledge",
      title: "Refund Policy Missing",
      description: "Your AI cannot confidently answer refund questions.",
      sectionPoints: 15,
      sectionWeight: WEIGHTS.knowledge,
      difficulty: "easy",
      estimatedTime: "5 min",
      priority: "critical",
      targetPage: CTA_ROUTES.knowledgeRefund,
      cta: "Create Policy",
    });
  }

  if (!categories.has("visa")) {
    drafts.push({
      id: "knowledge-visa",
      category: "knowledge",
      title: "Visa Information Missing",
      description: "Travel customers often ask about visa requirements early in the conversation.",
      sectionPoints: 15,
      sectionWeight: WEIGHTS.knowledge,
      difficulty: "easy",
      estimatedTime: "5 min",
      priority: "recommended",
      targetPage: CTA_ROUTES.knowledgeVisa,
      cta: "Add Visa Article",
    });
  }

  if (!categories.has("faq") && input.knowledge.length > 0) {
    drafts.push({
      id: "knowledge-faq",
      category: "knowledge",
      title: "FAQ Articles Missing",
      description: "FAQs give your AI quick, reliable answers to common customer questions.",
      sectionPoints: 15,
      sectionWeight: WEIGHTS.knowledge,
      difficulty: "easy",
      estimatedTime: "5 min",
      priority: "recommended",
      targetPage: CTA_ROUTES.knowledgeFaq,
      cta: "Add FAQ",
    });
  }

  if (!knowledgeMentionsComplaint(input.knowledge) && !hasComplaintHandover) {
    drafts.push({
      id: "complaint-handling",
      category: "rules",
      title: "Complaint Handling Not Configured",
      description: "Your AI should know when to hand over sensitive complaint conversations.",
      sectionPoints: 10,
      sectionWeight: WEIGHTS.knowledge,
      difficulty: "medium",
      estimatedTime: "10 min",
      priority: "recommended",
      targetPage: CTA_ROUTES.rules,
      cta: "Add Handover Rule",
    });
  }

  if (input.documents.length === 0) {
    drafts.push({
      id: "upload-document",
      category: "documents",
      title: "No Documents Uploaded",
      description: "Brochures and itineraries can be sent automatically when customers ask.",
      sectionPoints: 30,
      sectionWeight: WEIGHTS.documents,
      difficulty: "medium",
      estimatedTime: "10 min",
      priority: "recommended",
      targetPage: CTA_ROUTES.documents,
      cta: "Upload Document",
    });
  }

  if (input.behaviors.filter((behavior) => behavior.enabled).length === 0) {
    drafts.push({
      id: "configure-rules",
      category: "rules",
      title: "No Active Rules",
      description: "Rules define what your AI should always do, never do, and when to escalate.",
      sectionPoints: 25,
      sectionWeight: WEIGHTS.rules,
      difficulty: "medium",
      estimatedTime: "10 min",
      priority: "recommended",
      targetPage: CTA_ROUTES.rules,
      cta: "Configure Rules",
    });
  }

  if (!input.isPublished) {
    drafts.push({
      id: "publish-brain",
      category: "publish",
      title: "Business Brain Not Published",
      description: "Draft content is not used in live customer conversations until published.",
      sectionPoints: 15,
      sectionWeight: 1,
      difficulty: "easy",
      estimatedTime: "2 min",
      priority: "critical",
      targetPage: CTA_ROUTES.publish,
      cta: "Publish Business Brain",
    });
  }

  const seen = new Set<string>();
  return sortBusinessBrainCoachRecommendations(
    drafts
      .filter((draft) => {
        if (seen.has(draft.id)) return false;
        seen.add(draft.id);
        return true;
      })
      .map(finalizeRecommendation),
  );
}

export function calculateBusinessBrainCoach(
  input: BusinessBrainHealthInput,
): BusinessBrainCoachResult {
  const allProgress = deriveProgress(input);
  const completedAreas = allProgress.filter((item) => item.complete);
  const missingAreas = allProgress.filter((item) => !item.complete);
  const recommendations = deriveRecommendations(input);
  const isReady = missingAreas.length === 0;

  return {
    isReady,
    completedAreas,
    missingAreas,
    recommendations,
  };
}

export function emptyBusinessBrainCoachResult(): BusinessBrainCoachResult {
  return calculateBusinessBrainCoach({
    identity: null,
    products: [],
    knowledge: [],
    documents: [],
    behaviors: [],
    isPublished: false,
  });
}
