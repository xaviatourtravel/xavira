import { formatIdrAmount } from "@/modules/business-brain/lib/parse-currency";
import { createEmptyDepartureItem, createEmptyPricingItem } from "@/modules/business-brain/lib/product-knowledge-score";
import type { ParsedProductImport, ProductImportWarningKey } from "@/modules/business-brain/types/product-import";
import type {
  BrainProductFormValues,
  ProductDepartureItem,
  ProductPricingItem,
} from "@/modules/business-brain/types/products";

function appendSection(lines: string[], label: string, value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return;
  lines.push(`${label}: ${trimmed}`);
}

function buildDescription(parsed: ParsedProductImport): string {
  const parts: string[] = [];

  if (parsed.routeShort?.trim()) {
    parts.push(parsed.routeShort.trim());
  }

  if (parsed.duration?.trim()) {
    parts.push(`Duration: ${parsed.duration.trim()}`);
  }

  if (parsed.year?.trim()) {
    parts.push(`Year: ${parsed.year.trim()}`);
  }

  if (parsed.salesAngle?.trim()) {
    parts.push(parsed.salesAngle.trim());
  }

  return parts.join("\n\n");
}

function buildAiNotes(parsed: ParsedProductImport): string {
  const lines: string[] = [];

  appendSection(lines, "Best for", parsed.bestFor);
  appendSection(lines, "Not best for", parsed.notBestFor);
  appendSection(lines, "Airline", parsed.airline);
  appendSection(lines, "Flight route", parsed.flightRoute);
  appendSection(lines, "DP rule", parsed.dpRule);
  appendSection(lines, "Min participants", parsed.minParticipants);
  appendSection(lines, "Muslim-friendly notes", parsed.muslimFriendlyNotes);
  appendSection(lines, "CTA", parsed.cta);
  appendSection(lines, "Internal notes", parsed.internalNotes);

  if (parsed.productId?.trim()) {
    appendSection(lines, "Product ID", parsed.productId);
  }

  if (parsed.additionalFields.length > 0) {
    lines.push("Additional Fields:");
    for (const field of parsed.additionalFields) {
      lines.push(`- ${field.key}: ${field.value}`);
    }
  }

  return lines.join("\n");
}

function buildPricingItems(parsed: ParsedProductImport): ProductPricingItem[] {
  const items: ProductPricingItem[] = [];

  if (parsed.pricing.adult != null) {
    items.push({
      ...createEmptyPricingItem(),
      packageName: "Adult",
      price: parsed.pricing.adult,
      currency: "IDR",
      ...(parsed.pricing.earlyBird != null
        ? { earlyBird: formatIdrAmount(parsed.pricing.earlyBird) }
        : null),
      ...(parsed.pricing.promo != null ? { promo: formatIdrAmount(parsed.pricing.promo) } : null),
    });
  }

  if (parsed.pricing.childTwin != null) {
    items.push({
      ...createEmptyPricingItem(),
      packageName: "Child (Twin)",
      price: parsed.pricing.childTwin,
      currency: "IDR",
    });
  }

  if (parsed.pricing.childNoBed != null) {
    items.push({
      ...createEmptyPricingItem(),
      packageName: "Child (No Bed)",
      price: parsed.pricing.childNoBed,
      currency: "IDR",
    });
  }

  return items;
}

function parseMinParticipants(value: string | null | undefined): number {
  if (!value?.trim()) return 0;
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return 0;
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildImportedDepartureItems(parsed: ParsedProductImport): ProductDepartureItem[] {
  const dates =
    parsed.departureDates.length > 0
      ? parsed.departureDates
      : parsed.departureDate
        ? [parsed.departureDate]
        : [];

  return dates.map((departureDate) => ({
    ...createEmptyDepartureItem(),
    departureDate,
    availableSeats: parseMinParticipants(parsed.minParticipants),
    status: "open" as const,
  }));
}

function mergeImportedDepartures(
  current: ProductDepartureItem[],
  imported: ProductDepartureItem[] | undefined,
): ProductDepartureItem[] {
  if (!imported?.length) return current;

  let result = [...current];

  for (const importedItem of imported) {
    if (!importedItem.departureDate) continue;

    if (result.some((item) => item.departureDate === importedItem.departureDate)) {
      continue;
    }

    const emptyIndex = result.findIndex((item) => !item.departureDate.trim());
    if (emptyIndex >= 0) {
      result = result.map((item, index) =>
        index === emptyIndex
          ? {
              ...item,
              departureDate: importedItem.departureDate,
              availableSeats: importedItem.availableSeats,
              status: importedItem.status,
            }
          : item,
      );
      continue;
    }

    result = [...result, importedItem];
  }

  return result;
}

export function buildProductImportWarnings(
  parsed: ParsedProductImport,
): ProductImportWarningKey[] {
  const warnings: ProductImportWarningKey[] = [];

  if (!parsed.name?.trim()) {
    warnings.push("missingProductName");
  }

  if (!parsed.country?.trim()) {
    warnings.push("missingDestination");
  }

  const hasPricing =
    parsed.pricing.adult != null ||
    parsed.pricing.childTwin != null ||
    parsed.pricing.childNoBed != null;

  if (!hasPricing) {
    warnings.push("missingStartingPrice");
  }

  if (parsed.departureDates.length === 0 && !parsed.departureDate) {
    warnings.push("missingDepartureDate");
  }

  return warnings;
}

export function mapProductImportToFormValues(
  parsed: ParsedProductImport,
): Partial<BrainProductFormValues> {
  const description = buildDescription(parsed);
  const aiNotes = buildAiNotes(parsed);
  const pricing = buildPricingItems(parsed);
  const importedDepartures = buildImportedDepartureItems(parsed);

  const patch: Partial<BrainProductFormValues> = {};

  if (parsed.name?.trim()) patch.name = parsed.name.trim();
  if (parsed.country?.trim()) patch.destination = parsed.country.trim();
  if (description) patch.description = description;
  if (parsed.highlights.length > 0) patch.highlights = parsed.highlights;
  if (parsed.included.length > 0) patch.included = parsed.included;
  if (parsed.excluded.length > 0) patch.excluded = parsed.excluded;
  if (pricing.length > 0) patch.pricing = pricing;
  if (importedDepartures.length > 0) patch.departures = importedDepartures;
  if (aiNotes.trim()) patch.aiNotes = aiNotes;

  return patch;
}

export function mergeProductImportPatch(
  current: BrainProductFormValues,
  patch: Partial<BrainProductFormValues>,
): BrainProductFormValues {
  return {
    ...current,
    name: patch.name ?? current.name,
    destination: patch.destination ?? current.destination,
    description: patch.description ?? current.description,
    aiNotes: patch.aiNotes ?? current.aiNotes,
    highlights: patch.highlights?.length ? patch.highlights : current.highlights,
    included: patch.included?.length ? patch.included : current.included,
    excluded: patch.excluded?.length ? patch.excluded : current.excluded,
    pricing: patch.pricing?.length ? patch.pricing : current.pricing,
    departures: mergeImportedDepartures(current.departures, patch.departures),
  };
}
