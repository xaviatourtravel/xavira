import { resolveCustomerRequestType } from "@/modules/ai/response-planner/resolve-customer-request";
import {
  getActiveProducts,
  resolveSelectedEntity,
} from "@/modules/ai/response-planner/resolve-product-context";
import { resolveGroundedFacts, resolveSchedulePeriodLabel } from "@/modules/ai/response-planner/resolve-grounded-facts";
import {
  resolveAnswerability,
  resolveNextAction,
} from "@/modules/ai/response-planner/resolve-next-action";
import { resolveAnsweredQuestionKeys } from "@/modules/ai/conversation-state/collected-information";
import {
  buildCatalogResults,
  resolveCatalogResultsFromContext,
} from "@/modules/ai/response-planner/resolve-catalog";
import { resolveVerifiedCompanyName } from "@/modules/ai/response-planner/resolve-greeting";
import { detectGreetingType } from "@/modules/ai/conversation-state/greeting-decision";
import type { NormalizedPlanningInput, ResponsePlan } from "@/modules/ai/response-planner/types";

function requestFieldsForType(requestType: string): string[] {
  switch (requestType) {
    case "PRICE":
      return ["price"];
    case "ITINERARY_OR_DOCUMENT":
      return ["document"];
    case "SCHEDULE_OR_DEPARTURE":
    case "AVAILABILITY":
      return ["schedule", "availability"];
    case "PRODUCT_INFORMATION":
      return ["description"];
    default:
      return [];
  }
}

export function buildResponsePlan(input: NormalizedPlanningInput): ResponsePlan {
  const requestType = resolveCustomerRequestType(input.latestMessage, input.intent);
  const collectedInformation = input.conversationState?.collectedInformation ?? {};
  const answeredQuestionKeys = resolveAnsweredQuestionKeys({
    collectedInformation,
    qualification: input.customerContext.qualification,
  });

  const greetingAllowed = input.conversationStateContext?.greetingAllowed ?? false;
  const greetingType = detectGreetingType(input.latestMessage);
  const companyNameUsed = resolveVerifiedCompanyName(
    input.publishedBusinessBrain.companyDNA?.companyName,
  );

  const products = getActiveProducts(
    input.publishedBusinessBrain,
    input.retrievedContext,
    input.includeDraft,
  );

  const storedCatalogContext = input.conversationState?.catalogContext ?? null;

  let catalogResults: import("@/modules/ai/response-planner/types").CatalogResult[] = [];
  let catalogQueryType: ResponsePlan["catalogQueryType"] = null;
  let catalogQueryValue: string | null = null;
  let destinationMatchType: string | null = null;
  let totalCatalogMatches = 0;

  if (requestType === "CATALOG_DISCOVERY" || requestType === "DESTINATION_DISCOVERY") {
    const catalog = buildCatalogResults({
      products,
      message: input.latestMessage,
      requestType,
    });
    catalogResults = catalog.results;
    catalogQueryType = catalog.queryType;
    catalogQueryValue = catalog.queryValue;
    destinationMatchType = catalog.destinationMatchType;
    totalCatalogMatches = catalog.results.length;
  } else if (requestType === "PRICE" && storedCatalogContext) {
    catalogResults = resolveCatalogResultsFromContext({
      products,
      catalogContext: storedCatalogContext,
    });
    catalogQueryType = storedCatalogContext.queryType;
    catalogQueryValue = storedCatalogContext.queryValue;
  } else if (requestType === "GENERAL_SERVICE_INQUIRY" && products.length > 0) {
    const catalog = buildCatalogResults({
      products,
      message: input.latestMessage,
      requestType: "CATALOG_DISCOVERY",
    });
    catalogResults = catalog.results;
    catalogQueryType = catalog.queryType;
    catalogQueryValue = catalog.queryValue;
  }

  const selection = resolveSelectedEntity({
    latestMessage: input.latestMessage,
    recentHistory: input.recentHistory,
    storedSelectedEntity: input.conversationState?.selectedEntity ?? null,
    collectedInformation,
    businessBrain: input.publishedBusinessBrain,
    retrieved: input.retrievedContext,
    includeDraft: input.includeDraft,
    requestType,
  });
  const selectedEntity = selection.entity;

  const product =
    selectedEntity?.entityType === "product"
      ? products.find((item) => item.id === selectedEntity.entityId) ?? null
      : null;

  const documents = input.retrievedContext.relevantDocuments.filter(
    (document) => input.includeDraft || (document.status !== "draft" && document.status !== "archived"),
  );

  const verifiedFacts = resolveGroundedFacts({
    product,
    documents,
    requestFields: requestFieldsForType(requestType),
    latestMessage: input.latestMessage,
  });

  const interpretedPeriod = resolveSchedulePeriodLabel(input.latestMessage);

  const answerability = resolveAnswerability({
    requestType,
    selectedEntity,
    verifiedFacts,
    product,
    catalogResults,
    catalogContext: storedCatalogContext,
  });

  const action = resolveNextAction({
    requestType,
    answerability,
    selectedEntity,
    verifiedFacts,
    product,
    documents,
    answeredQuestionKeys,
    catalogResults,
    catalogQueryType,
    catalogQueryValue,
    totalCatalogMatches,
    greetingAllowed,
    greetingType,
    companyName: companyNameUsed,
    timezone: input.timezone,
    products,
  });

  const priceFieldsFound = catalogResults.filter((item) => item.priceLabel).length +
    verifiedFacts.filter((fact) => fact.field === "price").length;

  const sourceIds = [
    ...new Set([
      ...verifiedFacts.map((fact) => fact.sourceId),
      ...catalogResults.flatMap((item) => item.sourceIds),
      ...(selectedEntity ? [selectedEntity.entityId] : []),
    ]),
  ];

  const catalogContext =
    action.catalogContext ??
    (requestType === "PRICE" && storedCatalogContext ? storedCatalogContext : null);

  return {
    requestType,
    answerability,
    selectedEntity:
      requestType === "CATALOG_DISCOVERY" || requestType === "DESTINATION_DISCOVERY"
        ? null
        : selectedEntity,
    catalogResults,
    catalogContext,
    verifiedFacts,
    unsupportedFields: action.handoffRequired
      ? requestFieldsForType(requestType).filter(
          (field) => !verifiedFacts.some((fact) => fact.field === field || (field === "schedule" && fact.field === "departure_date")),
        )
      : [],
    missingCustomerInformation: action.followUpQuestionKey ? [action.followUpQuestionKey] : [],
    responseAction: action.responseAction,
    attachmentAction: action.attachmentAction,
    followUpQuestion: action.followUpQuestion,
    followUpQuestionKey: action.followUpQuestionKey,
    answeredQuestionKeys,
    newlyCollectedInformationKeys:
      action.catalogContext
        ? ["catalogContext"]
        : selectedEntity
          ? ["requestedService"]
          : [],
    handoffRequired: action.handoffRequired,
    handoffReason: action.handoffReason,
    directAnswerRequired: action.directAnswerRequired,
    directAnswerTemplate: action.directAnswerTemplate,
    sourceIds,
    groundedSourceCount: verifiedFacts.length + catalogResults.length,
    interpretedPeriod,
    greetingAllowed,
    greetingType,
    companyNameUsed,
    catalogQueryType,
    catalogQueryValue,
    selectionConfidence: selection.confidence,
    destinationMatchType: selection.destinationMatchType ?? destinationMatchType,
    priceFieldsFound,
  };
}

