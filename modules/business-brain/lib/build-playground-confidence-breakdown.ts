import type { RetrievalSummary } from "@/modules/ai/types/context-retrieval";
import { PLAYGROUND_MEMORY_KEYS } from "@/modules/ai/types/memory";
import type {
  PlaygroundAvailableContext,
  PlaygroundPreviewResult,
  PlaygroundTestResult,
} from "@/modules/business-brain/types/playground";
import type {
  PlaygroundConfidenceBreakdown,
  PlaygroundConfidenceBreakdownItem,
  PlaygroundConfidenceQualityLabel,
} from "@/modules/business-brain/types/playground-confidence-breakdown";
import {
  playgroundConfidenceQualityLabel,
  shouldExplainConfidenceDimension,
} from "@/modules/business-brain/types/playground-confidence-breakdown";

const PRODUCT_INTENTS = [
  "PACKAGE_INQUIRY",
  "PACKAGE_RECOMMENDATION",
  "PRICE_INQUIRY",
  "DEPARTURE_DATE",
  "BOOKING",
];

const DOCUMENT_INTENTS = ["BROCHURE_REQUEST", "ITINERARY_REQUEST"];

const KNOWLEDGE_INTENTS: Record<string, string> = {
  REFUND: "Refund article missing.",
  PAYMENT: "Payment guide article missing.",
  VISA: "Visa information article missing.",
  HALAL_FOOD: "Halal food information article missing.",
};

function clampScore(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)));
}

function normalizeIntent(intent: string | undefined): string {
  return intent?.trim().toUpperCase() ?? "UNKNOWN";
}

function buildDimensionItem(
  key: PlaygroundConfidenceBreakdownItem["key"],
  label: string,
  score: number,
  explanation: string | null,
): PlaygroundConfidenceBreakdownItem {
  const qualityLabel = playgroundConfidenceQualityLabel(score);

  return {
    key,
    label,
    score,
    qualityLabel,
    explanation:
      explanation && shouldExplainConfidenceDimension(qualityLabel) ? explanation : null,
  };
}

function scoreKnowledge(args: {
  preview: PlaygroundPreviewResult;
  contextUsed: PlaygroundAvailableContext;
  retrievalSummary: RetrievalSummary | undefined;
}): PlaygroundConfidenceBreakdownItem {
  const intent = normalizeIntent(args.retrievalSummary?.intent);
  const articleCount = args.retrievalSummary?.articleCount ?? args.contextUsed.knowledge.items.length;
  const hasIdentity = args.contextUsed.companyDna.items.length > 0;
  const knowledgeSources = args.preview.sourceLabels.filter((source) =>
    source.toLowerCase().includes("knowledge"),
  ).length;

  let score = 35;
  score += Math.min(35, articleCount * 12);
  if (hasIdentity) score += 12;
  if (knowledgeSources > 0) score += 10;
  if (args.retrievalSummary && args.retrievalSummary.matchedKeywords.length > 0) {
    score += 8;
  }

  let explanation: string | null = null;

  if (intent in KNOWLEDGE_INTENTS && articleCount === 0) {
    score = Math.min(score, 52);
    explanation = KNOWLEDGE_INTENTS[intent];
  } else if (articleCount === 0 && !hasIdentity) {
    score = Math.min(score, 48);
    explanation = "No knowledge articles were retrieved for this answer.";
  } else if (articleCount === 0) {
    score = Math.min(score, 62);
    explanation = "Knowledge articles were not matched for this question.";
  }

  if (args.preview.handoffRequired) {
    score = Math.min(score, 70);
  }

  return buildDimensionItem("knowledge", "Knowledge", clampScore(score), explanation);
}

function scoreRules(args: {
  contextUsed: PlaygroundAvailableContext;
  retrievalSummary: RetrievalSummary | undefined;
}): PlaygroundConfidenceBreakdownItem {
  const behaviorCount =
    args.retrievalSummary?.behaviorCount ?? args.contextUsed.behaviors.items.length;
  const rulesApplied = args.contextUsed.behaviors.items.length;

  let score = 45;
  score += Math.min(30, behaviorCount * 10);
  score += Math.min(25, rulesApplied * 8);

  let explanation: string | null = null;

  if (rulesApplied === 0) {
    score = Math.min(score, 55);
    explanation = "No behavior rules were applied to this response.";
  } else if (behaviorCount === 0) {
    score = Math.min(score, 65);
    explanation = "Rules exist, but none were retrieved for this intent.";
  }

  return buildDimensionItem("rules", "Rules", clampScore(score), explanation);
}

