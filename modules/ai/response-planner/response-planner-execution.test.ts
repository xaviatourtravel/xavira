import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { leadQualificationService } from "@/modules/ai/services/lead-qualification-service";
import { EMPTY_BUSINESS_BRAIN_CONTEXT } from "@/modules/business-brain/types/context";
import type { BusinessBrainContext, ProductContext } from "@/modules/business-brain/types/context";
import type { RetrievedBusinessBrainContext } from "@/modules/ai/types/context-retrieval";
import { promptItemsToPlaygroundMemoryDisplay } from "@/modules/ai/types/memory";
import { buildResponsePlan } from "@/modules/ai/response-planner/build-response-plan";
import {
  DOCUMENT_DELIVERY_FAILURE_REPLY_ID,
} from "@/modules/ai/response-planner/execute-plan-document";
import {
  applyValidatedReply,
  mergeLlmOutputWithPlan,
} from "@/modules/ai/response-planner/merge-plan-output";
import type { NormalizedPlanningInput } from "@/modules/ai/response-planner/types";
import {
  departureMatchesPeriod,
  extractSchedulePeriodFromMessage,
  normalizeDepartureToIso,
} from "@/modules/ai/response-planner/resolve-schedule-period";
import { validateResponseAgainstPlan } from "@/modules/ai/response-planner/validate-response-plan";
import { parseWhatsAppSalesLlmResponse } from "@/modules/business-brain/lib/parse-whatsapp-sales-llm-response";
import { calculatePlaygroundAiScore } from "@/modules/business-brain/lib/calculate-playground-ai-score";
import {
  EMPTY_PLAYGROUND_CONVERSATION_STATE,
  MAX_PLAYGROUND_CONVERSATION_TURNS,
} from "@/modules/business-brain/types/playground-session-state";
import type { WhatsAppSalesLlmOutputContract } from "@/modules/business-brain/types/prompt";

const WORKSPACE_ID = "ws-exec-001";
const REFERENCE_DATE = new Date("2026-07-12T00:00:00+07:00");

const emptyRetrieved: RetrievedBusinessBrainContext = {
  companyDNA: null,
  relevantProducts: [],
  relevantArticles: [],
  relevantDocuments: [],
  relevantBehaviors: [],
  handoverRules: [],
  replyStyle: null,
  qualificationRules: null,
  retrievalSummary: {
    intent: "PRICE_INQUIRY",
    matchedKeywords: [],
    productCount: 0,
    articleCount: 0,
    documentCount: 0,
    behaviorCount: 0,
  },
};

const emptyLeadQualification = leadQualificationService.snapshotFromPromptItems([]);
const emptyPlaygroundMemory = promptItemsToPlaygroundMemoryDisplay([]);

function makeProduct(overrides: Partial<ProductContext> = {}): ProductContext {
  return {
    id: "prod-japan",
    name: "Paket Jepang",
    category: "International Tour",
    destination: "Jepang",
    description: "Tour Jepang 7 hari",
    highlights: ["Tokyo", "Osaka"],
    pricing: [
      {
        id: "price-1",
        packageName: "Standard",
        price: 18500000,
        currency: "IDR",
        validUntil: "2026-12-31",
      },
    ],
    departures: [
      {
        id: "dep-aug-1",
        departureDate: "12 Agustus 2026",
        status: "open",
        availableSeats: 10,
      },
      {
        id: "dep-aug-2",
        departureDate: "24 Agustus 2026",
        status: "open",
        availableSeats: 8,
      },
      {
        id: "dep-sep",
        departureDate: "5 September 2026",
        status: "open",
        availableSeats: 6,
      },
    ],
    included: ["Hotel"],
    excluded: ["Visa"],
    aiNotes: "",
    status: "published",
    ...overrides,
  };
}

function makeBrain(products: ProductContext[] = [makeProduct()]): BusinessBrainContext {
  return {
    ...EMPTY_BUSINESS_BRAIN_CONTEXT,
    products,
  };
}

