import type { CatalogResult } from "@/modules/ai/response-planner/types";
import {
  formatProductPriceLabel,
  toProductSummary,
  type ProductSummary,
} from "@/modules/ai/response-planner/product-summary";
import {
  canonicalizeCountryQuery,
  getCountryDisplayName,
  getDestinationDisplayName,
  inferCountryFromDestination,
} from "@/modules/ai/response-planner/product-geography";
import {
  extractCountryQuery,
  extractDestinationQuery,
  findSameCountryAlternatives,
  isCountryQuery,
  matchProductsByCountry,
  matchProductsByDestination,
  type DestinationMatchResult,
} from "@/modules/ai/response-planner/resolve-destination-match";
import {
  filterProductsForCountryScope,
  filterProductsForDestinationScope,
} from "@/modules/ai/response-planner/geographic-eligibility";
import type { ProductContext } from "@/modules/business-brain/types/context";

export const MAX_CATALOG_RESULTS = 5;
export const MAX_CATALOG_CONTEXT_IDS = 10;

export type CatalogQueryType = "country" | "destination" | "category" | "general";

export type CatalogBuildResult = {
  exactResults: CatalogResult[];
  alternativeResults: CatalogResult[];
  results: CatalogResult[];
  queryType: CatalogQueryType;
  queryValue: string | null;
  destinationMatchType: string | null;
  excludedEntityIds: string[];
  exclusionReasons: Record<string, string>;
};

export function resolveCatalogQuery(
  message: string,
  requestType: string,
): { queryType: CatalogQueryType; queryValue: string | null } {
  if (requestType === "CATALOG_DISCOVERY") {
    return { queryType: "general", queryValue: null };
  }

  const country = extractCountryQuery(message);
  if (country) {
    return { queryType: "country", queryValue: country };
  }

  const destination = extractDestinationQuery(message);
  if (destination && isCountryQuery(destination)) {
    return { queryType: "country", queryValue: canonicalizeCountryQuery(destination) ?? destination };
  }

  if (destination) {
    return { queryType: "destination", queryValue: destination };
  }

  return { queryType: "general", queryValue: null };
}

function summaryToCatalogResult(
  summary: ProductSummary,
  matchType: CatalogResult["matchType"] = "exact",
): CatalogResult {
  return {
    entityId: summary.entityId,
    displayName: summary.displayName,
    destinationOrCategory:
      summary.destination ||
      (summary.primaryCountry ? getCountryDisplayName(summary.primaryCountry) : null) ||
      summary.category ||
      "Paket",
    duration: summary.duration,
    startingPrice: summary.startingPrice,
    currency: summary.currency,
    priceLabel: summary.priceLabel,
    priceSourceField: summary.priceSourceField,
    priceBasis: summary.priceBasis,
    departureDates: summary.departureDates,
    sourceIds: summary.sourceIds,
    matchType,
    geographicMatchType: summary.geographicMatchType,
  };
}

function matchToCatalogResult(match: DestinationMatchResult, matchType: CatalogResult["matchType"]): CatalogResult {
  const summary = {
    ...match.summary,
    geographicMatchType: match.matchType,
  };
  return summaryToCatalogResult(summary, matchType);
}