function scoreProducts(args: {
  contextUsed: PlaygroundAvailableContext;
  retrievalSummary: RetrievalSummary | undefined;
}): PlaygroundConfidenceBreakdownItem {
  const intent = normalizeIntent(args.retrievalSummary?.intent);
  const productCount =
    args.retrievalSummary?.productCount ?? args.contextUsed.products.items.length;
  const productsUsed = args.contextUsed.products.items.length;

  let score = 40;
  score += Math.min(45, productCount * 15);
  score += Math.min(15, productsUsed * 5);

  let explanation: string | null = null;

  if (PRODUCT_INTENTS.includes(intent) && productCount === 0) {
    score = Math.min(score, 42);
    explanation = "No matching product found for this question.";
  } else if (productCount === 0) {
    score = Math.min(score, 68);
    explanation = "Products were not needed or not retrieved for this intent.";
  } else if (productsUsed === 0 && productCount > 0) {
    score = Math.min(score, 72);
    explanation = "Products were retrieved but not referenced in the answer.";
  }

  return buildDimensionItem("products", "Products", clampScore(score), explanation);
}

function scoreDocuments(args: {
  preview: PlaygroundPreviewResult;
  contextUsed: PlaygroundAvailableContext;
  retrievalSummary: RetrievalSummary | undefined;
}): PlaygroundConfidenceBreakdownItem {
  const intent = normalizeIntent(args.retrievalSummary?.intent);
  const documentCount =
    args.retrievalSummary?.documentCount ?? args.contextUsed.documents.items.length;
  const documentsUsed = args.contextUsed.documents.items.length;

  let score = 45;
  score += Math.min(40, documentCount * 14);
  score += Math.min(15, documentsUsed * 5);

  if (args.preview.documentActions.length > 0) {
    score += 10;
  }

  let explanation: string | null = null;

  if (intent === "ITINERARY_REQUEST" && documentCount === 0) {
    score = Math.min(score, 38);
    explanation = "No itinerary attached.";
  } else if (intent === "BROCHURE_REQUEST" && documentCount === 0) {
    score = Math.min(score, 38);
    explanation = "No brochure document available.";
  } else if (DOCUMENT_INTENTS.includes(intent) && documentCount === 0) {
    score = Math.min(score, 45);
    explanation = "No supporting document was retrieved for this request.";
  } else if (documentCount === 0) {
    score = Math.min(score, 72);
    explanation = "Documents were not required or not retrieved for this intent.";
  }

  return buildDimensionItem("documents", "Documents", clampScore(score), explanation);
}

function scoreMemory(args: {
  result: Omit<PlaygroundTestResult, "aiScore">;
}): PlaygroundConfidenceBreakdownItem {
  const knownFields = PLAYGROUND_MEMORY_KEYS.filter((key) => {
    const value = args.result.customerMemory[key]?.trim();
    return Boolean(value && value.toLowerCase() !== "unknown");
  }).length;

  const extractedCount = args.result.customerMemoryUsed.filter(
    (item) => item.memory_value.trim().length > 0,
  ).length;

  let score = 35;
  score += Math.min(35, knownFields * 12);
  score += Math.min(20, extractedCount * 4);
  score += args.result.leadQualification.completionScore * 0.25;

  let explanation: string | null = null;

  if (knownFields === 0 && extractedCount === 0) {
    score = Math.min(score, 50);
    explanation = "No customer details extracted yet.";
  } else if (args.result.leadQualification.missingFields.length > 2) {
    score = Math.min(score, 68);
    explanation = "Several qualification fields are still missing.";
  }

  return buildDimensionItem("memory", "Memory", clampScore(score), explanation);
}

export function buildPlaygroundConfidenceBreakdown(
  result: Omit<PlaygroundTestResult, "aiScore">,
): PlaygroundConfidenceBreakdown {
  const items = [
    scoreKnowledge({
      preview: result.preview,
      contextUsed: result.contextUsed,
      retrievalSummary: result.retrievalSummary,
    }),
    scoreRules({
      contextUsed: result.contextUsed,
      retrievalSummary: result.retrievalSummary,
    }),
    scoreProducts({
      contextUsed: result.contextUsed,
      retrievalSummary: result.retrievalSummary,
    }),
    scoreDocuments({
      preview: result.preview,
      contextUsed: result.contextUsed,
      retrievalSummary: result.retrievalSummary,
    }),
    scoreMemory({ result }),
  ];

  const overall = clampScore(
    items.reduce((sum, item) => sum + item.score, 0) / items.length,
  );

  return { overall, items };
}

export function confidenceToneFromScore(
  score: number,
): "success" | "warning" | "danger" {
  if (score >= 80) {
    return "success";
  }

  if (score >= 60) {
    return "warning";
  }

  return "danger";
}

export function confidenceQualityToneClass(
  qualityLabel: PlaygroundConfidenceQualityLabel,
): string {
  switch (qualityLabel) {
    case "Excellent":
    case "Good":
      return "text-emerald-600 dark:text-emerald-400";
    case "Medium":
      return "text-amber-600 dark:text-amber-400";
    case "Low":
    case "Poor":
      return "text-destructive";
    default:
      return "text-muted-foreground";
  }
}