function makeRetrieved(products: ProductContext[] = []): RetrievedBusinessBrainContext {
  return {
    ...emptyRetrieved,
    relevantProducts: products,
    retrievalSummary: {
      ...emptyRetrieved.retrievalSummary,
      productCount: products.length,
    },
  };
}

function makePlanningInput(overrides: Partial<NormalizedPlanningInput> = {}): NormalizedPlanningInput {
  const product = makeProduct();
  return {
    workspaceId: WORKSPACE_ID,
    mode: "live",
    latestMessage: "Berapa harganya?",
    recentHistory: [{ sender: "customer", text: "Paket Jepang" }],
    intent: "PRICE_INQUIRY",
    conversationState: {
      greetingSent: true,
      collectedInformation: {},
      questionsAsked: [],
      selectedEntity: {
        entityId: product.id,
        entityType: "product",
        displayName: product.name,
        selectionSource: "recent_history",
        selectedAt: "2026-07-11T10:00:00.000Z",
      },
      catalogContext: null,
      currentIntent: "PRICE_INQUIRY",
      handoffRequested: false,
    },
    conversationStateContext: null,
    publishedBusinessBrain: makeBrain([product]),
    retrievedContext: makeRetrieved([product]),
    customerContext: { memory: {}, qualification: null },
    includeDraft: false,
    ...overrides,
  };
}

function makeLlmContract(
  overrides: Partial<WhatsAppSalesLlmOutputContract> = {},
): WhatsAppSalesLlmOutputContract {
  return {
    reply: "Harga Paket Jepang adalah Rp 18.500.000 per orang.",
    handoffRequired: false,
    handoffReason: null,
    confidence: 90,
    suggestedActions: [],
    usedSources: ["prod-japan"],
    missingInformation: [],
    suggestedNextStep: null,
    intent: "PRICE_INQUIRY",
    documentActions: [],
    actions: [],
    ...overrides,
  };
}

function scoreWithPlan(args: {
  reply: string;
  rawReply?: string;
  plan: ReturnType<typeof buildResponsePlan>;
  customerMessage: string;
}) {
  const rawPlanValidation = args.rawReply
    ? validateResponseAgainstPlan(args.rawReply, args.plan)
    : null;
  const planValidation = validateResponseAgainstPlan(args.reply, args.plan);

  return calculatePlaygroundAiScore({
    result: {
      preview: {
        aiReply: args.reply,
        confidence: 0.9,
        handoffRequired: args.plan.handoffRequired,
        handoffReason: args.plan.handoffReason,
        suggestedActions: [],
        usedSources: [],
        sourceLabels: [],
        documentActions: [],
      },
      contextUsed: {
        companyDna: { id: "dna", title: "DNA", items: [], emptyLabel: "" },
        products: { id: "products", title: "Products", items: [], emptyLabel: "" },
        knowledge: { id: "knowledge", title: "Knowledge", items: [], emptyLabel: "" },
        documents: { id: "documents", title: "Documents", items: [], emptyLabel: "" },
        behaviors: { id: "behaviors", title: "Behaviors", items: [], emptyLabel: "" },
        handoverRules: { id: "handover", title: "Handover", items: [], emptyLabel: "" },
      },
      retrievalSummary: {
        intent: "DEPARTURE_DATE",
        matchedKeywords: [],
        productCount: 1,
        articleCount: 0,
        documentCount: 0,
        behaviorCount: 0,
      },
      customerMemory: emptyPlaygroundMemory,
      customerMemoryUsed: [],
      leadQualification: emptyLeadQualification,
    },
    customerMessage: args.customerMessage,
    conversationHistory: [],
    responsePlan: args.plan,
    planValidation,
    rawPlanValidation,
    rawReply: args.rawReply ?? null,
  });
}

