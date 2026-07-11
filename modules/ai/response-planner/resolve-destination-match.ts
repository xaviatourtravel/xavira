import type { ProductContext } from "@/modules/business-brain/types/context";
import {
  normalizeText,
  resolveCountryAliases,
  resolveCountryFromProduct,
  resolveDestinationAliases,
  toProductSummary,
  type ProductSummary,
} from "@/modules/ai/response-planner/product-summary";

export type DestinationMatchType =
  | "exact_destination_field"
  | "exact_product_name"
  | "exact_route_city"
  | "verified_alias"
  | "strong_token_intersection"
  | "no_match";

export type DestinationMatchResult = {
  product: ProductContext;
  summary: ProductSummary;
  matchType: DestinationMatchType;
  confidence: number;
  matchedValue: string | null;
};

const MIN_AUTO_SELECT_CONFIDENCE = 6;
const MIN_WEAK_MATCH_CONFIDENCE = 3;

function normalizeQuery(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeQuery(value)
    .split(" ")
    .filter((token) => token.length > 2);
}

export function extractDestinationQuery(message: string): string | null {
  const text = message.trim();
  const patterns = [
    /\b(?:trip|mau|ingin|pergi|berangkat|visit|tour)\s+(?:ke\s+)([\p{L}\p{N}\s'-]{2,40})/iu,
    /\bke\s+([\p{L}\p{N}\s'-]{2,40})/iu,
    /\bpaket\s+([\p{L}\p{N}\s'-]{2,40})/iu,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const candidate = normalizeQuery(match[1])
        .replace(/\b(layanan|service|tanya|nanya|info|informasi|apa|aja)\b/g, "")
        .trim();
      if (candidate.length >= 2 && !/^(layanan|service|tanya|nanya)$/i.test(candidate)) {
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
]);

export function isCountryQuery(value: string): boolean {
  return COUNTRY_QUERY_ALIASES.has(normalizeQuery(value));
}

export function extractCountryQuery(message: string): string | null {
  const text = normalizeQuery(message);
  const countryPatterns = [
    /\b(?:trip|mau|ingin|pergi|berangkat|ke|paket)\s+(?:ke\s+)?(china|cina|tiongkok|jepang|japan|korea|turki|turkey|eropa|europe|singapura|singapore|malaysia|thailand|vietnam|australia|mesir|egypt)\b/i,
    /\b(china|cina|tiongkok|jepang|japan|korea|turki|turkey|eropa|europe|singapura|singapore|malaysia|thailand|vietnam|australia|mesir|egypt)\b/i,
  ];

  for (const pattern of countryPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return normalizeQuery(match[1]);
    }
  }

  return null;
}

function buildMatchHaystack(product: ProductContext, summary: ProductSummary): string {
  return normalizeQuery(
    [product.name, product.destination, product.category, ...product.highlights, summary.route ?? "", product.aiNotes]
      .join(" "),
  );
}

function scoreDestinationMatch(product: ProductContext, query: string): DestinationMatchResult {
  const summary = toProductSummary(product);
  const normalizedQuery = normalizeQuery(query);
  const queryTokens = tokenize(query);
  const aliases = resolveDestinationAliases(normalizedQuery);

  const destinationField = normalizeQuery(product.destination);
  const productName = normalizeQuery(product.name);
  const routeText = normalizeQuery(summary.route ?? "");
  const highlightsText = normalizeQuery(product.highlights.join(" "));
  const structuredHaystack = buildMatchHaystack(product, summary);

  if (destinationField && (destinationField === normalizedQuery || aliases.some((alias) => destinationField.includes(alias)))) {
    return {
      product,
      summary,
      matchType: "exact_destination_field",
      confidence: 10,
      matchedValue: product.destination,
    };
  }

  if (productName.includes(normalizedQuery) || aliases.some((alias) => productName.includes(alias))) {
    return {
      product,
      summary,
      matchType: "exact_product_name",
      confidence: 9,
      matchedValue: product.name,
    };
  }

  if (
    (routeText && aliases.some((alias) => routeText.includes(alias))) ||
    (highlightsText && aliases.some((alias) => highlightsText.includes(alias)))
  ) {
    return {
      product,
      summary,
      matchType: "exact_route_city",
      confidence: 8,
      matchedValue: summary.route ?? product.destination,
    };
  }

  const searchable = structuredHaystack;
  if (aliases.some((alias) => searchable.includes(alias))) {
    return {
      product,
      summary,
      matchType: "verified_alias",
      confidence: 7,
      matchedValue: normalizedQuery,
    };
  }

  const tokenHits = queryTokens.filter((token) => structuredHaystack.includes(token)).length;
  if (tokenHits >= 2 || (tokenHits === 1 && queryTokens.length === 1)) {
    const confidence = tokenHits * 2;
    if (confidence >= MIN_WEAK_MATCH_CONFIDENCE) {
      return {
        product,
        summary,
        matchType: "strong_token_intersection",
        confidence,
        matchedValue: normalizedQuery,
      };
    }
  }

  return {
    product,
    summary,
    matchType: "no_match",
    confidence: 0,
    matchedValue: null,
  };
}

export function matchProductsByDestination(
  products: ProductContext[],
  query: string,
): DestinationMatchResult[] {
  return products
    .map((product) => scoreDestinationMatch(product, query))
    .filter((result) => result.matchType !== "no_match")
    .sort((a, b) => b.confidence - a.confidence);
}

export function matchProductsByCountry(
  products: ProductContext[],
  countryQuery: string,
): DestinationMatchResult[] {
  const normalizedCountry = normalizeQuery(countryQuery);
  const countryAliases = resolveCountryAliases(normalizedCountry);

  return products
    .map((product) => {
      const summary = toProductSummary(product);
      const country = normalizeQuery(summary.country ?? "");
      const searchable = summary.searchableText;

      if (!country && !searchable.includes(normalizedCountry)) {
        return {
          product,
          summary,
          matchType: "no_match" as const,
          confidence: 0,
          matchedValue: null,
        };
      }

      const matchesCountry =
        countryAliases.some((alias) => country.includes(alias) || searchable.includes(alias)) ||
        searchable.includes(normalizedCountry);

      if (!matchesCountry) {
        return {
          product,
          summary,
          matchType: "no_match" as const,
          confidence: 0,
          matchedValue: null,
        };
      }

      return {
        product,
        summary,
        matchType: "exact_destination_field" as const,
        confidence: 8,
        matchedValue: summary.country,
      };
    })
    .filter((result) => result.matchType !== "no_match")
    .sort((a, b) => b.confidence - a.confidence);
}

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

export { MIN_AUTO_SELECT_CONFIDENCE, MIN_WEAK_MATCH_CONFIDENCE };
