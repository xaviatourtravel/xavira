import { getWeakestCoverageCategories } from "@/modules/business-brain/lib/knowledge-coverage-calculator";
import {
  getKnowledgeCoverageNavTarget,
  knowledgeCoverageCategoryDisplayName,
} from "@/modules/business-brain/lib/knowledge-coverage-navigation";
import { buildPlaygroundConfidenceBreakdown } from "@/modules/business-brain/lib/build-playground-confidence-breakdown";
import type { BusinessBrainHealth } from "@/modules/business-brain/types/business-brain-health";
import type { KnowledgeCoverageCategoryLabel } from "@/modules/business-brain/types/knowledge-coverage";
import type { KnowledgeCoverageResult } from "@/modules/business-brain/types/knowledge-coverage";
import type {
  PlaygroundImprovementSuggestion,
  PlaygroundImprovementSuggestionsView,
} from "@/modules/business-brain/types/playground-improvement-suggestions";
import type { PlaygroundTestResult } from "@/modules/business-brain/types/playground";
import { shouldExplainConfidenceDimension } from "@/modules/business-brain/types/playground-confidence-breakdown";

const CTA_ROUTES = {
  knowledge: "/business-brain/knowledge",
  knowledgeRefund: "/business-brain/knowledge?category=refund",
  knowledgePayment: "/business-brain/knowledge?category=payment",
  knowledgeVisa: "/business-brain/knowledge?category=visa",
  knowledgeHalal: "/business-brain/knowledge?category=halal",
  knowledgeFaq: "/business-brain/knowledge?category=faq",
  products: "/business-brain/products",
  documents: "/business-brain/documents",
  behaviors: "/business-brain/behaviors",
  identity: "/business-brain/identity",
  publish: "/business-brain/publish",
} as const;

const INTENT_COVERAGE_CATEGORY: Partial<Record<string, KnowledgeCoverageCategoryLabel>> = {
  REFUND: "Refund",
  PAYMENT: "Payment",
  VISA: "Visa",
  HALAL_FOOD: "Halal Food",
  PACKAGE_INQUIRY: "Products",
  PACKAGE_RECOMMENDATION: "Products",
  PRICE_INQUIRY: "Pricing",
  ITINERARY_REQUEST: "Itinerary",
  BROCHURE_REQUEST: "Itinerary",
  COMPLAINT: "Complaint Handling",
  PRIVATE_TRIP: "Private Trip",
  BOOKING: "Schedule",
  DEPARTURE_DATE: "Schedule",
};

function formatImpactPercent(value: number): string {
  return `+${Math.max(1, Math.round(value))}%`;
}

function parseImpactValue(impact: string): number {
  const match = impact.match(/(\d+)/);
  return match ? Number(match[1]) : 5;
}

function impactFromGap(baseImpact: number, score: number): number {
  const gap = Math.max(0, 75 - score);
  return Math.min(15, Math.max(baseImpact, Math.round(baseImpact + gap * 0.12)));
}

function addSuggestion(
  bucket: Map<string, PlaygroundImprovementSuggestion>,
  suggestion: PlaygroundImprovementSuggestion,
) {
  const key = suggestion.targetPage;
  const existing = bucket.get(key);
  if (!existing || suggestion.expectedImpactValue > existing.expectedImpactValue) {
    bucket.set(key, suggestion);
  }
}

