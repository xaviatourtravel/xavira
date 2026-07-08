import { parseCurrency } from "@/modules/business-brain/lib/parse-currency";
import { parseDepartureDates } from "@/modules/business-brain/lib/parse-departure-date";
import { splitProductAndFaqImportText } from "@/modules/business-brain/lib/parse-faq-import-text";
import {
  resolveCanonicalFieldKey,
  splitProductImportKeyLine,
} from "@/modules/business-brain/lib/product-import-field-aliases";
import type { ParsedProductImport } from "@/modules/business-brain/types/product-import";

function parseListValue(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(/[;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/** @deprecated Use parseCurrency from parse-currency.ts */
export function parseProductImportPrice(value: string | null | undefined): number | null {
  return parseCurrency(value);
}

function extractFieldBlocks(input: string) {
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const blocks: Array<{ key: string; rawKey: string; value: string }> = [];

  let currentKey: string | null = null;
  let currentRawKey: string | null = null;
  let currentValue: string[] = [];

  const flush = () => {
    if (!currentKey || !currentRawKey) return;
    blocks.push({
      key: currentKey,
      rawKey: currentRawKey,
      value: currentValue.join("\n").trim(),
    });
    currentKey = null;
    currentRawKey = null;
    currentValue = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const parsedLine = splitProductImportKeyLine(trimmed);
    if (parsedLine) {
      flush();
      const canonicalKey = resolveCanonicalFieldKey(parsedLine.rawKey);
      currentRawKey = parsedLine.rawKey;
      currentKey = canonicalKey ?? parsedLine.rawKey;
      if (parsedLine.inlineValue) {
        currentValue = [parsedLine.inlineValue];
      }
      continue;
    }

    if (currentKey) {
      currentValue.push(trimmed);
    }
  }

  flush();
  return blocks;
}

export function parseProductImportText(input: string): ParsedProductImport {
  const { productText } = splitProductAndFaqImportText(input);
  return parseProductImportTextFromProductSection(productText);
}

export function parseProductImportTextFromProductSection(input: string): ParsedProductImport {
  const result: ParsedProductImport = {
    productId: null,
    name: null,
    country: null,
    duration: null,
    departureDate: null,
    departureDates: [],
    year: null,
    pricing: {
      adult: null,
      childTwin: null,
      childNoBed: null,
      earlyBird: null,
      promo: null,
    },
    airline: null,
    flightRoute: null,
    routeShort: null,
    highlights: [],
    bestFor: null,
    notBestFor: null,
    included: [],
    excluded: [],
    dpRule: null,
    minParticipants: null,
    muslimFriendlyNotes: null,
    salesAngle: null,
    cta: null,
    internalNotes: null,
    additionalFields: [],
  };

  for (const block of extractFieldBlocks(input)) {
    const { key, rawKey, value } = block;
    const canonicalKey = resolveCanonicalFieldKey(rawKey);

    if (!canonicalKey) {
      result.additionalFields.push({ key: rawKey, value });
      continue;
    }

    switch (canonicalKey) {
      case "PRODUCT_ID":
        result.productId = value || null;
        break;
      case "PRODUCT_NAME":
        result.name = value || null;
        break;
      case "COUNTRY":
        result.country = value || null;
        break;
      case "DURATION":
        result.duration = value || null;
        break;
      case "DEPARTURE_DATE": {
        const departureDates = parseDepartureDates(value);
        result.departureDates = departureDates;
        result.departureDate = departureDates[0] ?? null;
        if (departureDates.length === 0 && value.trim()) {
          result.additionalFields.push({ key: rawKey, value });
        }
        break;
      }
      case "YEAR":
        result.year = value || null;
        break;
      case "STARTING_PRICE_ADULT":
        result.pricing.adult = parseCurrency(value);
        break;
      case "CHILD_TWIN_PRICE":
        result.pricing.childTwin = parseCurrency(value);
        break;
      case "CHILD_NO_BED_PRICE":
        result.pricing.childNoBed = parseCurrency(value);
        break;
      case "EARLY_BIRD":
        result.pricing.earlyBird = parseCurrency(value);
        break;
      case "PROMO":
        result.pricing.promo = parseCurrency(value);
        break;
      case "AIRLINE":
        result.airline = value || null;
        break;
      case "FLIGHT_ROUTE":
        result.flightRoute = value || null;
        break;
      case "ROUTE_SHORT":
        result.routeShort = value || null;
        break;
      case "MAIN_HIGHLIGHTS":
        result.highlights = parseListValue(value);
        break;
      case "BEST_FOR":
        result.bestFor = value || null;
        break;
      case "NOT_BEST_FOR":
        result.notBestFor = value || null;
        break;
      case "INCLUDED":
        result.included = parseListValue(value);
        break;
      case "EXCLUDED":
        result.excluded = parseListValue(value);
        break;
      case "DP_RULE":
        result.dpRule = value || null;
        break;
      case "MIN_PARTICIPANTS":
        result.minParticipants = value || null;
        break;
      case "MUSLIM_FRIENDLY_NOTES":
        result.muslimFriendlyNotes = value || null;
        break;
      case "SALES_ANGLE":
        result.salesAngle = value || null;
        break;
      case "CTA":
        result.cta = value || null;
        break;
      case "INTERNAL_NOTES":
        result.internalNotes = value || null;
        break;
      default:
        result.additionalFields.push({ key, value });
        break;
    }
  }

  return result;
}