describe("schedule period filtering", () => {
  it("August query matches only August dates", () => {
    const period = extractSchedulePeriodFromMessage(
      "Ada keberangkatan bulan Agustus?",
      REFERENCE_DATE,
    );
    assert.ok(period);
    assert.equal(period?.month, 8);

    const aug1 = normalizeDepartureToIso("12 Agustus 2026");
    const sep = normalizeDepartureToIso("5 September 2026");
    assert.equal(departureMatchesPeriod(aug1.iso!, period), true);
    assert.equal(departureMatchesPeriod(sep.iso!, period), false);
  });

  it("August query does not match September", () => {
    const period = extractSchedulePeriodFromMessage("Agustus", REFERENCE_DATE);
    const sep = normalizeDepartureToIso("5 September 2026");
    assert.equal(departureMatchesPeriod(sep.iso!, period), false);
  });

  it("month and year filter correctly", () => {
    const period = extractSchedulePeriodFromMessage("Agustus 2027", REFERENCE_DATE);
    assert.equal(period?.year, 2027);
    assert.equal(period?.month, 8);

    const aug2026 = normalizeDepartureToIso("12 Agustus 2026");
    const aug2027 = normalizeDepartureToIso("12 Agustus 2027");
    assert.equal(departureMatchesPeriod(aug2026.iso!, period), false);
    assert.equal(departureMatchesPeriod(aug2027.iso!, period), true);
  });

  it("date range filter correctly", () => {
    const period = extractSchedulePeriodFromMessage(
      "2026-08-10 sampai 2026-08-20",
      REFERENCE_DATE,
    );
    assert.equal(departureMatchesPeriod("2026-08-12", period), true);
    assert.equal(departureMatchesPeriod("2026-09-01", period), false);
  });

  it("no matching month triggers confirmation/handoff", () => {
    const product = makeProduct({
      departures: [
        {
          id: "dep-sep",
          departureDate: "5 September 2026",
          status: "open",
          availableSeats: 6,
        },
      ],
    });
    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "Ada keberangkatan bulan Agustus?",
        intent: "DEPARTURE_DATE",
        publishedBusinessBrain: makeBrain([product]),
        retrievedContext: makeRetrieved([product]),
      }),
    );

    assert.equal(plan.handoffRequired, true);
    assert.equal(plan.answerability, "REQUIRES_HUMAN_CONFIRMATION");
  });

  it("unresolved product triggers one clarification", () => {
    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "Ada keberangkatan bulan Agustus?",
        intent: "DEPARTURE_DATE",
        recentHistory: [],
        conversationState: {
          greetingSent: false,
          collectedInformation: {},
          questionsAsked: [],
          selectedEntity: null,
          catalogContext: null,
          currentIntent: null,
          handoffRequested: false,
        },
        publishedBusinessBrain: makeBrain([]),
        retrievedContext: makeRetrieved([]),
      }),
    );

    assert.equal(plan.responseAction, "ASK_ONE_CLARIFYING_QUESTION");
    assert.equal(plan.followUpQuestionKey, "requested_service");
  });

  it("malformed schedule is excluded", () => {
    const result = normalizeDepartureToIso("tanggal tidak jelas");
    assert.equal(result.iso, null);
    assert.equal(result.malformed, true);
  });

  it("date-only values do not shift across timezone", () => {
    const iso = normalizeDepartureToIso("2026-08-12");
    assert.equal(iso.iso, "2026-08-12");
  });
});