export function buildCatalogResults(input: {
  products: ProductContext[];
  message: string;
  requestType: string;
}): CatalogBuildResult {
  const { queryType, queryValue } = resolveCatalogQuery(input.message, input.requestType);
  const excludedEntityIds: string[] = [];
  const exclusionReasons: Record<string, string> = {};

  if (queryType === "general") {
    const summaries = input.products
      .map(toProductSummary)
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
    const exactResults = summaries.slice(0, MAX_CATALOG_RESULTS).map((summary) => summaryToCatalogResult(summary));
    return {
      exactResults,
      alternativeResults: [],
      results: exactResults,
      queryType,
      queryValue,
      destinationMatchType: null,
      excludedEntityIds,
      exclusionReasons,
    };
  }

  if (queryType === "country" && queryValue) {
    const scoped = filterProductsForCountryScope(input.products, queryValue);
    excludedEntityIds.push(...scoped.excludedEntityIds);
    Object.assign(exclusionReasons, scoped.exclusionReasons);

    const matches = matchProductsByCountry(scoped.eligible, queryValue);
    const exactResults = matches.slice(0, MAX_CATALOG_RESULTS).map((match) => matchToCatalogResult(match, "exact"));
    return {
      exactResults,
      alternativeResults: [],
      results: exactResults,
      queryType,
      queryValue,
      destinationMatchType: "exact_country",
      excludedEntityIds,
      exclusionReasons,
    };
  }

  if (queryType === "destination" && queryValue) {
    const exactScoped = filterProductsForDestinationScope(input.products, queryValue, "exact");
    excludedEntityIds.push(...exactScoped.excludedEntityIds);
    Object.assign(exclusionReasons, exactScoped.exclusionReasons);

    const exactMatches = matchProductsByDestination(exactScoped.eligible, queryValue);
    const exactResults = exactMatches
      .slice(0, MAX_CATALOG_RESULTS)
      .map((match) => matchToCatalogResult(match, "exact"));

    const exactIds = new Set(exactResults.map((item) => item.entityId));
    const alternativeScoped = filterProductsForDestinationScope(input.products, queryValue, "same_country_alternative");
    for (const id of alternativeScoped.excludedEntityIds) {
      if (!excludedEntityIds.includes(id)) {
        excludedEntityIds.push(id);
        exclusionReasons[id] = alternativeScoped.exclusionReasons[id] ?? "not_same_country_alternative";
      }
    }

    const alternativeMatches = findSameCountryAlternatives(input.products, queryValue, exactIds);
    const alternativeResults = alternativeMatches
      .slice(0, MAX_CATALOG_RESULTS)
      .map((match) => matchToCatalogResult(match, "same_country_alternative"));

    return {
      exactResults,
      alternativeResults,
      results: exactResults.length > 0 ? exactResults : alternativeResults,
      queryType,
      queryValue,
      destinationMatchType: exactMatches[0]?.matchType ?? null,
      excludedEntityIds,
      exclusionReasons,
    };
  }

  return {
    exactResults: [],
    alternativeResults: [],
    results: [],
    queryType,
    queryValue,
    destinationMatchType: null,
    excludedEntityIds,
    exclusionReasons,
  };
}

export function formatCatalogList(results: CatalogResult[]): string {
  return results
    .map((item) => {
      const parts = [`• ${item.displayName}`];
      if (item.duration) parts.push(item.duration);
      if (item.priceLabel) parts.push(item.priceLabel);
      return parts.join(" — ");
    })
    .join("\n");
}

export function formatPriceList(results: CatalogResult[]): string {
  return results
    .map((item) => {
      const label = item.priceLabel ?? "harga belum tercatat";
      return `• ${item.displayName} — ${label}`;
    })
    .join("\n");
}

export function resolveCatalogResultsFromContext(input: {
  products: ProductContext[];
  catalogContext: { entityIds: string[]; exactEntityIds?: string[] } | null;
}): CatalogResult[] {
  const ids =
    input.catalogContext?.exactEntityIds?.length
      ? input.catalogContext.exactEntityIds
      : input.catalogContext?.entityIds;
  if (!ids?.length) return [];

  const allowedIds = new Set(ids);
  return input.products
    .filter((product) => allowedIds.has(product.id))
    .map((product) => summaryToCatalogResult(toProductSummary(product)))
    .slice(0, MAX_CATALOG_RESULTS);
}

export function buildCatalogContext(input: {
  queryType: CatalogQueryType;
  queryValue: string | null;
  exactResults: CatalogResult[];
  alternativeResults: CatalogResult[];
  now?: Date;
}) {
  const exactEntityIds = input.exactResults.map((item) => item.entityId);
  const alternativeEntityIds = input.alternativeResults.map((item) => item.entityId);
  const entityIds = [...new Set([...exactEntityIds, ...alternativeEntityIds])].slice(0, MAX_CATALOG_CONTEXT_IDS);

  return {
    queryType: input.queryType,
    queryValue: input.queryValue,
    entityIds,
    exactEntityIds,
    alternativeEntityIds,
    establishedAt: (input.now ?? new Date()).toISOString(),
  };
}

export function resolveCatalogDisplayLabels(input: {
  queryType: CatalogQueryType;
  queryValue: string | null;
  hasExact: boolean;
  hasAlternatives: boolean;
}): { destinationLabel: string; countryLabel: string } {
  const country = input.queryValue ? canonicalizeCountryQuery(input.queryValue) : null;
  const inferredCountry = input.queryValue ? inferCountryFromDestination(input.queryValue) : null;
  return {
    destinationLabel: getDestinationDisplayName(input.queryValue ?? "destinasi ini"),
    countryLabel: getCountryDisplayName(country ?? inferredCountry ?? input.queryValue ?? "negara ini"),
  };
}
