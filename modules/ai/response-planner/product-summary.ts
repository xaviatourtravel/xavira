import type { ProductContext } from "@/modules/business-brain/types/context";
import type { ProductCurrency } from "@/modules/business-brain/types/products";

export type ProductSummary = {
  entityId: string;
  displayName: string;
  destination: string;
  country: string | null;
  route: string | null;
  duration: string | null;
  category: string;
  startingPrice: number | null;
  currency: ProductCurrency | null;
  priceLabel: string | null;
  departureDates: string[];
  status: string;
  sourceIds: string[];
  searchableText: string;
};

const DURATION_PATTERN = /\b(\d{1,2}d\d{1,2}n|\d{1,2}\s*hari(?:\s*\/?\s*\d{1,2}\s*malam)?)\b/i;

const COUNTRY_ALIASES: Record<string, string[]> = {
  china: ["china", "cina", "tiongkok", "prc"],
  japan: ["japan", "jepang"],
  korea: ["korea", "korean", "selatan"],
  turkey: ["turkey", "turki"],
  europe: ["europe", "eropa"],
  singapore: ["singapore", "singapura"],
  malaysia: ["malaysia"],
  thailand: ["thailand", "thai"],
  vietnam: ["vietnam"],
  australia: ["australia"],
  "saudi arabia": ["saudi", "arab saudi"],
  egypt: ["egypt", "mesir"],
};

const DESTINATION_ALIASES: Record<string, string[]> = {
  yunnan: ["yunnan", "kunming", "dali", "lijiang"],
  chongqing: ["chongqing", "chungking"],
  zhangjiajie: ["zhangjiajie", "zhang jia jie"],
  xian: ["xian", "xi'an", "xi an"],
  tokyo: ["tokyo"],
  osaka: ["osaka"],
  kyoto: ["kyoto"],
  bali: ["bali"],
  lombok: ["lombok"],
};

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
  const name = product.name;
  const dashParts = name.split(/[–—-]/).map((part) => part.trim()).filter(Boolean);
  if (dashParts.length >= 2) {
    return dashParts.slice(0, 3).join(" – ");
  }
  if (product.highlights.length >= 2) {
    return product.highlights.slice(0, 3).join(" – ");
  }
  return null;
}

const DESTINATION_TO_COUNTRY: Record<string, string> = {
  yunnan: "china",
  kunming: "china",
  dali: "china",
  lijiang: "china",
  chongqing: "china",
  zhangjiajie: "china",
  xian: "china",
  tokyo: "japan",
  osaka: "japan",
  kyoto: "japan",
  bali: "indonesia",
  lombok: "indonesia",
};

export function resolveCountryFromProduct(product: ProductContext): string | null {
  const haystack = normalizeText(
    [product.destination, product.name, product.description, ...product.highlights, product.aiNotes].join(" "),
  );

  for (const [destination, country] of Object.entries(DESTINATION_TO_COUNTRY)) {
    if (haystack.includes(destination)) {
      return country;
    }
  }

  for (const [country, aliases] of Object.entries(COUNTRY_ALIASES)) {
    if (aliases.some((alias) => haystack.includes(normalizeText(alias)))) {
      return country;
    }
  }

  if (product.destination.trim()) {
    return normalizeText(product.destination);
  }

  return null;
}

export function resolveCountryAliases(country: string): string[] {
  const normalized = normalizeText(country);
  const aliases = new Set<string>([normalized]);
  for (const [canonical, values] of Object.entries(COUNTRY_ALIASES)) {
    if (canonical === normalized || values.some((alias) => normalized.includes(normalizeText(alias)))) {
      aliases.add(canonical);
      values.forEach((alias) => aliases.add(normalizeText(alias)));
    }
  }
  return [...aliases];
}
export function resolveDestinationAliases(destination: string): string[] {
  const normalized = normalizeText(destination);
  const aliases = new Set<string>([normalized]);

  for (const [canonical, values] of Object.entries(DESTINATION_ALIASES)) {
    if (values.some((alias) => normalized.includes(normalizeText(alias)) || normalizeText(alias).includes(normalized))) {
      aliases.add(canonical);
      values.forEach((alias) => aliases.add(normalizeText(alias)));
    }
  }

  return [...aliases];
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

  const departureDates = product.departures
    .filter((item) => item.departureDate?.trim() && item.status !== "full")
    .map((item) => item.departureDate.trim())
    .slice(0, 5);

  const searchableText = normalizeText(
    [
      product.name,
      product.destination,
      product.category,
      product.description,
      ...product.highlights,
      product.aiNotes,
      resolveCountryFromProduct(product) ?? "",
    ].join(" "),
  );

  return {
    entityId: product.id,
    displayName: product.name,
    destination: product.destination.trim(),
    country: resolveCountryFromProduct(product),
    route: extractRoute(product),
    duration: extractDuration(product),
    category: product.category,
    startingPrice,
    currency,
    priceLabel: formatProductPriceLabel(startingPrice, currency),
    departureDates,
    status: product.status,
    sourceIds: [product.id],
    searchableText,
  };
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
