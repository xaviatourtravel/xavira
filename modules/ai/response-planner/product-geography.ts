import type { ProductContext } from "@/modules/business-brain/types/context";
import { normalizeText } from "@/modules/ai/response-planner/product-summary";

export type ProductGeography = {
  countryCodes: string[];
  countries: string[];
  destinations: string[];
  cities: string[];
  routes: string[];
  aliases: string[];
  normalizedCountries: string[];
  normalizedDestinations: string[];
  primaryCountry: string | null;
};

export type GeographicMatchType =
  | "exact_country"
  | "exact_destination"
  | "exact_city"
  | "exact_route"
  | "verified_alias"
  | "same_country_alternative"
  | "no_match";

export type GeographicExclusionReason =
  | "wrong_country"
  | "wrong_destination"
  | "archived"
  | "draft_live_mode"
  | "weak_retrieval_only"
  | "no_verified_geography";

const COUNTRY_REGISTRY: Record<
  string,
  { code: string; names: string[]; destinations: string[] }
> = {
  china: {
    code: "CN",
    names: ["china", "cina", "tiongkok", "prc"],
    destinations: [
      "yunnan",
      "kunming",
      "dali",
      "lijiang",
      "chongqing",
      "zhangjiajie",
      "xian",
      "xi an",
      "beijing",
      "shanghai",
      "furongzhen",
    ],
  },
  japan: {
    code: "JP",
    names: ["japan", "jepang"],
    destinations: ["tokyo", "osaka", "kyoto", "narita", "shirakawago", "nagoya", "fuji", "disneyland"],
  },
  brunei: {
    code: "BN",
    names: ["brunei", "brunei darussalam"],
    destinations: ["brunei", "bandar seri begawan", "brunei city"],
  },
  hong_kong: {
    code: "HK",
    names: ["hong kong", "hongkong"],
    destinations: ["hong kong", "hongkong", "kowloon"],
  },
  korea: {
    code: "KR",
    names: ["korea", "korea selatan", "south korea"],
    destinations: ["seoul", "busan", "jeju"],
  },
  indonesia: {
    code: "ID",
    names: ["indonesia"],
    destinations: ["bali", "lombok", "jakarta", "yogyakarta"],
  },
  singapore: {
    code: "SG",
    names: ["singapore", "singapura"],
    destinations: ["singapore", "singapura"],
  },
  malaysia: {
    code: "MY",
    names: ["malaysia"],
    destinations: ["kuala lumpur", "penang", "langkawi"],
  },
  turkey: {
    code: "TR",
    names: ["turkey", "turki"],
    destinations: ["istanbul", "cappadocia"],
  },
};

const NOISE_TOKENS = new Set([
  "nih",
  "ga",
  "gak",
  "dong",
  "ya",
  "kah",
  "aja",
  "sih",
  "deh",
  "paketnya",
  "paket",
  "ada",
  "enggak",
  "nggak",
  "tidak",
  "mau",
  "pengen",
  "ingin",
  "jalan",
  "jalanjalan",
  "trip",
  "tour",
  "ke",
  "the",
  "and",
  "muslim",
  "friendly",
  "tour",
  "package",
]);

function tokenizeGeographic(value: string): string[] {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 1 && !NOISE_TOKENS.has(token));
}

function extractRouteParts(product: ProductContext): string[] {
  const parts = new Set<string>();
  const nameParts = product.name.split(/[+–—\-/]/).map((part) => normalizeText(part.trim())).filter(Boolean);
  for (const part of nameParts) {
    parts.add(part);
    tokenizeGeographic(part).forEach((token) => parts.add(token));
  }
  for (const highlight of product.highlights) {
    const normalized = normalizeText(highlight);
    if (normalized) parts.add(normalized);
  }
  if (product.destination.trim()) {
    parts.add(normalizeText(product.destination));
  }
  return [...parts];
}

function resolveCountryFromToken(token: string): string | null {
  const normalized = normalizeText(token);
  for (const [country, config] of Object.entries(COUNTRY_REGISTRY)) {
    if (config.names.includes(normalized)) return country;
    if (config.destinations.includes(normalized)) return country;
  }
  return null;
}

