import type { ProductContext } from "@/modules/business-brain/types/context";
import type { ProductCurrency } from "@/modules/business-brain/types/products";
import {
  extractGeographyFromProduct,
  getCountryDisplayName,
} from "@/modules/ai/response-planner/product-geography";

export type ProductSummary = {
  entityId: string;
  displayName: string;
  destination: string;
  country: string | null;
  primaryCountry: string | null;
  route: string | null;
  duration: string | null;
  category: string;
  startingPrice: number | null;
  currency: ProductCurrency | null;
  priceLabel: string | null;
  priceSourceField: string | null;
  priceBasis: string | null;
  departureDates: string[];
  status: string;
  sourceIds: string[];
  searchableText: string;
  geographicMatchType: string | null;
  highlights: string[];
};

const DURATION_PATTERN = /\b(\d{1,2}d\d{1,2}n|\d{1,2}\s*hari(?:\s*\/?\s*\d{1,2}\s*malam)?)\b/i;

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 2);
}

function extractDuration(product: ProductContext): string | null {
  const match = product.name.match(DURATION_PATTERN);
  if (match) return match[1].toUpperCase();
  const descriptionMatch = product.description.match(DURATION_PATTERN);
  return descriptionMatch ? descriptionMatch[1].toUpperCase() : null;
}

function extractRoute(product: ProductContext): string | null {
  const geography = extractGeographyFromProduct(product);
  if (geography.routes.length >= 2) {
    return geography.routes.slice(0, 5).join(", ");
  }
  const name = product.name;
  const dashParts = name.split(/[–—-]/).map((part) => part.trim()).filter(Boolean);
  if (dashParts.length >= 2) {
    return dashParts.slice(0, 3).join(" – ");
  }
  if (product.highlights.length >= 2) {
    return product.highlights.slice(0, 3).join(" – ");
  }
  return product.destination.trim() || null;
}

export function resolveCountryFromProduct(product: ProductContext): string | null {
  const geography = extractGeographyFromProduct(product);
  return geography.primaryCountry;
}

export function resolveCountryDisplayFromProduct(product: ProductContext): string | null {
  const country = resolveCountryFromProduct(product);
  return country ? getCountryDisplayName(country) : null;
}

export function formatProductPriceLabel(
  price: number | null,
  currency: ProductCurrency | null,
): string | null {
  if (price == null || price <= 0 || !currency) return null;
  if (currency === "IDR") {
    return `mulai Rp${price.toLocaleString("id-ID")}`;
  }
  return `mulai ${currency} ${price.toLocaleString("en-US")}`;
}

export function toProductSummary(product: ProductContext): ProductSummary {
  const lowestPrice = product.pricing
    .filter((item) => item.price > 0)
    .sort((a, b) => a.price - b.price)[0];

  const startingPrice = lowestPrice?.price ?? null;
  const currency = lowestPrice?.currency ?? null;
  const geography = extractGeographyFromProduct(product);
  const primaryCountry = geography.primaryCountry;

  const departureDates = product.departures
    .filter((item) => item.departureDate?.trim() && item.status !== "full")
    .map((item) => item.departureDate.trim())
    .slice(0, 5);

  const searchableText = normalizeText(
    [
      product.name,
      product.destination,
      product.category,
      ...product.highlights,
      product.aiNotes,
      primaryCountry ?? "",
    ].join(" "),
  );

  return {
    entityId: product.id,
    displayName: product.name,
    destination: product.destination.trim(),
    country: primaryCountry ? getCountryDisplayName(primaryCountry) : null,
    primaryCountry,
    route: extractRoute(product),
    duration: extractDuration(product),
    category: product.category,
    startingPrice,
    currency,
    priceLabel: formatProductPriceLabel(startingPrice, currency),
    priceSourceField: lowestPrice ? "pricing" : null,
    priceBasis: lowestPrice?.packageName ?? null,
    departureDates,
    status: product.status,
    sourceIds: [product.id],
    searchableText,
    geographicMatchType: null,
    highlights: product.highlights,
  };
}

export function buildSelectedProductSummary(product: ProductContext): string {
  const summary = toProductSummary(product);
  const parts: string[] = [`Tentu, Kak. ${summary.displayName}`];

  if (summary.duration) {
    parts.push(`adalah perjalanan ${summary.duration}`);
  }

  if (summary.route) {
    parts.push(`dengan rute ${summary.route}`);
  } else if (summary.destination) {
    parts.push(`ke ${summary.destination}`);
  }

  if (summary.priceLabel) {
    parts.push(`Harga ${summary.priceLabel} per orang`);
  }

  if (summary.departureDates.length > 0) {
    parts.push(`Keberangkatan berikutnya tersedia pada ${summary.departureDates.join(", ")}`);
  }

  return `${parts.join(". ").replace(/\.\./g, ".")}.`;
}

export function toProductSummaries(products: ProductContext[]): ProductSummary[] {
  return products.map(toProductSummary);
}

export function productSummaryMatchesTokens(summary: ProductSummary, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  return tokens.reduce(
    (score, token) => (summary.searchableText.includes(normalizeText(token)) ? score + 1 : score),
    0,
  );
}
