import type { ProductContext } from "@/modules/business-brain/types/context";
import type { SelectedEntity } from "@/modules/ai/response-planner/types";
import {
  extractCountryQuery,
  extractDestinationQuery,
} from "@/modules/ai/response-planner/resolve-destination-match";
import {
  canonicalizeCountryQuery,
  getCountryDisplayName,
  productMatchesCountry,
  productMatchesDestination,
} from "@/modules/ai/response-planner/product-geography";

function formatDestinationList(destinations: string[]): string {
  const unique = [...new Set(destinations.filter(Boolean))];
  if (unique.length === 0) return "destinasi yang tercatat";
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} dan ${unique[1]}`;
  return `${unique.slice(0, -1).join(", ")}, dan ${unique[unique.length - 1]}`;
}

export function buildGeographicConfirmationAnswer(input: {
  message: string;
  referencedProduct: ProductContext | null;
  selectedEntity: SelectedEntity | null;
}): string | null {
  const product = input.referencedProduct;
  if (!product) return null;

  const productName = input.selectedEntity?.displayName ?? product.name;
  const destinationQuery =
    extractDestinationQuery(input.message) ??
    (() => {
      const match = input.message.match(/\b(?:di|ke|termasuk)\s+([\p{L}\p{N}\s'-]{2,40})/iu);
      return match?.[1]?.trim().replace(/[?.!,]+$/g, "") ?? null;
    })();
  const countryQuery = extractCountryQuery(input.message);

  if (destinationQuery) {
    const match = productMatchesDestination(product, destinationQuery);
    if (match === "exact_destination" || match === "exact_city" || match === "verified_alias") {
      return `Betul, Kak. ${productName} mencakup ${destinationQuery}.`;
    }

    const destinations = [product.destination, ...product.highlights].filter(Boolean);
    return `Bukan, Kak. Paket ${productName} mencakup ${formatDestinationList(destinations)}, bukan ${destinationQuery}. Saya bisa bantu carikan paket khusus ${destinationQuery} jika Kakak mau.`;
  }

  if (countryQuery) {
    const canonical = canonicalizeCountryQuery(countryQuery);
    if (!canonical) return null;
    const countryLabel = getCountryDisplayName(canonical);
    if (productMatchesCountry(product, canonical)) {
      return `Betul, Kak. ${productName} termasuk paket ke ${countryLabel}.`;
    }
    return `Bukan, Kak. ${productName} bukan paket ke ${countryLabel}. Saya bisa bantu carikan paket ${countryLabel} jika Kakak mau.`;
  }

  return null;
}
