import type { ProductContext } from "@/modules/business-brain/types/context";
import { normalizeText } from "@/modules/ai/response-planner/product-summary";

export type ProductTitleMatch = {
  product: ProductContext;
  confidence: number;
  matchType: "exact_title" | "near_exact_title";
};

const TITLE_MATCH_MIN_CONFIDENCE = 8;

function normalizeTitle(value: string): string {
  return normalizeText(value);
}

function tokenizeTitle(value: string): string[] {
  return normalizeTitle(value)
    .split(" ")
    .filter((token) => token.length > 2);
}

export function scoreProductTitleMatch(message: string, product: ProductContext): number {
  const messageNorm = normalizeTitle(message);
  const nameNorm = normalizeTitle(product.name);
  if (!messageNorm || !nameNorm) return 0;

  if (messageNorm === nameNorm) return 10;
  if (messageNorm.includes(nameNorm) || nameNorm.includes(messageNorm)) return 9;

  const messageTokens = tokenizeTitle(messageNorm);
  const nameTokens = tokenizeTitle(nameNorm);
  if (nameTokens.length === 0) return 0;

  const overlap = nameTokens.filter((token) => messageTokens.includes(token)).length;
  const coverage = overlap / nameTokens.length;
  if (overlap >= 3 && coverage >= 0.75) return 8;
  if (overlap >= 4 && coverage >= 0.6) return 8;

  return 0;
}

export function findProductTitleMatch(
  message: string,
  products: ProductContext[],
): ProductTitleMatch | null {
  const scored = products
    .map((product) => ({
      product,
      confidence: scoreProductTitleMatch(message, product),
    }))
    .filter((item) => item.confidence >= TITLE_MATCH_MIN_CONFIDENCE)
    .sort((a, b) => b.confidence - a.confidence);

  if (scored.length === 0) return null;
  if (scored.length > 1 && scored[0].confidence === scored[1].confidence) {
    return null;
  }

  return {
    product: scored[0].product,
    confidence: scored[0].confidence,
    matchType: scored[0].confidence >= 9 ? "exact_title" : "near_exact_title",
  };
}

export function isHighConfidenceProductTitleMatch(message: string, products: ProductContext[]): boolean {
  const match = findProductTitleMatch(message, products);
  return match != null && match.confidence >= TITLE_MATCH_MIN_CONFIDENCE;
}