function buildSimulationSuggestions(
  result: Omit<PlaygroundTestResult, "aiScore">,
): PlaygroundImprovementSuggestion[] {
  const breakdown = buildPlaygroundConfidenceBreakdown(result);
  const intent = result.retrievalSummary?.intent.trim().toUpperCase() ?? "UNKNOWN";
  const suggestions: PlaygroundImprovementSuggestion[] = [];

  for (const item of breakdown.items) {
    if (
      item.score >= 75 &&
      !shouldExplainConfidenceDimension(item.qualityLabel) &&
      !item.explanation
    ) {
      continue;
    }

    if (item.key === "knowledge") {
      const title =
        intent === "REFUND"
          ? "Add Refund Policy"
          : intent === "PAYMENT"
            ? "Add Payment Guide"
            : intent === "VISA"
              ? "Add Visa Information"
              : intent === "HALAL_FOOD"
                ? "Add Halal Food Information"
                : "Add Knowledge Article";

      const targetPage =
        intent === "REFUND"
          ? CTA_ROUTES.knowledgeRefund
          : intent === "PAYMENT"
            ? CTA_ROUTES.knowledgePayment
            : intent === "VISA"
              ? CTA_ROUTES.knowledgeVisa
              : intent === "HALAL_FOOD"
                ? CTA_ROUTES.knowledgeHalal
                : CTA_ROUTES.knowledge;

      const impactValue = impactFromGap(intent === "REFUND" ? 7 : 6, item.score);
      suggestions.push({
        id: `simulation-knowledge-${intent.toLowerCase()}`,
        title,
        expectedImpact: formatImpactPercent(impactValue),
        expectedImpactValue: impactValue,
        targetPage,
        buttonLabel: "Open Knowledge",
        source: "simulation",
      });
    }

    if (item.key === "documents") {
      const title =
        intent === "ITINERARY_REQUEST" || intent === "BROCHURE_REQUEST"
          ? "Upload Itinerary"
          : "Upload Supporting Document";
      const impactValue = impactFromGap(5, item.score);
      suggestions.push({
        id: "simulation-documents",
        title,
        expectedImpact: formatImpactPercent(impactValue),
        expectedImpactValue: impactValue,
        targetPage: CTA_ROUTES.documents,
        buttonLabel: "Open Documents",
        source: "simulation",
      });
    }

    if (item.key === "products") {
      const impactValue = impactFromGap(8, item.score);
      suggestions.push({
        id: "simulation-products",
        title: "Add Matching Product",
        expectedImpact: formatImpactPercent(impactValue),
        expectedImpactValue: impactValue,
        targetPage: CTA_ROUTES.products,
        buttonLabel: "Open Products",
        source: "simulation",
      });
    }

    if (item.key === "rules") {
      const impactValue = impactFromGap(6, item.score);
      suggestions.push({
        id: "simulation-rules",
        title: "Configure AI Rules",
        expectedImpact: formatImpactPercent(impactValue),
        expectedImpactValue: impactValue,
        targetPage: CTA_ROUTES.behaviors,
        buttonLabel: "Open Rules",
        source: "simulation",
      });
    }

    if (item.key === "memory") {
      const impactValue = impactFromGap(4, item.score);
      suggestions.push({
        id: "simulation-memory",
        title: "Improve Qualification Rules",
        expectedImpact: formatImpactPercent(impactValue),
        expectedImpactValue: impactValue,
        targetPage: CTA_ROUTES.behaviors,
        buttonLabel: "Open Rules",
        source: "simulation",
      });
    }
  }

  return suggestions;
}

function buildHealthSuggestions(health: BusinessBrainHealth): PlaygroundImprovementSuggestion[] {
  return health.recommendations.map((recommendation) => {
    const impactValue =
      recommendation.id === "publish-brain"
        ? 10
        : parseImpactValue(recommendation.impact);
    const title =
      recommendation.id === "publish-brain"
        ? "Publish latest changes"
        : recommendation.title;

    const buttonLabel =
      recommendation.id === "publish-brain"
        ? "Open Publish"
        : recommendation.targetLabel;

    return {
      id: `health-${recommendation.id}`,
      title,
      expectedImpact: formatImpactPercent(impactValue),
      expectedImpactValue: impactValue,
      targetPage: recommendation.targetPage,
      buttonLabel,
      source: "health" as const,
    };
  });
}