export function extractGeographyFromProduct(product: ProductContext): ProductGeography {
  const verifiedFields = [
    product.name,
    product.destination,
    product.category,
    ...product.highlights,
    product.aiNotes,
  ];

  const routes = extractRouteParts(product);
  const tokens = new Set<string>();
  const destinations = new Set<string>();
  const cities = new Set<string>();
  const countries = new Set<string>();
  const countryCodes = new Set<string>();
  const aliases = new Set<string>();

  for (const field of verifiedFields) {
    for (const token of tokenizeGeographic(field)) {
      tokens.add(token);
      const country = resolveCountryFromToken(token);
      if (country) {
        countries.add(country);
        countryCodes.add(COUNTRY_REGISTRY[country].code);
        aliases.add(token);
      }
      for (const [country, config] of Object.entries(COUNTRY_REGISTRY)) {
        if (config.destinations.includes(token)) {
          destinations.add(token);
          cities.add(token);
          countries.add(country);
          countryCodes.add(config.code);
          aliases.add(token);
        }
        if (config.names.includes(token)) {
          countries.add(country);
          countryCodes.add(config.code);
          aliases.add(token);
        }
      }
    }
  }

  if (product.destination.trim()) {
    const destination = normalizeText(product.destination);
    destinations.add(destination);
    const country = resolveCountryFromToken(destination);
    if (country) countries.add(country);
  }

  const countryList = [...countries];
  const normalizedCountries = [...countryList];
  const normalizedDestinations = resolveNormalizedDestinationRegions(
    destinations,
    cities,
    new Set([...aliases, ...tokens]),
    product.destination,
  );

  return {
    countryCodes: [...countryCodes],
    countries: countryList,
    destinations: [...destinations],
    cities: [...cities],
    routes,
    aliases: [...aliases, ...tokens],
    normalizedCountries,
    normalizedDestinations,
    primaryCountry: countryList[0] ?? null,
  };
}

function resolveNormalizedDestinationRegions(
  destinations: Set<string>,
  cities: Set<string>,
  aliases: Set<string>,
  productDestination: string,
): string[] {
  const probeTokens = new Set<string>([
    ...destinations,
    ...cities,
    ...aliases,
    normalizeText(productDestination),
  ]);
  const regions = new Set<string>();

  for (const [regionKey, regionAliases] of Object.entries(DESTINATION_ALIAS_GROUPS)) {
    if (regionAliases.some((alias) => probeTokens.has(alias))) {
      regions.add(regionKey);
    }
  }

  return [...regions];
}

export function canonicalizeCountryQuery(query: string): string | null {
  const normalized = normalizeText(query);
  for (const [country, config] of Object.entries(COUNTRY_REGISTRY)) {
    if (config.names.some((name) => normalized === name || normalized.includes(name))) {
      return country;
    }
  }
  return null;
}

export function canonicalizeDestinationQuery(query: string): string {
  const normalized = normalizeText(query);
  const tokens = tokenizeGeographic(normalized);
  return tokens[0] ?? normalized;
}

export function cleanGeographicQuery(raw: string): string {
  const normalized = normalizeText(raw);
  const tokens = tokenizeGeographic(normalized);
  if (tokens.length === 0) return normalized;

  const country = canonicalizeCountryQuery(tokens.join(" "));
  if (country) return country;

  return tokens.slice(0, 3).join(" ");
}

export function geographyIncludesCountry(geography: ProductGeography, countryQuery: string): boolean {
  const canonical = canonicalizeCountryQuery(countryQuery);
  if (!canonical) return false;
  return geography.countries.includes(canonical);
}