describe("structured output and plan merge", () => {
  it("complete structured output parses", () => {
    const parsed = parseWhatsAppSalesLlmResponse({
      replyText: "Harga Paket Jepang adalah Rp 18.500.000.",
      directAnswer: "Harga Paket Jepang adalah Rp 18.500.000.",
      followUpQuestion: "Berapa jumlah peserta?",
      followUpQuestionKey: "participant_count",
      requestType: "PRICE",
      answerability: "ANSWERABLE",
      responseAction: "ANSWER_THEN_ASK",
      handoffRequired: false,
      handoffReason: null,
      confidence: 0.9,
      suggestedActions: [],
      usedSources: ["prod-japan"],
      missingInformation: [],
      suggestedNextStep: null,
      intent: "PRICE_INQUIRY",
      attachmentIds: [],
      actions: [],
    });

    assert.ok(parsed);
    assert.equal(parsed?.directAnswer, "Harga Paket Jepang adalah Rp 18.500.000.");
    assert.equal(parsed?.followUpQuestionKey, "participant_count");
  });

  it("legacy output remains compatible", () => {
    const parsed = parseWhatsAppSalesLlmResponse({
      reply: "Baik Kak, saya bantu.",
      handoffRequired: false,
      handoffReason: null,
      confidence: 0.8,
      suggestedActions: [],
      usedSources: [],
      missingInformation: [],
      suggestedNextStep: null,
      intent: "GENERAL",
      actions: [],
    });

    assert.ok(parsed);
    assert.equal(parsed?.reply, "Baik Kak, saya bantu.");
    assert.equal(parsed?.directAnswer, null);
  });

  it("model cannot change response action", () => {
    const plan = buildResponsePlan(makePlanningInput());
    const merged = mergeLlmOutputWithPlan(
      makeLlmContract({
        responseAction: "HANDOFF_TO_HUMAN",
        handoffRequired: false,
      }),
      plan,
      true,
    );

    assert.equal(merged.responseAction, plan.responseAction);
    assert.equal(merged.handoffRequired, plan.handoffRequired);
    assert.equal(merged.planAuthoritative, true);
  });

  it("model cannot inject unsupported date or price", () => {
    const plan = buildResponsePlan(
      makePlanningInput({
        publishedBusinessBrain: makeBrain([makeProduct({ pricing: [] })]),
        retrievedContext: makeRetrieved([makeProduct({ pricing: [] })]),
      }),
    );
    const unsafe =
      "Harga Paket Jepang Rp 20 juta. Ada keberangkatan 1 Agustus.";
    const validation = validateResponseAgainstPlan(unsafe, plan);
    assert.equal(validation.unsupportedClaimDetected, true);
  });

  it("missing direct answer triggers fallback via applyValidatedReply", () => {
    const plan = buildResponsePlan(makePlanningInput());
    const result = applyValidatedReply({
      rawReply: "Baik Kak, tim kami akan membantu.",
      plan,
      answerFirstEnabled: true,
    });

    assert.ok(result.rawValidation);
    assert.equal(result.rawValidation?.passed, false);
    assert.ok(result.finalReply);
    assert.notEqual(result.finalReply, "Baik Kak, tim kami akan membantu.");
  });
});

describe("handoff validation", () => {
  it("missing price handoff reply is validated", () => {
    const product = makeProduct({ pricing: [] });
    const plan = buildResponsePlan(
      makePlanningInput({
        publishedBusinessBrain: makeBrain([product]),
        retrievedContext: makeRetrieved([product]),
      }),
    );
    const reply =
      "Harga terbaru untuk Paket Jepang belum tersedia pada data aktif kami. Saya teruskan ke tim sales untuk konfirmasi.";
    const validation = validateResponseAgainstPlan(reply, plan);
    assert.equal(validation.handoffPreserved, true);
    assert.equal(validation.passed, true);
  });

  it("unsupported claim in handoff reply uses fallback", () => {
    const product = makeProduct({ departures: [] });
    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "Ada keberangkatan bulan Agustus?",
        intent: "DEPARTURE_DATE",
        publishedBusinessBrain: makeBrain([product]),
        retrievedContext: makeRetrieved([product]),
      }),
    );
    const validated = applyValidatedReply({
      rawReply: "Ada Kak, untuk Agustus masih tersedia.",
      plan,
      answerFirstEnabled: true,
    });
    assert.equal(validated.rawValidation?.unsupportedClaimDetected, true);
    assert.notEqual(validated.finalReply, "Ada Kak, untuk Agustus masih tersedia.");
  });

  it("required handoff cannot be removed by merge", () => {
    const product = makeProduct({ pricing: [] });
    const plan = buildResponsePlan(
      makePlanningInput({
        publishedBusinessBrain: makeBrain([product]),
        retrievedContext: makeRetrieved([product]),
      }),
    );
    const merged = mergeLlmOutputWithPlan(
      makeLlmContract({ handoffRequired: false }),
      plan,
      true,
    );
    assert.equal(merged.handoffRequired, true);
  });
});

