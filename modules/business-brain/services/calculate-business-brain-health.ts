import type {
  BusinessBrainHealth,
  BusinessBrainHealthInput,
  BusinessBrainHealthRecommendation,
  BusinessBrainHealthRecommendationPriority,
} from "@/modules/business-brain/types/business-brain-health";
import { sortBusinessBrainRecommendations } from "@/modules/business-brain/types/business-brain-health";

const CTA_ROUTES = {
  identity: "/business-brain/identity",
  knowledge: "/business-brain/knowledge",
  knowledgeRefund: "/business-brain/knowledge?category=refund",
  knowledgeVisa: "/business-brain/knowledge?category=visa",
  knowledgeFaq: "/business-brain/knowledge?category=faq",
  products: "/business-brain/products",
  documents: "/business-brain/documents",
  behaviors: "/business-brain/behaviors",
  behaviorsHandover: "/business-brain/behaviors",
  publish: "/business-brain/publish",
} as const;

const WEIGHTS = {
  identity: 0.2,
  products: 0.2,
  knowledge: 0.25,
  documents: 0.15,
  behaviors: 0.2,
} as const;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function hasText(value: string, minLength = 1): boolean {
  return value.trim().length >= minLength;
}

function formatImpact(sectionPoints: number, sectionWeight: number): string {
  const overallGain = Math.round(sectionPoints * sectionWeight);
  return `+${Math.max(1, overallGain)}% Readiness Score`;
}

function calculateIdentityScore(identity: BusinessBrainHealthInput["identity"]): number {
  if (!identity) return 0;

  let score = 0;
  if (hasText(identity.companyName)) score += 20;
  if (hasText(identity.industry)) score += 20;
  if (hasText(identity.about, 20)) score += 25;
  if (identity.brandPersonality.length > 0) score += 15;
  if (identity.aiGoals.length > 0) score += 10;
  if (identity.neverRules.length > 0) score += 10;

  return clampScore(score);
}

