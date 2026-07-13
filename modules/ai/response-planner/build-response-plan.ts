import { resolveCustomerRequestType } from "@/modules/ai/response-planner/resolve-customer-request";
import {
  getActiveProducts,
  resolveSelectedEntity,
} from "@/modules/ai/response-planner/resolve-product-context";
import { findProductTitleMatch } from "@/modules/ai/response-planner/resolve-product-title-match";
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
import { resolveSchedulePeriod } from "@/modules/ai/response-planner/resolve-schedule-period";
import { assessCatalogGeography } from "@/modules/ai/response-planner/validate-catalog-consistency";
import { buildGeographicConfirmationAnswer } from "@/modules/ai/response-planner/resolve-geographic-confirmation";
import { createTurnContext } from "@/modules/ai/response-planner/turn-context";
import { extractParticipantCount } from "@/modules/ai/response-planner/resolve-customer-request";
import type { GeographicDiagnostics, NormalizedPlanningInput, ResponsePlan } from "@/modules/ai/response-planner/types";

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
    case "PRODUCT_SELECTION":
    case "GEOGRAPHIC_CONFIRMATION":
      return ["description", "price", "schedule"];
    default:
      return [];
  }
}

export function buildResponsePlan(input: NormalizedPlanningInput): ResponsePlan {
  const products = getActiveProducts(
    input.publishedBusinessBrain,
    input.retrievedContext,
    input.includeDraft,
  );

  const previousSelectedEntity = input.conversationState?.selectedEntity ?? null;
  const turn =
    input.turn ??
    createTurnContext({
      sessionId: input.workspaceId,
      latestMessage: input.latestMessage,
      previousTurnId: null,
    });

  const titleMatch = findProductTitleMatch(input.latestMessage, products);
  let requestType = resolveCustomerRequestType(input.latestMessage, input.intent);
  if (titleMatch) {
    requestType = titleMatch.matchType === "exact_title" ? "PRODUCT_SELECTION" : "PRODUCT_INFORMATION";
  }
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

  const storedCatalogContext = input.conversationState?.catalogContext ?? null;

  let catalogResults: import("@/modules/ai/response-planner/types").CatalogResult[] = [];
  let exactCatalogResults: import("@/modules/ai/response-planner/types").CatalogResult[] = [];
  let alternativeCatalogResults: import("@/modules/ai/response-planner/types").CatalogResult[] = [];
  let catalogQueryType: ResponsePlan["catalogQueryType"] = null;
  let catalogQueryValue: string | null = null;
  let destinationMatchType: string | null = null;
  let totalCatalogMatches = 0;
  let excludedEntityIds: string[] = [];
  let exclusionReasons: Record<string, string> = {};

  if (requestType === "CATALOG_DISCOVERY" || requestType === "DESTINATION_DISCOVERY") {
    const catalog = buildCatalogResults({
      products,
      message: input.latestMessage,
      requestType,
    });
    catalogResults = catalog.results;
    exactCatalogResults = catalog.exactResults;
    alternativeCatalogResults = catalog.alternativeResults;
    catalogQueryType = catalog.queryType;
    catalogQueryValue = catalog.queryValue;
    destinationMatchType = catalog.destinationMatchType;
    totalCatalogMatches = catalog.results.length;
    excludedEntityIds = catalog.excludedEntityIds;
    exclusionReasons = catalog.exclusionReasons;
  } else if (requestType === "PRICE" && storedCatalogContext) {
    catalogResults = resolveCatalogResultsFromContext({
      products,
      catalogContext: storedCatalogContext,
    });
    exactCatalogResults = catalogResults;
    catalogQueryType = storedCatalogContext.queryType;
    catalogQueryValue = storedCatalogContext.queryValue;
  } else if (requestType === "GENERAL_SERVICE_INQUIRY" && products.length > 0) {
    const catalog = buildCatalogResults({
      products,
      message: input.latestMessage,
      requestType: "CATALOG_DISCOVERY",
    });
    catalogResults = catalog.results;
    exactCatalogResults = catalog.exactResults;
    alternativeCatalogResults = catalog.alternativeResults;
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
  const selectedEntity =
    requestType === "GEOGRAPHIC_CONFIRMATION"
      ? previousSelectedEntity ?? selection.entity
      : selection.entity;

  const product =
    selectedEntity?.entityType === "product"
      ? products.find((item) => item.id === selectedEntity.entityId) ?? null
      : requestType === "GEOGRAPHIC_CONFIRMATION" && previousSelectedEntity
        ? products.find((item) => item.id === previousSelectedEntity.entityId) ?? null
        : null;

  const documents = input.retrievedContext.relevantDocuments.filter(
    (document) => input.includeDraft || (document.status !== "draft" && document.status !== "archived"),
  );

  const schedulePeriod = resolveSchedulePeriod(input.latestMessage, {
    referenceDate: new Date(),
    timezone: input.timezone,
  });

  const verifiedFacts = resolveGroundedFacts({
    product,
    documents,
    requestFields: requestFieldsForType(requestType),
    latestMessage: input.latestMessage,
    timezone: input.timezone,
    referenceDate: new Date(),
  });

  const interpretedPeriod = resolveSchedulePeriodLabel(input.latestMessage, new Date(), input.timezone);

  const matchingDepartureDates = verifiedFacts
    .filter((fact) => fact.field === "departure_date")
    .map((fact) => fact.value);
  const scheduleGrounded = matchingDepartureDates.length > 0;

  const geographyAssessment = assessCatalogGeography({
    catalogQueryType,
    catalogQueryValue,
    catalogResults,
    products,
  });

  if (geographyAssessment.excludedEntityIds.length > 0) {
    const excluded = new Set(geographyAssessment.excludedEntityIds);
    catalogResults = catalogResults.filter((item) => !excluded.has(item.entityId));
    exactCatalogResults = exactCatalogResults.filter((item) => !excluded.has(item.entityId));
    alternativeCatalogResults = alternativeCatalogResults.filter((item) => !excluded.has(item.entityId));
    totalCatalogMatches = catalogResults.length;
  }

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
    exactCatalogResults,
    alternativeCatalogResults,
    catalogQueryType,
    catalogQueryValue,
    totalCatalogMatches,
    greetingAllowed,
    greetingType,
    companyName: companyNameUsed,
    timezone: input.timezone,
    products,
    interpretedPeriod,
    geographicConfirmationAnswer:
      requestType === "GEOGRAPHIC_CONFIRMATION"
        ? buildGeographicConfirmationAnswer({
            message: input.latestMessage,
            referencedProduct: product,
            selectedEntity,
          })
        : null,
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

  const geographicDiagnostics: GeographicDiagnostics = {
    geographicQueryType: catalogQueryType,
    geographicQueryValue: catalogQueryValue,
    exactMatchEntityIds: exactCatalogResults.map((item) => item.entityId),
    alternativeEntityIds: alternativeCatalogResults.map((item) => item.entityId),
    excludedEntityIds: [...excludedEntityIds, ...geographyAssessment.excludedEntityIds],
    exclusionReasons: { ...exclusionReasons, ...geographyAssessment.exclusionReasons },
    countryMatchType: catalogQueryType === "country" ? "exact_country" : null,
    destinationMatchType: destinationMatchType ?? selection.destinationMatchType,
    catalogContradictionDetected: false,
    selectedEntityId: selectedEntity?.entityId ?? null,
    selectedEntityValid: selectedEntity ? products.some((item) => item.id === selectedEntity.entityId) : false,
    requestedPeriodType: schedulePeriod?.periodType ?? null,
    requestedPeriodStart: schedulePeriod?.startDate ?? null,
    requestedPeriodEnd: schedulePeriod?.endDate ?? null,
    requestedPeriodMonth: schedulePeriod?.month ?? null,
    requestedPeriodYear: schedulePeriod?.year ?? null,
    requestedPeriodTimezone: schedulePeriod?.timezone ?? input.timezone ?? null,
    matchingDepartureDates,
    excludedDepartureDates: [],
    scheduleGrounded,
    priceSourceField: catalogResults.find((item) => item.priceSourceField)?.priceSourceField ??
      (verifiedFacts.find((fact) => fact.field === "price") ? "pricing" : null),
  };

  const participantCount = extractParticipantCount(input.latestMessage);
  const newlyCollectedInformationKeys = [
    ...(action.catalogContext ? ["catalogContext"] : []),
    ...(selectedEntity && requestType !== "GEOGRAPHIC_CONFIRMATION" ? ["requestedService"] : []),
    ...(participantCount != null ? ["participant_count"] : []),
  ];

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
    newlyCollectedInformationKeys,
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
    geographicDiagnostics,
    turn: {
      turnId: turn.turnId,
      latestMessageTextHash: turn.latestMessageTextHash,
      previousTurnId: turn.previousTurnId,
      planCreatedAt: turn.planCreatedAt,
      previousSelectedEntity,
      selectionOverrideReason: selection.selectionOverrideReason,
      latestMessageIntent: requestType,
      runtimeVersions: turn.runtimeVersions,
    },
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
    catalogContradictionDetected?: boolean;
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
    geographicDiagnostics: plan.geographicDiagnostics,
  };
}