export function buildPlanObservabilityMetadata(
  plan: ResponsePlan,
  validation?: {
    answerFirstPassed: boolean;
    unsupportedClaimDetected: boolean;
    unsupportedClaimType: string | null;
    deterministicFallbackUsed: boolean;
    hospitalityPassed?: boolean;
    interrogationDetected?: boolean;
    wrongEntityDetected?: boolean;
  },
) {
  return {
    requestType: plan.requestType,
    selectedEntityId: plan.selectedEntity?.entityId ?? null,
    selectedEntityType: plan.selectedEntity?.entityType ?? null,
    selectedEntitySource: plan.selectedEntity?.selectionSource ?? null,
    answerability: plan.answerability,
    responseAction: plan.responseAction,
    verifiedFactFields: plan.verifiedFacts.map((fact) => fact.field),
    missingFactFields: plan.unsupportedFields,
    attachmentIds: plan.attachmentAction ? [plan.attachmentAction.documentId] : [],
    groundedSourceIds: plan.sourceIds,
    answerFirstPassed: validation?.answerFirstPassed ?? false,
    unsupportedClaimDetected: validation?.unsupportedClaimDetected ?? false,
    unsupportedClaimType: validation?.unsupportedClaimType ?? null,
    deterministicFallbackUsed: validation?.deterministicFallbackUsed ?? false,
    handoffReason: plan.handoffReason,
    followUpQuestionIncluded: Boolean(plan.followUpQuestion),
    followUpQuestionKey: plan.followUpQuestionKey,
    greetingAllowed: plan.greetingAllowed,
    greetingType: plan.greetingType,
    companyNameUsed: plan.companyNameUsed,
    catalogQueryType: plan.catalogQueryType,
    catalogQueryValue: plan.catalogQueryValue,
    catalogResultCount: plan.catalogResults.length,
    catalogEntityIds: plan.catalogResults.map((item) => item.entityId),
    selectionConfidence: plan.selectionConfidence,
    destinationMatchType: plan.destinationMatchType,
    hospitalityPassed: validation?.hospitalityPassed ?? true,
    interrogationDetected: validation?.interrogationDetected ?? false,
    wrongEntityDetected: validation?.wrongEntityDetected ?? false,
  };
}