function calculateProductScore(products: BusinessBrainHealthInput["products"]): number {
  if (products.length === 0) return 0;

  const active = products.filter((product) => product.status !== "archived");
  if (active.length === 0) return 0;

  let score = 20;

  const publishedRatio =
    active.filter((product) => product.status === "published").length / active.length;
  score += publishedRatio * 20;

  const describedRatio =
    active.filter((product) => hasText(product.description, 20)).length / active.length;
  score += describedRatio * 20;

  const pricedRatio =
    active.filter((product) => product.pricingCount > 0).length / active.length;
  score += pricedRatio * 20;

  const itineraryRatio =
    active.filter((product) => product.hasItinerary).length / active.length;
  score += itineraryRatio * 20;

  return clampScore(score);
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

function calculateKnowledgeScore(
  knowledge: BusinessBrainHealthInput["knowledge"],
  hasComplaintBehavior: boolean,
): number {
  if (knowledge.length === 0) return 0;

  let score = 25;

  const publishedRatio =
    knowledge.filter((article) => article.status === "published").length / knowledge.length;
  score += publishedRatio * 20;

  const categories = new Set(knowledge.map((article) => article.category));
  if (categories.has("faq")) score += 15;
  if (categories.has("refund")) score += 15;
  if (categories.has("visa")) score += 15;

  if (knowledgeMentionsComplaint(knowledge) || hasComplaintBehavior) {
    score += 10;
  }

  return clampScore(score);
}

function calculateDocumentScore(documents: BusinessBrainHealthInput["documents"]): number {
  if (documents.length === 0) return 0;

  let score = 30;

  const publishedRatio =
    documents.filter((document) => document.status === "published").length / documents.length;
  score += publishedRatio * 25;

  if (documents.some((document) => document.autoSendEnabled)) {
    score += 15;
  }

  const hasUsefulTrigger = documents.some((document) =>
    document.triggers.some((trigger) =>
      ["customer_asks_itinerary", "customer_asks_brochure", "customer_asks_visa"].includes(
        trigger,
      ),
    ),
  );
  if (hasUsefulTrigger) score += 15;

  if (documents.some((document) => document.triggers.length > 0)) {
    score += 15;
  }

  return clampScore(Math.min(score, 100));
}

function calculateBehaviorScore(behaviors: BusinessBrainHealthInput["behaviors"]): number {
  if (behaviors.length === 0) return 0;

  let score = 0;
  const enabled = behaviors.filter((behavior) => behavior.enabled);

  if (enabled.some((behavior) => behavior.type === "ALWAYS_DO")) score += 25;
  if (enabled.some((behavior) => behavior.type === "NEVER_DO")) score += 25;
  if (
    enabled.some(
      (behavior) =>
        behavior.type === "HANDOVER_RULE" && behavior.triggerIntent === "complaint",
    )
  ) {
    score += 20;
  }
  if (behaviors.some((behavior) => behavior.type === "REPLY_STYLE")) score += 15;
  if (behaviors.some((behavior) => behavior.type === "QUALIFICATION_RULE")) score += 15;

  return clampScore(score);
}

function addUnique(items: string[], value: string) {
  if (!items.includes(value)) {
    items.push(value);
  }
}

function addRecommendation(
  items: BusinessBrainHealthRecommendation[],
  recommendation: BusinessBrainHealthRecommendation,
) {
  if (!items.some((item) => item.id === recommendation.id)) {
    items.push(recommendation);
  }
}

function makeRecommendation(
  id: string,
  title: string,
  description: string,
  sectionPoints: number,
  sectionWeight: number,
  targetPage: string,
  targetLabel: string,
  priority: BusinessBrainHealthRecommendationPriority,
): BusinessBrainHealthRecommendation {
  return {
    id,
    title,
    description,
    impact: formatImpact(sectionPoints, sectionWeight),
    targetPage,
    targetLabel,
    priority,
  };
}

function deriveInsights(
  input: BusinessBrainHealthInput,
  scores: {
    identityScore: number;
    productScore: number;
    knowledgeScore: number;
    documentScore: number;
    behaviorScore: number;
  },
): Pick<BusinessBrainHealth, "strengths" | "weaknesses" | "recommendations"> {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: BusinessBrainHealthRecommendation[] = [];

  const identity = input.identity;
  const categories = new Set(input.knowledge.map((article) => article.category));
  const activeProducts = input.products.filter((product) => product.status !== "archived");
  const publishedProducts = activeProducts.filter((product) => product.status === "published");
  const productsWithItinerary = activeProducts.filter((product) => product.hasItinerary);
  const hasComplaintHandover = input.behaviors.some(
    (behavior) =>
      behavior.enabled &&
      behavior.type === "HANDOVER_RULE" &&
      behavior.triggerIntent === "complaint",
  );

  if (scores.identityScore >= 80 && identity) {
    addUnique(strengths, "Identity is well configured for AI tone and goals.");
  }
  if (identity && identity.brandPersonality.length > 0) {
    addUnique(
      strengths,
      `Brand personality defined (${identity.brandPersonality.slice(0, 2).join(", ")}).`,
    );
  }
  if (publishedProducts.length > 0) {
    addUnique(
      strengths,
      `${publishedProducts.length} published product${publishedProducts.length === 1 ? "" : "s"} ready for recommendations.`,
    );
  }
  if (categories.has("faq")) {
    addUnique(strengths, "FAQ knowledge is available for AI answers.");
  }
  if (hasComplaintHandover || knowledgeMentionsComplaint(input.knowledge)) {
    addUnique(strengths, "Complaint handling guidance is configured.");
  }
  if (input.isPublished) {
    addUnique(strengths, "Business Brain is published for live AI use.");
  }
  if (input.behaviors.some((behavior) => behavior.enabled && behavior.type === "NEVER_DO")) {
    addUnique(strengths, "Never-do guardrails are active.");
  }

  if (!identity || !hasText(identity.companyName)) {
    addUnique(weaknesses, "Company name is missing.");
    addRecommendation(
      recommendations,
      makeRecommendation(
        "identity-company-name",
        "Add company name",
        "AI needs your business name to introduce itself correctly.",
        20,
        WEIGHTS.identity,
        CTA_ROUTES.identity,
        "Complete Identity",
        "high",
      ),
    );
  }

  if (!identity || !hasText(identity.industry)) {
    addUnique(weaknesses, "Industry is not set.");
    addRecommendation(
      recommendations,
      makeRecommendation(
        "identity-industry",
        "Set your industry",
        "Industry context helps AI tailor answers to your business type.",
        20,
        WEIGHTS.identity,
        CTA_ROUTES.identity,
        "Set Industry",
        "high",
      ),
    );
  }

  if (!identity || !hasText(identity.about, 20)) {
    addUnique(weaknesses, "About company is incomplete.");
    addRecommendation(
      recommendations,
      makeRecommendation(
        "identity-about",
        "Describe your company",
        "A clear company description improves answer accuracy and tone.",
        25,
        WEIGHTS.identity,
        CTA_ROUTES.identity,
        "Add About Company",
        "high",
      ),
    );
  }

  if (identity && identity.brandPersonality.length === 0) {
    addRecommendation(
      recommendations,
      makeRecommendation(
        "identity-personality",
        "Define brand personality",
        "Personality traits guide how AI sounds in every conversation.",
        15,
        WEIGHTS.identity,
        CTA_ROUTES.identity,
        "Add Brand Personality",
        "low",
      ),
    );
  }

  if (activeProducts.length === 0) {
    addUnique(weaknesses, "No products configured.");
    addRecommendation(
      recommendations,
      makeRecommendation(
        "add-product",
        "Add your first product",
        "Without products, AI cannot recommend packages or itineraries.",
        20,
        WEIGHTS.products,
        CTA_ROUTES.products,
        "Create Product",
        "high",
      ),
    );
  }

  if (activeProducts.length > 0 && productsWithItinerary.length === 0) {
    addUnique(weaknesses, "No product has itinerary attached.");
    addRecommendation(
      recommendations,
      makeRecommendation(
        "product-itinerary",
        "Attach product itineraries",
        "Customers asking for schedules need itinerary files on your products.",
        20,
        WEIGHTS.products,
        CTA_ROUTES.products,
        "Add Itinerary",
        "medium",
      ),
    );
  }

  if (input.knowledge.length === 0) {
    addUnique(weaknesses, "Knowledge base is empty.");
    addRecommendation(
      recommendations,
      makeRecommendation(
        "add-knowledge",
        "Create knowledge articles",
        "Policies and FAQs are the primary source of truth for AI answers.",
        25,
        WEIGHTS.knowledge,
        CTA_ROUTES.knowledge,
        "Add Knowledge",
        "high",
      ),
    );
  }

  if (!categories.has("refund")) {
    addUnique(weaknesses, "No refund policy found.");
    addRecommendation(recommendations, {
      id: "knowledge-refund",
      title: "Add refund policy",
      description: "AI may not safely answer refund questions yet.",
      impact: "+8% Readiness Score",
      targetPage: CTA_ROUTES.knowledgeRefund,
      targetLabel: "Create Refund Policy",
      priority: "high",
    });
  }

  if (!categories.has("visa")) {
    addUnique(weaknesses, "No visa information.");
    addRecommendation(recommendations, {
      id: "knowledge-visa",
      title: "Add visa information",
      description: "Travel customers often ask about visa requirements early.",
      impact: formatImpact(15, WEIGHTS.knowledge),
      targetPage: CTA_ROUTES.knowledgeVisa,
      targetLabel: "Create Visa Article",
      priority: "medium",
    });
  }

  if (!categories.has("faq") && input.knowledge.length > 0) {
    addRecommendation(
      recommendations,
      makeRecommendation(
        "knowledge-faq",
        "Add FAQ articles",
        "FAQs give AI quick, reliable answers to common questions.",
        15,
        WEIGHTS.knowledge,
        CTA_ROUTES.knowledgeFaq,
        "Create FAQ",
        "medium",
      ),
    );
  }

  if (!knowledgeMentionsComplaint(input.knowledge) && !hasComplaintHandover) {
    addUnique(weaknesses, "No complaint handling knowledge.");
    addRecommendation(recommendations, {
      id: "complaint-handling",
      title: "Configure complaint handling",
      description: "AI should know when to hand over sensitive complaint conversations.",
      impact: formatImpact(10, WEIGHTS.knowledge),
      targetPage: CTA_ROUTES.behaviorsHandover,
      targetLabel: "Add Handover Rule",
      priority: "medium",
    });
  }

  if (input.documents.length === 0) {
    addUnique(weaknesses, "No documents uploaded.");
    addRecommendation(
      recommendations,
      makeRecommendation(
        "upload-document",
        "Upload reference documents",
        "Brochures and itineraries can be sent automatically when customers ask.",
        30,
        WEIGHTS.documents,
        CTA_ROUTES.documents,
        "Upload Document",
        "medium",
      ),
    );
  }

  if (!input.isPublished) {
    addUnique(weaknesses, "Business Brain is not published.");
    addRecommendation(recommendations, {
      id: "publish-brain",
      title: "Publish Business Brain",
      description: "Draft content is not used in live AI conversations until published.",
      impact: "+15% Readiness Score",
      targetPage: CTA_ROUTES.publish,
      targetLabel: "Review & Publish",
      priority: "high",
    });
  }

  if (input.behaviors.filter((behavior) => behavior.enabled).length === 0) {
    addUnique(weaknesses, "No active rules.");
    addRecommendation(
      recommendations,
      makeRecommendation(
        "configure-behaviors",
        "Configure AI rules",
        "Rules define what your AI should always do, never do, and when to escalate.",
        25,
        WEIGHTS.behaviors,
        CTA_ROUTES.behaviors,
        "Configure Rules",
        "medium",
      ),
    );
  }

  if (strengths.length === 0 && recommendations.length > 0) {
    addUnique(strengths, "Start with Identity to build your Business Brain foundation.");
  }

  return {
    strengths,
    weaknesses,
    recommendations: sortBusinessBrainRecommendations(recommendations),
  };
}

export function calculateBusinessBrainHealth(
  input: BusinessBrainHealthInput,
): BusinessBrainHealth {
  const hasComplaintBehavior = input.behaviors.some(
    (behavior) =>
      behavior.enabled &&
      behavior.type === "HANDOVER_RULE" &&
      behavior.triggerIntent === "complaint",
  );

  const identityScore = calculateIdentityScore(input.identity);
  const productScore = calculateProductScore(input.products);
  const knowledgeScore = calculateKnowledgeScore(input.knowledge, hasComplaintBehavior);
  const documentScore = calculateDocumentScore(input.documents);
  const behaviorScore = calculateBehaviorScore(input.behaviors);

  const overallScore = clampScore(
    identityScore * WEIGHTS.identity +
      productScore * WEIGHTS.products +
      knowledgeScore * WEIGHTS.knowledge +
      documentScore * WEIGHTS.documents +
      behaviorScore * WEIGHTS.behaviors,
  );

  const estimatedAiAccuracy = clampScore(
    input.isPublished ? overallScore : overallScore * 0.85,
  );

  const insights = deriveInsights(input, {
    identityScore,
    productScore,
    knowledgeScore,
    documentScore,
    behaviorScore,
  });

  return {
    overallScore,
    identityScore,
    productScore,
    knowledgeScore,
    documentScore,
    behaviorScore,
    estimatedAiAccuracy,
    ...insights,
  };
}
