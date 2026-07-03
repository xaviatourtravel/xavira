import type {
  BrainProductFormValues,
  BrainProductListItem,
  BrainProductStatus,
  DepartureStatus,
  ProductCurrency,
  ProductDepartureItem,
  ProductPricingItem,
} from "@/modules/business-brain/types/products";

type ScoreInput = BrainProductFormValues & {
  documentCount: number;
  faqCount: number;
};

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function calculateProductKnowledgeScore(input: ScoreInput): number {
  let score = 0;

  if (input.name.trim()) score += 10;
  if (input.category.trim()) score += 5;
  if (input.destination.trim()) score += 5;

  const descriptionText = stripHtml(input.description);
  if (descriptionText.length > 80) score += 15;
  else if (descriptionText.length > 0) score += 8;

  if (input.highlights.length > 0) score += 10;
  if (input.pricing.length > 0) score += 15;
  if (input.departures.length > 0) score += 10;
  if (input.included.length > 0) score += 5;
  if (input.excluded.length > 0) score += 5;
  if (input.faqCount > 0) score += 10;
  if (input.documentCount > 0) score += 10;
  if (input.aiNotes.trim()) score += 5;

  return Math.min(100, score);
}

export function knowledgeScoreLabel(score: number) {
  if (score >= 80) return "Strong";
  if (score >= 50) return "Good";
  if (score >= 25) return "Basic";
  return "Low";
}

export function createEmptyPricingItem(): ProductPricingItem {
  return {
    id: crypto.randomUUID(),
    packageName: "",
    price: 0,
    currency: "IDR",
    validUntil: "",
  };
}

export function createEmptyDepartureItem(): ProductDepartureItem {
  return {
    id: crypto.randomUUID(),
    departureDate: "",
    availableSeats: 0,
    status: "open",
  };
}

export function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function parsePricingItems(value: unknown): ProductPricingItem[] {
  if (!Array.isArray(value)) return [];

  const items: ProductPricingItem[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const currency = record.currency;
    items.push({
      id: typeof record.id === "string" ? record.id : crypto.randomUUID(),
      packageName: typeof record.packageName === "string" ? record.packageName : "",
      price: typeof record.price === "number" ? record.price : Number(record.price) || 0,
      currency:
        currency === "USD" || currency === "SGD" || currency === "MYR"
          ? currency
          : "IDR",
      validUntil: typeof record.validUntil === "string" ? record.validUntil : "",
      earlyBird: typeof record.earlyBird === "string" ? record.earlyBird : undefined,
      promo: typeof record.promo === "string" ? record.promo : undefined,
    });
  }
  return items;
}

export function parseDepartureItems(value: unknown): ProductDepartureItem[] {
  if (!Array.isArray(value)) return [];

  const items: ProductDepartureItem[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const status = record.status;
    items.push({
      id: typeof record.id === "string" ? record.id : crypto.randomUUID(),
      departureDate:
        typeof record.departureDate === "string" ? record.departureDate : "",
      availableSeats:
        typeof record.availableSeats === "number"
          ? record.availableSeats
          : Number(record.availableSeats) || 0,
      status:
        status === "full" || status === "waiting_list" ? status : "open",
    });
  }
  return items;
}

export function coerceProductStatus(value: string): BrainProductStatus {
  if (value === "published" || value === "archived") return value;
  return "draft";
}

export function toListItem(
  row: {
    id: string;
    name: string;
    category: string;
    destination: string;
    status: string;
    updated_at: string;
    description: string;
    highlights: unknown;
    pricing: unknown;
    departures: unknown;
    included: unknown;
    excluded: unknown;
    ai_notes: string;
  },
  counts: { documentCount: number; faqCount: number },
): BrainProductListItem {
  const formValues: BrainProductFormValues = {
    name: row.name,
    category: row.category as BrainProductFormValues["category"],
    destination: row.destination,
    status: coerceProductStatus(row.status),
    description: row.description,
    highlights: parseStringArray(row.highlights),
    pricing: parsePricingItems(row.pricing),
    departures: parseDepartureItems(row.departures),
    included: parseStringArray(row.included),
    excluded: parseStringArray(row.excluded),
    aiNotes: row.ai_notes,
  };

  return {
    id: row.id,
    name: row.name || "Untitled Product",
    category: row.category,
    destination: row.destination,
    status: coerceProductStatus(row.status),
    updatedAt: row.updated_at,
    documentCount: counts.documentCount,
    faqCount: counts.faqCount,
    knowledgeScore: calculateProductKnowledgeScore({
      ...formValues,
      documentCount: counts.documentCount,
      faqCount: counts.faqCount,
    }),
  };
}