const DESTINATION_ALIAS_GROUPS: Record<string, string[]> = {
  yunnan: [
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
  chongqing: ["chongqing", "chungking"],
  zhangjiajie: ["zhangjiajie", "zhang jia jie", "wulingyuan"],
  fenghuang: ["fenghuang", "phoenix ancient town"],
  furongzhen: ["furongzhen", "furong zhen"],
  xian: ["xian", "xi an", "xi'an"],
  tokyo: ["tokyo"],
  shirakawago: ["shirakawago"],
  hongkong: ["hong kong", "hongkong"],
};

function resolveDestinationAliasGroup(query: string): string[] {
  const normalized = normalizeText(query);
  const aliases = new Set<string>([normalized]);

  for (const [canonical, values] of Object.entries(DESTINATION_ALIAS_GROUPS)) {
    if (canonical === normalized || values.includes(normalized)) {
      aliases.add(canonical);
      values.forEach((value) => aliases.add(value));
      return [...aliases];
    }
  }

  for (const [, config] of Object.entries(COUNTRY_REGISTRY)) {
    if (config.destinations.includes(normalized)) {
      aliases.add(normalized);
      return [...aliases];
    }
  }

  return [...aliases];
}

export function geographyIncludesDestination(
  geography: ProductGeography,
  destinationQuery: string,
): GeographicMatchType {
  const query = canonicalizeDestinationQuery(destinationQuery);
  const queryRegion = resolveDestinationAliasGroup(query)[0] === query
    ? query
    : Object.keys(DESTINATION_ALIAS_GROUPS).find((key) =>
        DESTINATION_ALIAS_GROUPS[key].includes(query) || key === query,
      ) ?? query;
  const queryAliases = new Set(resolveDestinationAliasGroup(query));

  if (
    geography.normalizedDestinations.includes(queryRegion) ||
    geography.normalizedDestinations.some((item) => queryAliases.has(item))
  ) {
    return "exact_destination";
  }

  const exactDestination = geography.destinations.find((item) => queryAliases.has(item));
  if (exactDestination) return "exact_destination";

  const cityMatch = geography.cities.find((item) => queryAliases.has(item));
  if (cityMatch) return "exact_city";

  const routeMatch = geography.routes.find((route) =>
    [...queryAliases].some(
      (alias) =>
        route === alias ||
        route === normalizeText(alias) ||
        (alias.length >= 4 &&
          (route.includes(` ${alias} `) || route.startsWith(`${alias} `) || route.endsWith(` ${alias}`))),
    ),
  );
  if (routeMatch) return "exact_route";

  const aliasMatch = geography.aliases.find((alias) => queryAliases.has(alias));
  if (aliasMatch) return "verified_alias";

  return "no_match";
}

export function productMatchesCountry(product: ProductContext, countryQuery: string): boolean {
  const geography = extractGeographyFromProduct(product);
  if (geography.normalizedCountries.length === 0) return false;
  const canonical = canonicalizeCountryQuery(countryQuery);
  if (!canonical) return false;
  return geography.normalizedCountries.includes(canonical);
}

export function productMatchesDestination(
  product: ProductContext,
  destinationQuery: string,
): GeographicMatchType {
  const geography = extractGeographyFromProduct(product);
  if (geography.destinations.length === 0 && geography.cities.length === 0 && geography.routes.length === 0) {
    return "no_match";
  }
  return geographyIncludesDestination(geography, destinationQuery);
}

export function inferCountryFromDestination(destinationQuery: string): string | null {
  const cleaned = cleanGeographicQuery(destinationQuery);
  const country = canonicalizeCountryQuery(cleaned);
  if (country) return country;

  const geographyProbe = extractGeographyFromProduct({
    id: "probe",
    name: cleaned,
    destination: cleaned,
    category: "",
    description: "",
    highlights: [],
    pricing: [],
    departures: [],
    included: [],
    excluded: [],
    aiNotes: "",
    status: "published",
  });
  return geographyProbe.primaryCountry;
}

export function getCountryDisplayName(country: string): string {
  const names: Record<string, string> = {
    china: "China",
    japan: "Jepang",
    brunei: "Brunei",
    hong_kong: "Hong Kong",
    korea: "Korea",
    indonesia: "Indonesia",
    singapore: "Singapura",
    malaysia: "Malaysia",
    turkey: "Turki",
  };
  return names[country] ?? country;
}

export function getDestinationDisplayName(destination: string): string {
  if (!destination) return "destinasi ini";
  return destination.charAt(0).toUpperCase() + destination.slice(1);
}
