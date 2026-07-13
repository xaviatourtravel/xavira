import type { ProductContext } from "@/modules/business-brain/types/context";
import type { DocumentContext } from "@/modules/business-brain/types/context";
import type { VerifiedFact } from "@/modules/ai/response-planner/types";
import {
  departureMatchesPeriod,
  extractSchedulePeriodFromMessage,
  normalizeDepartureToIso,
  type SchedulePeriodConstraint,
} from "@/modules/ai/response-planner/resolve-schedule-period";

export function extractVerifiedPriceFacts(product: ProductContext): VerifiedFact[] {
  return product.pricing
    .filter((item) => item.price != null && item.price > 0)
    .map((item) => ({
      field: "price",
      value: `${item.currency} ${item.price.toLocaleString("id-ID")}${item.packageName ? ` (${item.packageName})` : ""}`,
      sourceId: product.id,
      sourceType: "product" as const,
    }));
}

export function extractVerifiedDepartureFacts(
  product: ProductContext,
  options?: {
    periodConstraint?: SchedulePeriodConstraint | null;
    referenceDate?: Date;
  },
): { facts: VerifiedFact[]; malformedCount: number; periodConstraint: SchedulePeriodConstraint | null } {
  const periodConstraint = options?.periodConstraint ?? null;
  let malformedCount = 0;

  const facts = product.departures
    .filter((item) => item.departureDate?.trim() && item.status !== "full")
    .flatMap((item) => {
      const normalized = normalizeDepartureToIso(item.departureDate);
      if (normalized.malformed) {
        malformedCount += 1;
        return [];
      }
      if (!normalized.iso) return [];
      if (!departureMatchesPeriod(normalized.iso, periodConstraint)) return [];

      return [
        {
          field: "departure_date" as const,
          value: item.departureDate,
          sourceId: product.id,
          sourceType: "product" as const,
        },
      ];
    });

  return { facts, malformedCount, periodConstraint };
}

export function findItineraryDocuments(
  documents: DocumentContext[],
  productName: string,
): DocumentContext[] {
  const normalizedProduct = productName.toLowerCase();
  return documents.filter((document) => {
    const haystack = `${document.name} ${document.description} ${document.documentType}`.toLowerCase();
    const isItineraryLike =
      haystack.includes("itinerary") ||
      haystack.includes("itinerari") ||
      haystack.includes("brochure") ||
      haystack.includes("brosur") ||
      document.documentType === "pdf";
    return isItineraryLike && (haystack.includes(normalizedProduct) || normalizedProduct.length === 0);
  });
}

export function resolveGroundedFacts(input: {
  product: ProductContext | null;
  documents: DocumentContext[];
  requestFields: string[];
  latestMessage?: string;
  referenceDate?: Date;
  timezone?: string | null;
}): VerifiedFact[] {
  const facts: VerifiedFact[] = [];
  if (!input.product) return facts;

  if (input.requestFields.includes("price")) {
    facts.push(...extractVerifiedPriceFacts(input.product));
  }

  if (input.requestFields.includes("schedule") || input.requestFields.includes("availability")) {
    const periodConstraint = input.latestMessage
      ? extractSchedulePeriodFromMessage(input.latestMessage, input.referenceDate, input.timezone)
      : null;
    const departureResult = extractVerifiedDepartureFacts(input.product, {
      periodConstraint,
      referenceDate: input.referenceDate,
    });
    facts.push(...departureResult.facts);
  }

  if (input.requestFields.includes("description")) {
    if (input.product.description?.trim()) {
      facts.push({
        field: "description",
        value: input.product.description,
        sourceId: input.product.id,
        sourceType: "product",
      });
    }
  }

  if (input.requestFields.includes("document")) {
    for (const document of findItineraryDocuments(input.documents, input.product.name)) {
      facts.push({
        field: "document",
        value: document.name,
        sourceId: document.id,
        sourceType: "document",
      });
    }
  }

  return facts;
}

export function resolveSchedulePeriodLabel(
  latestMessage: string,
  referenceDate?: Date,
  timezone?: string | null,
): string | null {
  return extractSchedulePeriodFromMessage(latestMessage, referenceDate, timezone)?.label ?? null;
}
