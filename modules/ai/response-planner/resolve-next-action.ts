import type {
  RequestType,
  Answerability,
  ResponseAction,
  CatalogResult,
  CatalogContext,
} from "@/modules/ai/response-planner/types";
import type { SelectedEntity } from "@/modules/ai/response-planner/types";
import type { VerifiedFact } from "@/modules/ai/response-planner/types";
import type { AttachmentAction } from "@/modules/ai/response-planner/types";
import type { QuestionSemanticKey } from "@/modules/ai/conversation-state/types";
import { findItineraryDocuments } from "@/modules/ai/response-planner/resolve-grounded-facts";
import {
  buildCatalogDirectAnswer,
  buildMultiProductPriceTemplate,
  buildNoExactDestinationTemplate,
} from "@/modules/ai/response-planner/hospitality-templates";
import {
  findAlternativeCountryResults,
  formatCatalogList,
  MAX_CATALOG_RESULTS,
} from "@/modules/ai/response-planner/resolve-catalog";
import { buildGreetingTemplate } from "@/modules/ai/response-planner/resolve-greeting";
import type { ProductContext } from "@/modules/business-brain/types/context";
import type { DocumentContext } from "@/modules/business-brain/types/context";
import type { GreetingType } from "@/modules/ai/conversation-state/types";

export function resolveAnswerability(input: {
  requestType: RequestType;
  selectedEntity: SelectedEntity | null;
  verifiedFacts: VerifiedFact[];
  product: ProductContext | null;
  catalogResults?: CatalogResult[];
  catalogContext?: CatalogContext | null;
}): Answerability {
  if (input.requestType === "HUMAN_REQUEST" || input.requestType === "COMPLAINT") {
    return "REQUIRES_HUMAN_CONFIRMATION";
  }

  if (input.requestType === "GREETING") {
    return "ANSWERABLE";
  }

  if (input.requestType === "CATALOG_DISCOVERY" || input.requestType === "DESTINATION_DISCOVERY") {
    if ((input.catalogResults?.length ?? 0) > 0) return "ANSWERABLE";
    return "PARTIALLY_ANSWERABLE";
  }

  if (input.requestType === "GENERAL_SERVICE_INQUIRY") {
    if ((input.catalogResults?.length ?? 0) > 0) return "ANSWERABLE";
    return "NEEDS_DISAMBIGUATION";
  }

  if (!input.selectedEntity && ["PRICE", "SCHEDULE_OR_DEPARTURE", "AVAILABILITY", "ITINERARY_OR_DOCUMENT"].includes(input.requestType)) {
    if (input.requestType === "PRICE" && (input.catalogContext?.entityIds.length || input.catalogResults?.length)) {
      const priced = (input.catalogResults ?? []).filter((item) => item.priceLabel);
      if (priced.length > 0) return "ANSWERABLE";
    }
    return "NEEDS_DISAMBIGUATION";
  }

  if (input.requestType === "PRICE") {
    const hasPrice = input.verifiedFacts.some((fact) => fact.field === "price");
    if (hasPrice) return "ANSWERABLE";
    if ((input.catalogResults ?? []).some((item) => item.priceLabel)) return "ANSWERABLE";
    if (input.selectedEntity) return "REQUIRES_HUMAN_CONFIRMATION";
    return "NEEDS_DISAMBIGUATION";
  }

  if (input.requestType === "ITINERARY_OR_DOCUMENT") {
    const hasDoc = input.verifiedFacts.some((fact) => fact.field === "document");
    if (hasDoc) return "ANSWERABLE";
    if (input.selectedEntity) return "REQUIRES_HUMAN_CONFIRMATION";
    return "NEEDS_DISAMBIGUATION";
  }

  if (input.requestType === "SCHEDULE_OR_DEPARTURE" || input.requestType === "AVAILABILITY") {
    const hasSchedule = input.verifiedFacts.some((fact) => fact.field === "departure_date");
    if (hasSchedule) return "ANSWERABLE";
    if (input.selectedEntity) return "REQUIRES_HUMAN_CONFIRMATION";
    return "NEEDS_DISAMBIGUATION";
  }

  if (input.requestType === "PRODUCT_INFORMATION" && input.product) {
    return input.product.description?.trim() ? "ANSWERABLE" : "PARTIALLY_ANSWERABLE";
  }

  return "NOT_ANSWERABLE";
}

