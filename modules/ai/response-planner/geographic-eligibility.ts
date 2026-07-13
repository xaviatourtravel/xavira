import type { ProductContext } from "@/modules/business-brain/types/context";
import {
  canonicalizeCountryQuery,
  canonicalizeDestinationQuery,
  extractGeographyFromProduct,
  inferCountryFromDestination,
  type ProductGeography,
} from "@/modules/ai/response-planner/product-geography";
import { normalizeText } from "@/modules/ai/response-planner/product-summary";

export type DestinationRegionConfig = {
  country: string;
  aliases: string[];
};

export const DESTINATION_REGION_REGISTRY: Record<string, DestinationRegionConfig> = {
  yunnan: {
    country: "china",
    aliases: [
      "yunnan",
      "kunming",
      "dali",
      "lijiang",
      "shangrila",
      "shangri la",
      "shangri-la",
      "zhongdian",
      "stone forest",
      "jade dragon snow mountain",
    ],
  },
  zhangjiajie: {
    country: "china",
    aliases: ["zhangjiajie", "zhang jia jie", "wulingyuan"],
  },
  chongqing: {
    country: "china",
    aliases: ["chongqing", "chungking"],
  },
  fenghuang: {
    country: "china",
    aliases: ["fenghuang", "phoenix ancient town"],
  },
  furongzhen: {
    country: "china",
    aliases: ["furongzhen", "furong zhen"],
  },
  beijing: {
    country: "china",
    aliases: ["beijing", "peking"],
  },
  shanghai: {
    country: "china",
    aliases: ["shanghai"],
  },
  xian: {
    country: "china",
    aliases: ["xian", "xi an"],
  },
  tokyo: {
    country: "japan",
    aliases: ["tokyo"],
  },
  shirakawago: {
    country: "japan",
    aliases: ["shirakawago"],
  },
  seoul: {
    country: "korea",
    aliases: ["seoul"],
  },
  hongkong: {
    country: "hong_kong",
    aliases: ["hong kong", "hongkong", "kowloon"],
  },
};

export type GeographicEligibilityResult = {
  eligible: ProductContext[];
  excludedEntityIds: string[];
  exclusionReasons: Record<string, string>;
};

function collectGeographyTokens(geography: ProductGeography, product: ProductContext): Set<string> {
  const tokens = new Set<string>();
  for (const value of [
    ...geography.destinations,
    ...geography.cities,
    ...geography.routes,
    ...geography.aliases,
    normalizeText(product.destination),
    normalizeText(product.name),
  ]) {
    const normalized = normalizeText(value);
    if (normalized) tokens.add(normalized);
    for (const token of normalized.split(" ")) {
      if (token.length > 1) tokens.add(token);
    }
  }
  return tokens;
}

export function resolveQueryDestinationRegion(query: string): string | null {
  const normalized = canonicalizeDestinationQuery(query);
  for (const [regionKey, config] of Object.entries(DESTINATION_REGION_REGISTRY)) {
    if (regionKey === normalized) return regionKey;
    if (config.aliases.some((alias) => alias === normalized || normalized.includes(alias))) {
      return regionKey;
    }
  }
  return null;
}

export function resolveProductDestinationRegions(product: ProductContext): string[] {
  const geography = extractGeographyFromProduct(product);
  const tokens = collectGeographyTokens(geography, product);
  const regions = new Set<string>();

  for (const [regionKey, config] of Object.entries(DESTINATION_REGION_REGISTRY)) {
    if (config.aliases.some((alias) => tokens.has(normalizeText(alias)))) {
      regions.add(regionKey);
    }
  }

  return [...regions];
}

export function productMatchesDestinationRegion(product: ProductContext, regionKey: string): boolean {
  return resolveProductDestinationRegions(product).includes(regionKey);
}

export function isProductEligibleForCountryQuery(product: ProductContext, countryQuery: string): boolean {
  const canonical = canonicalizeCountryQuery(countryQuery);
  if (!canonical) return false;

  const geography = extractGeographyFromProduct(product);
  if (geography.countries.length === 0) return false;

  return geography.countries.includes(canonical);
}

export function isProductEligibleForDestinationQuery(
  product: ProductContext,
  destinationQuery: string,
): boolean {
  const queryRegion = resolveQueryDestinationRegion(destinationQuery);
  if (queryRegion) {
    return productMatchesDestinationRegion(product, queryRegion);
  }

  const normalizedQuery = canonicalizeDestinationQuery(destinationQuery);
  const geography = extractGeographyFromProduct(product);
  const tokens = collectGeographyTokens(geography, product);
  return tokens.has(normalizedQuery);
}

export function isSameCountryDestinationAlternative(
  product: ProductContext,
  destinationQuery: string,
): boolean {
  const queryRegion = resolveQueryDestinationRegion(destinationQuery);
  const country =
    (queryRegion ? DESTINATION_REGION_REGISTRY[queryRegion]?.country : null) ??
    inferCountryFromDestination(destinationQuery);
  if (!country) return false;
  if (!isProductEligibleForCountryQuery(product, country)) return false;
  if (queryRegion && productMatchesDestinationRegion(product, queryRegion)) return false;
  return true;
}

export function filterProductsForCountryScope(
  products: ProductContext[],
  countryQuery: string,
): GeographicEligibilityResult {
  const excludedEntityIds: string[] = [];
  const exclusionReasons: Record<string, string> = {};
  const eligible = products.filter((product) => {
    const passes = isProductEligibleForCountryQuery(product, countryQuery);
    if (!passes) {
      excludedEntityIds.push(product.id);
      exclusionReasons[product.id] = "wrong_country";
    }
    return passes;
  });

  return { eligible, excludedEntityIds, exclusionReasons };
}

export function filterProductsForDestinationScope(
  products: ProductContext[],
  destinationQuery: string,
  mode: "exact" | "same_country_alternative",
): GeographicEligibilityResult {
  const excludedEntityIds: string[] = [];
  const exclusionReasons: Record<string, string> = {};
  const eligible = products.filter((product) => {
    const passes =
      mode === "exact"
        ? isProductEligibleForDestinationQuery(product, destinationQuery)
        : isSameCountryDestinationAlternative(product, destinationQuery);
    if (!passes) {
      excludedEntityIds.push(product.id);
      exclusionReasons[product.id] = mode === "exact" ? "wrong_destination" : "not_same_country_alternative";
    }
    return passes;
  });

  return { eligible, excludedEntityIds, exclusionReasons };
}
