import type { CatalogResult } from "@/modules/ai/response-planner/types";
import {
  formatProductPriceLabel,
  toProductSummary,
  type ProductSummary,
} from "@/modules/ai/response-planner/product-summary";
import {
  extractCountryQuery,
  extractDestinationQuery,
  isCountryQuery,
  matchProductsByCountry,
  matchProductsByDestination,
} from "@/modules/ai/response-planner/resolve-destination-match";
import type { ProductContext } from "@/modules/business-brain/types/context";

export const MAX_CATALOG_RESULTS = 5;
export const MAX_CATALOG_CONTEXT_IDS = 10;

export type CatalogQueryType = "country" | "destination" | "category" | "general";

export function resolveCatalogQuery(
  message: string,
  requestType: string,
): { queryType: CatalogQueryType; queryValue: string | null } {
  if (requestType === "CATALOG_DISCOVERY") {
    return { queryType: "general", queryValue: null };
  }

  const destination = extractDestinationQuery(message);
  if (destination && isCountryQuery(destination)) {
    return { queryType: "country", queryValue: destination };
  }

  if (destination) {
    return { queryType: "destination", queryValue: destination };
  }

  const country = extractCountryQuery(message);
  if (country) {
    return { queryType: "country", queryValue: country };
  }

  return { queryType: "general", queryValue: null };
}

function summaryToCatalogResult(summary: ProductSummary): CatalogResult {
  return {
    entityId: summary.entityId,
    displayName: summary.displayName,
    destinationOrCategory: summary.destination || summary.category || summary.country || "Paket",
    duration: summary.duration,
    startingPrice: summary.startingPrice,
    currency: summary.currency,
    priceLabel: summary.priceLabel,
    departureDates: summary.departureDates,
    sourceIds: summary.sourceIds,
  };
}

export function buildCatalogResults(input: {
  products: ProductContext[];
  message: string;
  requestType: string;
}): {
  results: CatalogResult[];
  queryType: CatalogQueryType;
  queryValue: string | null;
  destinationMatchType: string | null;
} {
  const { queryType, queryValue } = resolveCatalogQuery(input.message, input.requestType);

  if (queryType === "general") {
    const summaries = input.products
      .map(toProductSummary)
      .sort((a, b) => a.displayName.localeCompare(b.displayName));

    return {
      results: summaries.slice(0, MAX_CATALOG_RESULTS).map(summaryToCatalogResult),
      queryType,
      queryValue,
      destinationMatchType: null,
    };
  }

  if (queryType === "country" && queryValue) {
    const matches = matchProductsByCountry(input.products, queryValue);
    return {
      results: matches.slice(0, MAX_CATALOG_RESULTS).map((match) => summaryToCatalogResult(match.summary)),
      queryType,
      queryValue,
      destinationMatchType: "exact_destination_field",
    };
  }

  if (queryType === "destination" && queryValue) {
    const matches = matchProductsByDestination(input.products, queryValue);
    return {
      results: matches.slice(0, MAX_CATALOG_RESULTS).map((match) => summaryToCatalogResult(match.summary)),
      queryType,
      queryValue,
      destinationMatchType: matches[0]?.matchType ?? null,
    };
  }

  return {
    results: [],
    queryType,
    queryValue,
    destinationMatchType: null,
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

export function findAlternativeCountryResults(
  products: ProductContext[],
  destinationQuery: string,
): CatalogResult[] {
  const destinationMatches = matchProductsByDestination(products, destinationQuery);
  if (destinationMatches.length > 0) return [];

  const firstProduct = products[0];
  if (!firstProduct) return [];

  const country = toProductSummary(firstProduct).country;
  if (!country) return [];

  const alternatives = matchProductsByCountry(products, country);
  return alternatives
    .slice(0, MAX_CATALOG_RESULTS)
    .map((match) => summaryToCatalogResult(match.summary));
}

export function resolveCatalogResultsFromContext(input: {
  products: ProductContext[];
  catalogContext: { entityIds: string[] } | null;
}): CatalogResult[] {
  if (!input.catalogContext?.entityIds.length) return [];

  const allowedIds = new Set(input.catalogContext.entityIds);
  return input.products
    .filter((product) => allowedIds.has(product.id))
    .map((product) => summaryToCatalogResult(toProductSummary(product)))
    .slice(0, MAX_CATALOG_RESULTS);
}

export function buildCatalogContext(input: {
  queryType: CatalogQueryType;
  queryValue: string | null;
  results: CatalogResult[];
  now?: Date;
}) {
  return {
    queryType: input.queryType,
    queryValue: input.queryValue,
    entityIds: input.results.map((item) => item.entityId).slice(0, MAX_CATALOG_CONTEXT_IDS),
    establishedAt: (input.now ?? new Date()).toISOString(),
  };
}
