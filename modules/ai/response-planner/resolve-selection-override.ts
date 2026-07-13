import type { ProductContext } from "@/modules/business-brain/types/context";
import type { SelectedEntity } from "@/modules/ai/response-planner/types";
import {
  extractCountryQuery,
  extractDestinationQuery,
} from "@/modules/ai/response-planner/resolve-destination-match";
import { findProductTitleMatch } from "@/modules/ai/response-planner/resolve-product-title-match";
import {
  isProductEligibleForCountryQuery,
  isProductEligibleForDestinationQuery,
} from "@/modules/ai/response-planner/geographic-eligibility";
import { canonicalizeCountryQuery } from "@/modules/ai/response-planner/product-geography";
import { normalizeText } from "@/modules/ai/response-planner/product-summary";

export type SelectionOverrideReason =
  | "explicit_product_title"
  | "explicit_destination"
  | "explicit_country"
  | "explicit_product_category"
  | null;

function findProductByTourPhrase(
  message: string,
  products: ProductContext[],
): ProductContext | null {
  const normalized = normalizeText(message);
  if (!/\bmuslim\b/.test(normalized) || !/\btour\b/.test(normalized)) {
    return null;
  }

  const regionTokens = [
    "japan",
    "jepang",
    "china",
    "cina",
    "korea",
    "yunnan",
    "brunei",
    "hongkong",
    "hong kong",
  ];
  const mentionedRegions = regionTokens.filter((token) => normalized.includes(token));
  if (mentionedRegions.length === 0) return null;

  const matches = products.filter((product) => {
    const haystack = `${normalizeText(product.name)} ${normalizeText(product.destination)}`;
    return mentionedRegions.some((token) => haystack.includes(token));
  });

  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    const scored = matches
      .map((product) => ({
        product,
        score: regionTokens.filter((token) =>
          normalizeText(product.name).includes(token),
        ).length,
      }))
      .sort((a, b) => b.score - a.score);
    if (scored[0].score > scored[1]?.score) return scored[0].product;
  }
  return null;
}

export function resolveSelectionOverride(input: {
  latestMessage: string;
  storedSelectedEntity: SelectedEntity | null;
  products: ProductContext[];
}): {
  shouldOverrideStored: boolean;
  reason: SelectionOverrideReason;
  overrideProduct: ProductContext | null;
} {
  const titleMatch = findProductTitleMatch(input.latestMessage, input.products);
  if (titleMatch) {
    if (
      !input.storedSelectedEntity ||
      titleMatch.product.id !== input.storedSelectedEntity.entityId
    ) {
      return {
        shouldOverrideStored: Boolean(input.storedSelectedEntity),
        reason: "explicit_product_title",
        overrideProduct: titleMatch.product,
      };
    }
    return { shouldOverrideStored: false, reason: null, overrideProduct: null };
  }

  const tourMatch = findProductByTourPhrase(input.latestMessage, input.products);
  if (
    tourMatch &&
    (!input.storedSelectedEntity || tourMatch.id !== input.storedSelectedEntity.entityId)
  ) {
    return {
      shouldOverrideStored: Boolean(input.storedSelectedEntity),
      reason: "explicit_product_category",
      overrideProduct: tourMatch,
    };
  }

  if (!input.storedSelectedEntity) {
    return { shouldOverrideStored: false, reason: null, overrideProduct: null };
  }

  const storedProduct = input.products.find(
    (product) => product.id === input.storedSelectedEntity!.entityId,
  );
  if (!storedProduct) {
    return { shouldOverrideStored: false, reason: null, overrideProduct: null };
  }

  const countryQuery = extractCountryQuery(input.latestMessage);
  if (countryQuery) {
    const canonical = canonicalizeCountryQuery(countryQuery);
    if (canonical && !isProductEligibleForCountryQuery(storedProduct, canonical)) {
      const countryMatches = input.products.filter((product) =>
        isProductEligibleForCountryQuery(product, canonical),
      );
      return {
        shouldOverrideStored: true,
        reason: "explicit_country",
        overrideProduct: countryMatches.length === 1 ? countryMatches[0] : tourMatch,
      };
    }
  }

  const destinationQuery = extractDestinationQuery(input.latestMessage);
  if (
    destinationQuery &&
    !isProductEligibleForDestinationQuery(storedProduct, destinationQuery)
  ) {
    const destinationMatches = input.products.filter((product) =>
      isProductEligibleForDestinationQuery(product, destinationQuery),
    );
    return {
      shouldOverrideStored: true,
      reason: "explicit_destination",
      overrideProduct: destinationMatches.length === 1 ? destinationMatches[0] : null,
    };
  }

  return { shouldOverrideStored: false, reason: null, overrideProduct: null };
}