function buildCoverageSuggestions(
  coverage: KnowledgeCoverageResult,
  intent: string,
): PlaygroundImprovementSuggestion[] {
  const suggestions: PlaygroundImprovementSuggestion[] = [];
  const relatedCategory = INTENT_COVERAGE_CATEGORY[intent];
  const weakCategories = getWeakestCoverageCategories(coverage.categories, 4);

  const candidates = relatedCategory
    ? [
        ...weakCategories.filter((item) => item.category === relatedCategory),
        ...weakCategories.filter((item) => item.category !== relatedCategory),
      ]
    : weakCategories;

  for (const category of candidates) {
    if (category.coverageScore >= 70) {
      continue;
    }

    const nav = getKnowledgeCoverageNavTarget(category.category);
    const impactValue = Math.min(
      12,
      Math.max(4, Math.round((70 - category.coverageScore) * 0.15 + 4)),
    );

    suggestions.push({
      id: `coverage-${category.category.toLowerCase().replace(/\s+/g, "-")}`,
      title: `Improve ${knowledgeCoverageCategoryDisplayName(category.category)} Coverage`,
      expectedImpact: formatImpactPercent(impactValue),
      expectedImpactValue: impactValue,
      targetPage: nav.targetPage,
      buttonLabel: nav.quickAddLabel,
      source: "coverage",
    });
  }

  return suggestions;
}

function isRelevantToSimulation(
  suggestion: PlaygroundImprovementSuggestion,
  intent: string,
): boolean {
  if (suggestion.source === "simulation") {
    return true;
  }

  if (suggestion.id === "health-publish-brain") {
    return true;
  }

  if (suggestion.source === "health") {
    if (intent === "REFUND" && suggestion.targetPage.includes("refund")) {
      return true;
    }
    if (intent === "PAYMENT" && suggestion.targetPage.includes("payment")) {
      return true;
    }
    if (intent === "VISA" && suggestion.targetPage.includes("visa")) {
      return true;
    }
    if (
      (intent === "ITINERARY_REQUEST" || intent === "BROCHURE_REQUEST") &&
      suggestion.targetPage.includes("documents")
    ) {
      return true;
    }
    if (
      (intent === "PACKAGE_INQUIRY" ||
        intent === "PACKAGE_RECOMMENDATION" ||
        intent === "PRICE_INQUIRY") &&
      suggestion.targetPage.includes("products")
    ) {
      return true;
    }
    if (intent === "COMPLAINT" && suggestion.targetPage.includes("behaviors")) {
      return true;
    }
    return suggestion.expectedImpactValue >= 8;
  }

  if (suggestion.source === "coverage") {
    const related = INTENT_COVERAGE_CATEGORY[intent];
    if (!related) {
      return categoryMatchesIntent(suggestion.id, intent);
    }
    return suggestion.id.includes(related.toLowerCase().replace(/\s+/g, "-"));
  }

  return true;
}

function categoryMatchesIntent(suggestionId: string, intent: string): boolean {
  const related = INTENT_COVERAGE_CATEGORY[intent];
  if (!related) {
    return false;
  }
  return suggestionId.includes(related.toLowerCase().replace(/\s+/g, "-"));
}

export type BuildPlaygroundImprovementSuggestionsInput = {
  result: Omit<PlaygroundTestResult, "aiScore">;
  health: BusinessBrainHealth;
  knowledgeCoverage: KnowledgeCoverageResult;
};

export function buildPlaygroundImprovementSuggestions(
  input: BuildPlaygroundImprovementSuggestionsInput,
): PlaygroundImprovementSuggestionsView {
  const intent = input.result.retrievalSummary?.intent.trim().toUpperCase() ?? "UNKNOWN";
  const merged = new Map<string, PlaygroundImprovementSuggestion>();

  for (const suggestion of buildSimulationSuggestions(input.result)) {
    addSuggestion(merged, suggestion);
  }

  for (const suggestion of buildHealthSuggestions(input.health)) {
    if (isRelevantToSimulation(suggestion, intent)) {
      addSuggestion(merged, suggestion);
    }
  }

  for (const suggestion of buildCoverageSuggestions(input.knowledgeCoverage, intent)) {
    if (isRelevantToSimulation(suggestion, intent)) {
      addSuggestion(merged, suggestion);
    }
  }

  const items = [...merged.values()]
    .sort((a, b) => b.expectedImpactValue - a.expectedImpactValue)
    .slice(0, 4);

  return { items };
}
