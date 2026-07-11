import type { BusinessBrainContext, ProductContext } from "@/modules/business-brain/types/context";
import type { RetrievedBusinessBrainContext } from "@/modules/ai/types/context-retrieval";
import type { CollectedInformationMap } from "@/modules/ai/conversation-state/types";
import type { RequestType, SelectedEntity, SelectedEntitySource } from "@/modules/ai/response-planner/types";
import type { WhatsAppConversationTurn } from "@/modules/business-brain/types/prompt";
import {
  extractCountryQuery,
  extractDestinationQuery,
  isWeakSingleRetrievalMatch,
  matchProductsByCountry,
  matchProductsByDestination,
  shouldAutoSelectEntity,
} from "@/modules/ai/response-planner/resolve-destination-match";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);
}

function scoreProductMatch(product: ProductContext, tokens: string[]): number {
  const haystack = [
    product.name,
    product.destination,
    product.category,
    product.description,
    ...product.highlights,
  ]
    .join(" ")
    .toLowerCase();

  return tokens.reduce((score, token) => (haystack.includes(token) ? score + 2 : score), 0);
}

function findExplicitProductInMessage(
  message: string,
  products: ProductContext[],
): { product: ProductContext; source: SelectedEntitySource; confidence: number } | null {
  const normalized = message.toLowerCase();
  const explicitNameMatch = products.find((product) =>
    normalized.includes(product.name.toLowerCase()),
  );
  if (explicitNameMatch) {
    return {
      product: explicitNameMatch,
      source: "explicit_latest_message",
      confidence: 9,
    };
  }

  const destinationQuery = extractDestinationQuery(message);
  const countryQuery = extractCountryQuery(message);

  if (destinationQuery) {
    const destinationMatches = matchProductsByDestination(products, destinationQuery);
    const best = destinationMatches[0];
    if (best && shouldAutoSelectEntity(best) && destinationMatches.length === 1) {
      return {
        product: best.product,
        source: "destination_match",
        confidence: best.confidence,
      };
    }
  }

  if (countryQuery) {
    const countryMatches = matchProductsByCountry(products, countryQuery);
    if (countryMatches.length === 1 && shouldAutoSelectEntity(countryMatches[0])) {
      return {
        product: countryMatches[0].product,
        source: "destination_match",
        confidence: countryMatches[0].confidence,
      };
    }
  }

  const matches = products
    .map((product) => ({
      product,
      score:
        scoreProductMatch(product, tokenize(message)) +
        (normalized.includes(product.name.toLowerCase()) ? 8 : 0) +
        (product.destination && normalized.includes(product.destination.toLowerCase()) ? 6 : 0),
    }))
    .filter((item) => item.score >= 8)
    .sort((a, b) => b.score - a.score);

  if (matches.length === 0) return null;
  if (matches.length === 1 || matches[0].score > matches[1].score + 2) {
    return {
      product: matches[0].product,
      source: "explicit_latest_message",
      confidence: matches[0].score,
    };
  }
  return null;
}

function findProductInHistory(
  history: WhatsAppConversationTurn[],
  products: ProductContext[],
): ProductContext | null {
  const customerTexts = history
    .filter((turn) => turn.sender === "customer")
    .map((turn) => turn.text)
    .join(" ");

  const match = findExplicitProductInMessage(customerTexts, products);
  return match?.product ?? null;
}

export function getActiveProducts(
  businessBrain: BusinessBrainContext,
  retrieved: RetrievedBusinessBrainContext,
  includeDraft: boolean,
): ProductContext[] {
  const fromBrain = businessBrain.products.filter(
    (product) => includeDraft || (product.status !== "draft" && product.status !== "archived"),
  );
  const retrievedIds = new Set(retrieved.relevantProducts.map((item) => item.id));
  const merged = new Map<string, ProductContext>();

  for (const product of fromBrain) {
    merged.set(product.id, product);
  }
  for (const product of retrieved.relevantProducts) {
    if (!includeDraft && (product.status === "draft" || product.status === "archived")) continue;
    merged.set(product.id, product);
  }

  if (retrievedIds.size === 1) {
    const only = retrieved.relevantProducts[0];
    if (only) merged.set(only.id, only);
  }

  return [...merged.values()].filter(
    (product) => includeDraft || (product.status !== "draft" && product.status !== "archived"),
  );
}

