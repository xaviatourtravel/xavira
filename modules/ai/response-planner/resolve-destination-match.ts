import type { ProductContext } from "@/modules/business-brain/types/context";
import {
  canonicalizeCountryQuery,
  cleanGeographicQuery,
  extractGeographyFromProduct,
  geographyIncludesDestination,
  inferCountryFromDestination,
  productMatchesCountry,
  type GeographicMatchType,
} from "@/modules/ai/response-planner/product-geography";
import {
  filterProductsForCountryScope,
  filterProductsForDestinationScope,
  isProductEligibleForCountryQuery,
  isProductEligibleForDestinationQuery,
  isSameCountryDestinationAlternative,
} from "@/modules/ai/response-planner/geographic-eligibility";
import { toProductSummary, type ProductSummary } from "@/modules/ai/response-planner/product-summary";

export type DestinationMatchType =
  | "exact_country"
  | "exact_destination"
  | "exact_city"
  | "exact_route"
  | "verified_alias"
  | "same_country_alternative"
  | "no_match";

export type DestinationMatchResult = {
  product: ProductContext;
  summary: ProductSummary;
  matchType: DestinationMatchType;
  confidence: number;
  matchedValue: string | null;
};

const MIN_AUTO_SELECT_CONFIDENCE = 6;

function normalizeQuery(value: string): string {
  return cleanGeographicQuery(value);
}

export function extractDestinationQuery(message: string): string | null {
  const text = message.trim();
  const patterns = [
    /\b(?:trip|mau|ingin|pergi|berangkat|visit|tour|pengen|jalan(?:\s+jalan)?)\s+(?:ke\s+)?([\p{L}\p{N}\s'-]{2,60})/iu,
    /\bke\s+([\p{L}\p{N}\s'-]{2,40})/iu,
    /\bpaket\s+(?:ke\s+)?([\p{L}\p{N}\s'-]{2,40})/iu,
    /\b(?:ada\s+)?paket(?:nya)?\s+(?:ke\s+)?([\p{L}\p{N}\s'-]{2,40})/iu,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const candidate = cleanGeographicQuery(match[1]);
      if (candidate.length >= 2) {
        return candidate;
      }
    }
  }

  return null;
}

const COUNTRY_QUERY_ALIASES = new Set([
  "china",
  "cina",
  "tiongkok",
  "jepang",
  "japan",
  "korea",
  "turki",
  "turkey",
  "eropa",
  "europe",
  "singapura",
  "singapore",
  "malaysia",
  "thailand",
  "vietnam",
  "australia",
  "mesir",
  "egypt",
  "brunei",
  "hongkong",
  "hong kong",
]);

export function isCountryQuery(value: string): boolean {
  const cleaned = cleanGeographicQuery(value);
  return Boolean(canonicalizeCountryQuery(cleaned)) || COUNTRY_QUERY_ALIASES.has(cleaned);
}

export function extractCountryQuery(message: string): string | null {
  const text = message.toLowerCase();
  const countryPatterns = [
    /\b(?:trip|mau|ingin|pergi|berangkat|pengen|jalan(?:\s+jalan)?|ke|paket)\s+(?:ke\s+)?(china|cina|tiongkok|jepang|japan|korea|turki|turkey|eropa|europe|singapura|singapore|malaysia|thailand|vietnam|australia|mesir|egypt|brunei|hong\s*kong|hongkong)\b/i,
    /\b(china|cina|tiongkok|jepang|japan|korea|turki|turkey|eropa|europe|singapura|singapore|malaysia|thailand|vietnam|australia|mesir|egypt|brunei|hong\s*kong|hongkong)\b/i,
  ];

  for (const pattern of countryPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const cleaned = cleanGeographicQuery(match[1]);
      return canonicalizeCountryQuery(cleaned) ?? cleaned;
    }
  }

  return null;
}

function mapGeographicMatchType(matchType: GeographicMatchType): DestinationMatchType {
  if (matchType === "no_match") return "no_match";
  return matchType;
}

function scoreDestinationMatch(product: ProductContext, query: string): DestinationMatchResult {
  const summary = toProductSummary(product);
  const normalizedQuery = normalizeQuery(query);
  const geography = extractGeographyFromProduct(product);
  let matchType = geographyIncludesDestination(geography, normalizedQuery);

  if (matchType === "no_match" && isProductEligibleForDestinationQuery(product, normalizedQuery)) {
    matchType = "verified_alias";
  }

  if (matchType === "no_match") {
    return {
      product,
      summary,
      matchType: "no_match",
      confidence: 0,
      matchedValue: null,
    };
  }

  const confidenceMap: Record<Exclude<GeographicMatchType, "no_match">, number> = {
    exact_destination: 10,
    exact_city: 9,
    exact_route: 8,
    verified_alias: 7,
    exact_country: 8,
    same_country_alternative: 5,
  };

  return {
    product,
    summary,
    matchType: mapGeographicMatchType(matchType),
    confidence: confidenceMap[matchType],
    matchedValue: normalizedQuery,
  };
}

export function matchProductsByDestination(
  products: ProductContext[],
  query: string,
): DestinationMatchResult[] {
  const { eligible } = filterProductsForDestinationScope(products, query, "exact");

  return eligible
    .map((product) => scoreDestinationMatch(product, query))
    .filter((result) => result.matchType !== "no_match")
    .sort((a, b) => b.confidence - a.confidence);
}

export function matchProductsByCountry(
  products: ProductContext[],
  countryQuery: string,
): DestinationMatchResult[] {
  const canonical = canonicalizeCountryQuery(cleanGeographicQuery(countryQuery));
  if (!canonical) return [];

  const { eligible } = filterProductsForCountryScope(products, countryQuery);

  return eligible
    .map((product) => {
      const summary = toProductSummary(product);
      return {
        product,
        summary,
        matchType: "exact_country" as const,
        confidence: 8,
        matchedValue: canonical,
      };
    })
    .sort((a, b) => b.confidence - a.confidence);
}

export function findSameCountryAlternatives(
  products: ProductContext[],
  destinationQuery: string,
  excludeIds: Set<string>,
): DestinationMatchResult[] {
  const { eligible } = filterProductsForDestinationScope(products, destinationQuery, "same_country_alternative");

  return eligible
    .filter((product) => !excludeIds.has(product.id) && isSameCountryDestinationAlternative(product, destinationQuery))
    .map((product) => {
      const summary = toProductSummary(product);
      const country = inferCountryFromDestination(destinationQuery);
      return {
        product,
        summary,
        matchType: "same_country_alternative" as const,
        confidence: 5,
        matchedValue: country,
      };
    });
}

export { isProductEligibleForCountryQuery, isProductEligibleForDestinationQuery };

export function shouldAutoSelectEntity(result: DestinationMatchResult | null): boolean {
  if (!result) return false;
  return result.confidence >= MIN_AUTO_SELECT_CONFIDENCE;
}

export function isWeakSingleRetrievalMatch(
  product: ProductContext,
  message: string,
): boolean {
  const query = extractDestinationQuery(message) ?? extractCountryQuery(message);
  if (!query) return true;

  const match = scoreDestinationMatch(product, query);
  return match.confidence < MIN_AUTO_SELECT_CONFIDENCE;
}

export { MIN_AUTO_SELECT_CONFIDENCE };