function resolveCatalogAction(requestType: RequestType, queryType: string | null): ResponseAction {
  if (requestType === "CATALOG_DISCOVERY") return "LIST_CATALOG_THEN_ASK";
  if (queryType === "country") return "LIST_DESTINATION_OPTIONS_THEN_ASK";
  return "LIST_MATCHING_PRODUCTS_THEN_ASK";
}

export function resolveNextAction(input: {
  requestType: RequestType;
  answerability: Answerability;
  selectedEntity: SelectedEntity | null;
  verifiedFacts: VerifiedFact[];
  product: ProductContext | null;
  documents: DocumentContext[];
  answeredQuestionKeys: QuestionSemanticKey[];
  catalogResults?: CatalogResult[];
  catalogQueryType?: CatalogContext["queryType"] | null;
  catalogQueryValue?: string | null;
  totalCatalogMatches?: number;
  greetingAllowed?: boolean;
  greetingType?: GreetingType;
  companyName?: string | null;
  timezone?: string | null;
  products?: ProductContext[];
}): {
  responseAction: ResponseAction;
  attachmentAction: AttachmentAction | null;
  followUpQuestion: string | null;
  followUpQuestionKey: QuestionSemanticKey | null;
  handoffRequired: boolean;
  handoffReason: string | null;
  directAnswerRequired: boolean;
  directAnswerTemplate: string | null;
  catalogContext: CatalogContext | null;
} {
  const catalogResults = input.catalogResults ?? [];
  const now = new Date();

  if (input.requestType === "GREETING" && input.greetingAllowed) {
    return {
      responseAction: "ANSWER_DIRECTLY",
      attachmentAction: null,
      followUpQuestion: null,
      followUpQuestionKey: null,
      handoffRequired: false,
      handoffReason: null,
      directAnswerRequired: true,
      directAnswerTemplate: buildGreetingTemplate({
        greetingType: input.greetingType ?? "generic",
        companyName: input.companyName ?? null,
        timezone: input.timezone,
      }),
      catalogContext: null,
    };
  }

  if (input.requestType === "GREETING" && !input.greetingAllowed) {
    return {
      responseAction: "ANSWER_THEN_ASK",
      attachmentAction: null,
      followUpQuestion: "Ada yang bisa kami bantu hari ini?",
      followUpQuestionKey: "requested_service",
      handoffRequired: false,
      handoffReason: null,
      directAnswerRequired: false,
      directAnswerTemplate: "Baik, Kak.",
      catalogContext: null,
    };
  }

  if (
    (input.requestType === "CATALOG_DISCOVERY" || input.requestType === "DESTINATION_DISCOVERY") &&
    catalogResults.length > 0
  ) {
    const moreAvailable = (input.totalCatalogMatches ?? catalogResults.length) > MAX_CATALOG_RESULTS;
    const answer = buildCatalogDirectAnswer({
      requestType: input.requestType,
      queryType: input.catalogQueryType ?? "general",
      queryValue: input.catalogQueryValue ?? null,
      results: catalogResults,
      moreAvailable,
    });

    return {
      responseAction: resolveCatalogAction(input.requestType, input.catalogQueryType ?? null),
      attachmentAction: null,
      followUpQuestion: answer.followUp,
      followUpQuestionKey: input.catalogQueryType === "country" ? "requested_service" : "preferred_date",
      handoffRequired: false,
      handoffReason: null,
      directAnswerRequired: true,
      directAnswerTemplate: answer.template,
      catalogContext: {
        queryType: input.catalogQueryType ?? "general",
        queryValue: input.catalogQueryValue ?? null,
        entityIds: catalogResults.map((item) => item.entityId),
        establishedAt: now.toISOString(),
      },
    };
  }

  if (
    input.requestType === "DESTINATION_DISCOVERY" &&
    catalogResults.length === 0 &&
    input.catalogQueryValue &&
    input.products
  ) {
    const alternatives = findAlternativeCountryResults(input.products, input.catalogQueryValue);
    if (alternatives.length > 0) {
      const alternativeList = formatCatalogList(alternatives);
      return {
        responseAction: "LIST_MATCHING_PRODUCTS_THEN_ASK",
        attachmentAction: null,
        followUpQuestion: "Kakak tertarik melihat salah satunya?",
        followUpQuestionKey: "requested_service",
        handoffRequired: false,
        handoffReason: null,
        directAnswerRequired: true,
        directAnswerTemplate: buildNoExactDestinationTemplate(
          input.catalogQueryValue,
          "China",
          alternativeList,
        ),
        catalogContext: {
          queryType: "destination",
          queryValue: input.catalogQueryValue,
          entityIds: alternatives.map((item) => item.entityId),
          establishedAt: now.toISOString(),
        },
      };
    }
  }

  if (input.requestType === "HUMAN_REQUEST" || input.requestType === "COMPLAINT") {
    return {
      responseAction: "ACKNOWLEDGE_AND_HANDOFF",
      attachmentAction: null,
      followUpQuestion: null,
      followUpQuestionKey: null,
      handoffRequired: true,
      handoffReason: "Customer requested human assistance.",
      directAnswerRequired: false,
      directAnswerTemplate: null,
      catalogContext: null,
    };
  }

  if (input.requestType === "GENERAL_SERVICE_INQUIRY" && catalogResults.length > 0) {
    const answer = buildCatalogDirectAnswer({
      requestType: "CATALOG_DISCOVERY",
      queryType: "general",
      queryValue: null,
      results: catalogResults,
      moreAvailable: false,
    });
    return {
      responseAction: "LIST_CATALOG_THEN_ASK",
      attachmentAction: null,
      followUpQuestion: answer.followUp,
      followUpQuestionKey: "requested_service",
      handoffRequired: false,
      handoffReason: null,
      directAnswerRequired: true,
      directAnswerTemplate: answer.template,
      catalogContext: {
        queryType: "general",
        queryValue: null,
        entityIds: catalogResults.map((item) => item.entityId),
        establishedAt: now.toISOString(),
      },
    };
  }

  if (input.requestType === "GENERAL_SERVICE_INQUIRY") {
    return {
      responseAction: "ASK_ONE_CLARIFYING_QUESTION",
      attachmentAction: null,
      followUpQuestion: "Tentu, Kak. Ada yang bisa kami bantu?",
      followUpQuestionKey: "requested_service",
      handoffRequired: false,
      handoffReason: null,
      directAnswerRequired: false,
      directAnswerTemplate: null,
      catalogContext: null,
    };
  }

  if (input.requestType === "PRICE" && input.answerability === "ANSWERABLE" && !input.selectedEntity && catalogResults.length > 0) {
    const priced = catalogResults.filter((item) => item.priceLabel);
    if (priced.length > 0) {
      return {
        responseAction: "LIST_CATALOG_THEN_ASK",
        attachmentAction: null,
        followUpQuestion: "Kakak ingin saya jelaskan paket yang mana lebih dulu?",
        followUpQuestionKey: "requested_service",
        handoffRequired: false,
        handoffReason: null,
        directAnswerRequired: true,
        directAnswerTemplate: buildMultiProductPriceTemplate(priced),
        catalogContext: input.catalogQueryType
          ? {
              queryType: input.catalogQueryType,
              queryValue: input.catalogQueryValue ?? null,
              entityIds: catalogResults.map((item) => item.entityId),
              establishedAt: now.toISOString(),
            }
          : null,
      };
    }
  }

  if (input.answerability === "NEEDS_DISAMBIGUATION") {
    const question =
      input.requestType === "PRICE"
        ? "Saya bantu cek harganya, ya. Produk atau paket mana yang ingin dicek?"
        : input.requestType === "SCHEDULE_OR_DEPARTURE" || input.requestType === "AVAILABILITY"
          ? "Saya bantu cek jadwalnya, ya. Produk atau paket mana yang ingin dicek?"
          : "Tentu, Kak. Produk atau layanan mana yang ingin ditanyakan?";
    return {
      responseAction: "ASK_ONE_CLARIFYING_QUESTION",
      attachmentAction: null,
      followUpQuestion: question,
      followUpQuestionKey: "requested_service",
      handoffRequired: false,
      handoffReason: null,
      directAnswerRequired: false,
      directAnswerTemplate: null,
      catalogContext: null,
    };
  }

  if (input.requestType === "PRICE" && input.answerability === "ANSWERABLE") {
    const priceFact = input.verifiedFacts.find((fact) => fact.field === "price");
    const name = input.selectedEntity?.displayName ?? "produk ini";
    const followUp = input.answeredQuestionKeys.includes("participant_count")
      ? null
      : "Rencana berangkat berapa orang?";
    return {
      responseAction: followUp ? "ANSWER_THEN_ASK" : "ANSWER_DIRECTLY",
      attachmentAction: null,
      followUpQuestion: followUp,
      followUpQuestionKey: followUp ? "participant_count" : null,
      handoffRequired: false,
      handoffReason: null,
      directAnswerRequired: true,
      directAnswerTemplate: `Untuk harga terbarunya, ${name} tercatat ${priceFact?.value ?? ""}.`.trim(),
      catalogContext: null,
    };
  }

  if (input.requestType === "PRICE" && input.answerability === "REQUIRES_HUMAN_CONFIRMATION") {
    const name = input.selectedEntity?.displayName ?? "produk ini";
    return {
      responseAction: "HANDOFF_TO_HUMAN",
      attachmentAction: null,
      followUpQuestion: null,
      followUpQuestionKey: null,
      handoffRequired: true,
      handoffReason: "Current price is not available in active published data.",
      directAnswerRequired: false,
      directAnswerTemplate: `Harga terbaru untuk ${name} belum tersedia pada data aktif kami. Saya teruskan ke tim sales untuk konfirmasi.`,
      catalogContext: null,
    };
  }

  if (input.requestType === "ITINERARY_OR_DOCUMENT" && input.answerability === "ANSWERABLE") {
    const docs = input.product
      ? findItineraryDocuments(input.documents, input.product.name)
      : [];
    const doc = docs[0];
    const name = input.selectedEntity?.displayName ?? "produk ini";
    return {
      responseAction: "SEND_DOCUMENT_THEN_ASK",
      attachmentAction: doc
        ? {
            documentId: doc.id,
            documentName: doc.name,
            productId: input.product?.id ?? null,
            required: true,
          }
        : null,
      followUpQuestion: "Bagian itinerary mana yang ingin ditanyakan?",
      followUpQuestionKey: "notes",
      handoffRequired: false,
      handoffReason: null,
      directAnswerRequired: true,
      directAnswerTemplate: `Tentu, berikut ${doc?.name ?? "dokumen"} untuk ${name}.`,
      catalogContext: null,
    };
  }

  if (
    (input.requestType === "SCHEDULE_OR_DEPARTURE" || input.requestType === "AVAILABILITY") &&
    input.answerability === "ANSWERABLE"
  ) {
    const dates = input.verifiedFacts
      .filter((fact) => fact.field === "departure_date")
      .map((fact) => fact.value)
      .join(", ");
    const name = input.selectedEntity?.displayName ?? "produk ini";
    return {
      responseAction: "ANSWER_THEN_ASK",
      attachmentAction: null,
      followUpQuestion: "Tanggal mana yang paling sesuai?",
      followUpQuestionKey: "preferred_date",
      handoffRequired: false,
      handoffReason: null,
      directAnswerRequired: true,
      directAnswerTemplate: `Untuk ${name}, jadwal yang tersedia adalah ${dates}.`,
      catalogContext: null,
    };
  }

  if (
    (input.requestType === "SCHEDULE_OR_DEPARTURE" || input.requestType === "AVAILABILITY") &&
    input.answerability === "REQUIRES_HUMAN_CONFIRMATION"
  ) {
    const name = input.selectedEntity?.displayName ?? "produk ini";
    return {
      responseAction: "HANDOFF_TO_HUMAN",
      attachmentAction: null,
      followUpQuestion: null,
      followUpQuestionKey: null,
      handoffRequired: true,
      handoffReason: "No active verified schedule found.",
      directAnswerRequired: false,
      directAnswerTemplate: `Saya belum menemukan jadwal aktif untuk ${name}. Saya teruskan ke tim sales untuk konfirmasi.`,
      catalogContext: null,
    };
  }

  if (input.requestType === "ITINERARY_OR_DOCUMENT" && input.answerability === "REQUIRES_HUMAN_CONFIRMATION") {
    return {
      responseAction: "HANDOFF_TO_HUMAN",
      attachmentAction: null,
      followUpQuestion: null,
      followUpQuestionKey: null,
      handoffRequired: true,
      handoffReason: "Requested document is not available in active data.",
      directAnswerRequired: false,
      directAnswerTemplate: "Dokumen tersebut belum tersedia pada data aktif kami. Saya teruskan ke tim sales agar dapat dibantu.",
      catalogContext: null,
    };
  }

  return {
    responseAction: "ANSWER_THEN_ASK",
    attachmentAction: null,
    followUpQuestion: "Ada yang bisa kami bantu lebih lanjut?",
    followUpQuestionKey: "requested_service",
    handoffRequired: false,
    handoffReason: null,
    directAnswerRequired: false,
    directAnswerTemplate: "Tentu, Kak.",
    catalogContext: null,
  };
}