export function resolveSelectedEntity(input: {
  latestMessage: string;
  recentHistory: WhatsAppConversationTurn[];
  storedSelectedEntity: SelectedEntity | null;
  collectedInformation: CollectedInformationMap;
  businessBrain: BusinessBrainContext;
  retrieved: RetrievedBusinessBrainContext;
  includeDraft: boolean;
  requestType?: RequestType;
  now?: Date;
}): { entity: SelectedEntity | null; confidence: number | null; destinationMatchType: string | null } {
  const products = getActiveProducts(input.businessBrain, input.retrieved, input.includeDraft);
  const nowIso = (input.now ?? new Date()).toISOString();
  const catalogLikeRequest =
    input.requestType === "CATALOG_DISCOVERY" ||
    input.requestType === "DESTINATION_DISCOVERY" ||
    input.requestType === "GREETING";

  const explicit = findExplicitProductInMessage(input.latestMessage, products);
  if (explicit && !(catalogLikeRequest && explicit.source === "destination_match" && explicit.confidence < 9)) {
    const destinationMatch = extractDestinationQuery(input.latestMessage)
      ? matchProductsByDestination(products, extractDestinationQuery(input.latestMessage)!)[0]
      : null;
    return {
      entity: {
        entityId: explicit.product.id,
        entityType: "product",
        displayName: explicit.product.name,
        selectionSource: explicit.source,
        selectedAt: nowIso,
      },
      confidence: explicit.confidence,
      destinationMatchType: destinationMatch?.matchType ?? null,
    };
  }

  if (input.storedSelectedEntity) {
    const stillValid = products.some((product) => product.id === input.storedSelectedEntity!.entityId);
    if (stillValid) {
      return {
        entity: input.storedSelectedEntity,
        confidence: null,
        destinationMatchType: null,
      };
    }
  }

  const serviceName = input.collectedInformation.requestedService?.value?.trim();
  if (serviceName) {
    const matched = products.find(
      (product) =>
        product.name.toLowerCase().includes(serviceName.toLowerCase()) ||
        product.destination.toLowerCase().includes(serviceName.toLowerCase()),
    );
    if (matched) {
      return {
        entity: {
          entityId: matched.id,
          entityType: "product",
          displayName: matched.name,
          selectionSource: "collected_information",
          selectedAt: nowIso,
        },
        confidence: 7,
        destinationMatchType: "exact_product_name",
      };
    }
  }

  const fromHistory = findProductInHistory(input.recentHistory, products);
  if (fromHistory) {
    return {
      entity: {
        entityId: fromHistory.id,
        entityType: "product",
        displayName: fromHistory.name,
        selectionSource: "recent_history",
        selectedAt: nowIso,
      },
      confidence: 6,
      destinationMatchType: null,
    };
  }

  if (!catalogLikeRequest && input.retrieved.relevantProducts.length === 1) {
    const only = input.retrieved.relevantProducts[0];
    if (
      only &&
      (input.includeDraft || (only.status !== "draft" && only.status !== "archived")) &&
      !isWeakSingleRetrievalMatch(only, input.latestMessage)
    ) {
      const destinationMatch = extractDestinationQuery(input.latestMessage)
        ? matchProductsByDestination(products, extractDestinationQuery(input.latestMessage)!)[0]
        : null;
      if (destinationMatch && shouldAutoSelectEntity(destinationMatch)) {
        return {
          entity: {
            entityId: only.id,
            entityType: "product",
            displayName: only.name,
            selectionSource: "single_retrieval_match",
            selectedAt: nowIso,
          },
          confidence: destinationMatch.confidence,
          destinationMatchType: destinationMatch.matchType,
        };
      }
    }
  }

  return { entity: null, confidence: null, destinationMatchType: null };
}