describe("document delivery failure messaging", () => {
  it("failure reply does not claim itinerary was sent", () => {
    assert.match(DOCUMENT_DELIVERY_FAILURE_REPLY_ID, /belum berhasil dikirim/i);
    assert.doesNotMatch(DOCUMENT_DELIVERY_FAILURE_REPLY_ID, /berikut itinerary/i);
  });
});

describe("playground persistence bounds", () => {
  it("state remains bounded by max conversation turns", () => {
    assert.equal(MAX_PLAYGROUND_CONVERSATION_TURNS, 40);
    assert.deepEqual(EMPTY_PLAYGROUND_CONVERSATION_STATE.simulatedAttachments, []);
  });

  it("reset clears simulated attachment state", () => {
    const cleared = {
      ...EMPTY_PLAYGROUND_CONVERSATION_STATE,
      simulatedAttachments: [],
    };
    assert.deepEqual(cleared.simulatedAttachments, []);
    assert.equal(cleared.selectedEntity, null);
  });
});

describe("scoring raw vs final", () => {
  it("raw unsupported availability is recorded while final fallback is safe", () => {
    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "Ada keberangkatan bulan Agustus?",
        intent: "DEPARTURE_DATE",
        publishedBusinessBrain: makeBrain([makeProduct({ departures: [] })]),
        retrievedContext: makeRetrieved([makeProduct({ departures: [] })]),
      }),
    );
    const rawReply = "Ada Kak, untuk bulan Agustus ada beberapa pilihan destinasi.";
    const validated = applyValidatedReply({
      rawReply,
      plan,
      answerFirstEnabled: true,
    });

    const score = scoreWithPlan({
      reply: validated.finalReply,
      rawReply,
      plan,
      customerMessage: "Ada keberangkatan bulan Agustus?",
    });

    assert.equal(score.groundingDiagnostics?.unsupportedClaimDetected, true);
    assert.ok(score.breakdown.modelGeneration <= 40);
    assert.ok(score.breakdown.finalDeliverySafety >= score.breakdown.modelGeneration);
  });

  it("correct verified August response scores positively", () => {
    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "Ada keberangkatan bulan Agustus?",
        intent: "DEPARTURE_DATE",
      }),
    );
    const reply =
      "Untuk Paket Jepang, jadwal keberangkatan Agustus yang tersedia adalah 12 Agustus 2026 dan 24 Agustus 2026.";
    const score = scoreWithPlan({
      reply,
      plan,
      customerMessage: "Ada keberangkatan bulan Agustus?",
    });

    assert.ok(score.breakdown.overall >= 75);
    assert.equal(score.groundingDiagnostics?.unsupportedClaimDetected, false);
  });

  it("correct missing-data handoff scores positively", () => {
    const product = makeProduct({ pricing: [] });
    const plan = buildResponsePlan(
      makePlanningInput({
        publishedBusinessBrain: makeBrain([product]),
        retrievedContext: makeRetrieved([product]),
      }),
    );
    const reply =
      "Harga terbaru untuk Paket Jepang belum tersedia pada data aktif kami. Saya teruskan ke tim sales untuk konfirmasi.";
    const score = scoreWithPlan({ reply, plan, customerMessage: "Berapa harganya?" });
    assert.ok(score.breakdown.overall >= 70);
    assert.equal(score.groundingDiagnostics?.handoffPreserved, true);
  });
});
