import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { leadQualificationService } from "@/modules/ai/services/lead-qualification-service";
import { EMPTY_BUSINESS_BRAIN_CONTEXT } from "@/modules/business-brain/types/context";
import type { BusinessBrainContext, ProductContext } from "@/modules/business-brain/types/context";
import type { RetrievedBusinessBrainContext } from "@/modules/ai/types/context-retrieval";
import { promptItemsToPlaygroundMemoryDisplay } from "@/modules/ai/types/memory";
import { buildResponsePlan } from "@/modules/ai/response-planner/build-response-plan";
import {
  buildLivePlanningInput,
  buildPlaygroundPlanningInput,
  toPlaygroundSessionState,
} from "@/modules/ai/response-planner/planning-adapters";
import { EMPTY_PLAYGROUND_CONVERSATION_STATE } from "@/modules/business-brain/types/playground-session-state";
import { resolveCustomerRequestType } from "@/modules/ai/response-planner/resolve-customer-request";
import { resolveSelectedEntity } from "@/modules/ai/response-planner/resolve-product-context";
import { validateResponseAgainstPlan } from "@/modules/ai/response-planner/validate-response-plan";
import { calculatePlaygroundAiScore } from "@/modules/business-brain/lib/calculate-playground-ai-score";
import type { NormalizedPlanningInput } from "@/modules/ai/response-planner/types";

const WORKSPACE_ID = "ws-test-001";

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
        id: "dep-1",
        departureDate: "12 Agustus 2026",
        status: "open",
        availableSeats: 10,
      },
      {
        id: "dep-2",
        departureDate: "24 Agustus 2026",
        status: "open",
        availableSeats: 8,
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

describe("resolveCustomerRequestType", () => {
  it("classifies general service inquiry without travel assumption", () => {
    assert.equal(
      resolveCustomerRequestType("Halo, saya mau nanya layanan.", "GENERAL"),
      "GENERAL_SERVICE_INQUIRY",
    );
  });

  it("classifies price inquiry", () => {
    assert.equal(resolveCustomerRequestType("Berapa harganya?", "PRICE_INQUIRY"), "PRICE");
  });

  it("classifies schedule inquiry", () => {
    assert.equal(
      resolveCustomerRequestType("Ada keberangkatan bulan Agustus?", "DEPARTURE_DATE"),
      "SCHEDULE_OR_DEPARTURE",
    );
  });

  it("classifies itinerary request", () => {
    assert.equal(
      resolveCustomerRequestType("Boleh kirim itinerary?", "ITINERARY_REQUEST"),
      "ITINERARY_OR_DOCUMENT",
    );
  });
});

describe("resolveSelectedEntity", () => {
  const product = makeProduct();
  const brain = makeBrain([product]);

  it("reuses stored selected product for follow-up price question", () => {
    const selected = resolveSelectedEntity({
      latestMessage: "Berapa harganya?",
      recentHistory: [{ sender: "customer", text: "Paket Jepang" }],
      storedSelectedEntity: {
        entityId: product.id,
        entityType: "product",
        displayName: product.name,
        selectionSource: "recent_history",
        selectedAt: "2026-07-11T10:00:00.000Z",
      },
      collectedInformation: {},
      businessBrain: brain,
      retrieved: makeRetrieved([product]),
      includeDraft: false,
    });

    assert.equal(selected.entity?.entityId, product.id);
    assert.equal(selected.entity?.selectionSource, "recent_history");
  });

  it("explicit product overrides weaker stored selection", () => {
    const other = makeProduct({
      id: "prod-bali",
      name: "Paket Bali",
      destination: "Bali",
    });
    const selected = resolveSelectedEntity({
      latestMessage: "Mau tanya Paket Bali",
      recentHistory: [],
      storedSelectedEntity: {
        entityId: product.id,
        entityType: "product",
        displayName: product.name,
        selectionSource: "conversation_state",
        selectedAt: "2026-07-11T10:00:00.000Z",
      },
      collectedInformation: {},
      businessBrain: makeBrain([product, other]),
      retrieved: makeRetrieved([product, other]),
      includeDraft: false,
    });

    assert.equal(selected.entity?.entityId, other.id);
    assert.equal(selected.entity?.selectionSource, "explicit_latest_message");
  });

  it("invalidates archived selected product", () => {
    const archived = makeProduct({ id: "prod-archived", status: "archived" });
    const selected = resolveSelectedEntity({
      latestMessage: "Berapa harganya?",
      recentHistory: [],
      storedSelectedEntity: {
        entityId: archived.id,
        entityType: "product",
        displayName: archived.name,
        selectionSource: "conversation_state",
        selectedAt: "2026-07-11T10:00:00.000Z",
      },
      collectedInformation: {},
      businessBrain: makeBrain([archived]),
      retrieved: makeRetrieved([]),
      includeDraft: false,
    });

    assert.equal(selected.entity, null);
  });

  it("does not overwrite with ambiguous retrieval", () => {
    const p1 = makeProduct({ id: "p1", name: "Paket A" });
    const p2 = makeProduct({ id: "p2", name: "Paket B", destination: "Korea" });
    const selected = resolveSelectedEntity({
      latestMessage: "Berapa harganya?",
      recentHistory: [],
      storedSelectedEntity: {
        entityId: p1.id,
        entityType: "product",
        displayName: p1.name,
        selectionSource: "conversation_state",
        selectedAt: "2026-07-11T10:00:00.000Z",
      },
      collectedInformation: {},
      businessBrain: makeBrain([p1, p2]),
      retrieved: makeRetrieved([p1, p2]),
      includeDraft: false,
    });

    assert.equal(selected.entity?.entityId, p1.id);
  });
});

describe("buildResponsePlan", () => {
  it("answers verified price directly", () => {
    const plan = buildResponsePlan(makePlanningInput());
    assert.equal(plan.requestType, "PRICE");
    assert.equal(plan.answerability, "ANSWERABLE");
    assert.equal(plan.responseAction, "ANSWER_THEN_ASK");
    assert.equal(plan.directAnswerRequired, true);
    assert.match(plan.directAnswerTemplate ?? "", /18[.,\s]?000[.,\s]?000|18\.500\.000|18500000/i);
    assert.equal(plan.followUpQuestionKey, "participant_count");
  });

  it("requires handoff when price is missing", () => {
    const product = makeProduct({ pricing: [] });
    const plan = buildResponsePlan(
      makePlanningInput({
        publishedBusinessBrain: makeBrain([product]),
        retrievedContext: makeRetrieved([product]),
      }),
    );

    assert.equal(plan.answerability, "REQUIRES_HUMAN_CONFIRMATION");
    assert.equal(plan.handoffRequired, true);
    assert.equal(plan.responseAction, "HANDOFF_TO_HUMAN");
  });

  it("asks one clarification when product unresolved", () => {
    const plan = buildResponsePlan(
      makePlanningInput({
        conversationState: {
          greetingSent: false,
          collectedInformation: {},
          questionsAsked: [],
          selectedEntity: null,
          catalogContext: null,
          currentIntent: null,
          handoffRequested: false,
        },
        recentHistory: [],
        retrievedContext: makeRetrieved([]),
      }),
    );

    assert.equal(plan.answerability, "NEEDS_DISAMBIGUATION");
    assert.equal(plan.responseAction, "ASK_ONE_CLARIFYING_QUESTION");
    assert.equal(plan.followUpQuestionKey, "requested_service");
  });

  it("answers verified August schedule directly", () => {
    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "Ada keberangkatan bulan Agustus?",
        intent: "DEPARTURE_DATE",
      }),
    );

    assert.equal(plan.requestType, "SCHEDULE_OR_DEPARTURE");
    assert.equal(plan.answerability, "ANSWERABLE");
    assert.match(plan.directAnswerTemplate ?? "", /Agustus/);
  });

  it("requires handoff when schedule missing", () => {
    const product = makeProduct({ departures: [] });
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

  it("general service inquiry asks which service is needed", () => {
    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "Halo, saya mau nanya layanan.",
        intent: "GENERAL",
        conversationState: null,
        publishedBusinessBrain: makeBrain([]),
        retrievedContext: makeRetrieved([]),
      }),
    );

    assert.equal(plan.requestType, "GENERAL_SERVICE_INQUIRY");
    assert.equal(plan.followUpQuestionKey, "requested_service");
    assert.match(plan.followUpQuestion ?? "", /bantu/i);
  });
});

describe("validateResponseAgainstPlan", () => {
  it("blocks unsupported availability claim", () => {
    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "Ada keberangkatan bulan Agustus?",
        intent: "DEPARTURE_DATE",
        publishedBusinessBrain: makeBrain([makeProduct({ departures: [] })]),
        retrievedContext: makeRetrieved([makeProduct({ departures: [] })]),
      }),
    );

    const validation = validateResponseAgainstPlan(
      "Ada Kak, untuk bulan Agustus ada beberapa pilihan destinasi.",
      plan,
    );

    assert.equal(validation.unsupportedClaimDetected, true);
    assert.equal(validation.unsupportedClaimType, "availability");
    assert.equal(validation.answerFirstPassed, false);
  });

  it("uses deterministic fallback when direct answer missing", () => {
    const plan = buildResponsePlan(makePlanningInput());
    const validation = validateResponseAgainstPlan(
      "Baik Kak, tim kami akan membantu agar penjelasannya lebih nyaman.",
      plan,
    );

    assert.equal(validation.passed, false);
    assert.equal(validation.directAnswerPresent, false);
    assert.ok(validation.fallbackReply);
  });

  it("preserves required handoff", () => {
    const product = makeProduct({ pricing: [] });
    const plan = buildResponsePlan(
      makePlanningInput({
        publishedBusinessBrain: makeBrain([product]),
        retrievedContext: makeRetrieved([product]),
      }),
    );

    const validation = validateResponseAgainstPlan("Harga Paket Jepang Rp 10 juta.", plan);
    assert.equal(validation.unsupportedClaimDetected, true);
    assert.equal(validation.unsupportedClaimType, "price");
  });
});

describe("planning adapters", () => {
  it("live and playground use the same response planner", () => {
    const product = makeProduct();
    const brain = makeBrain([product]);
    const retrieved = makeRetrieved([product]);

    const livePlan = buildResponsePlan(
      buildLivePlanningInput({
        workspaceId: WORKSPACE_ID,
        latestMessage: "Berapa harganya?",
        recentHistory: [{ sender: "customer", text: "Paket Jepang" }],
        intent: "PRICE_INQUIRY",
        conversationState: null,
        conversationStateContext: null,
        selectedEntity: null,
        publishedBusinessBrain: brain,
        retrievedContext: retrieved,
        memory: {},
        qualification: null,
      }),
    );

    const playgroundPlan = buildResponsePlan(
      buildPlaygroundPlanningInput({
        workspaceId: WORKSPACE_ID,
        session: toPlaygroundSessionState({
          workspaceId: WORKSPACE_ID,
          sessionId: "test-session",
          state: EMPTY_PLAYGROUND_CONVERSATION_STATE,
        }),
        latestMessage: "Berapa harganya?",
        recentHistory: [{ sender: "customer", text: "Paket Jepang" }],
        intent: "PRICE_INQUIRY",
        conversationStateContext: null,
        publishedBusinessBrain: brain,
        retrievedContext: retrieved,
        memory: {},
        qualification: null,
      }),
    );

    assert.equal(livePlan.requestType, playgroundPlan.requestType);
    assert.equal(livePlan.answerability, playgroundPlan.answerability);
    assert.equal(livePlan.responseAction, playgroundPlan.responseAction);
  });

  it("playground reset state uses empty conversation defaults", () => {
    const session = toPlaygroundSessionState({
      workspaceId: WORKSPACE_ID,
      sessionId: "test-session",
      state: EMPTY_PLAYGROUND_CONVERSATION_STATE,
    });

    assert.equal(session.greetingSent, false);
    assert.equal(session.selectedEntity, null);
    assert.deepEqual(session.questionsAsked, []);
    assert.deepEqual(session.simulatedAttachments, []);
  });

  it("playground mode may include draft products while live excludes them", () => {
    const draft = makeProduct({ id: "draft-1", name: "Draft Tour", status: "draft" });
    const brain = makeBrain([draft]);
    const retrieved = makeRetrieved([draft]);

    const live = resolveSelectedEntity({
      latestMessage: "Berapa harganya Draft Tour?",
      recentHistory: [],
      storedSelectedEntity: null,
      collectedInformation: {},
      businessBrain: brain,
      retrieved,
      includeDraft: false,
    });

    const playground = resolveSelectedEntity({
      latestMessage: "Berapa harganya Draft Tour?",
      recentHistory: [],
      storedSelectedEntity: null,
      collectedInformation: {},
      businessBrain: brain,
      retrieved,
      includeDraft: true,
    });

    assert.equal(live.entity, null);
    assert.equal(playground.entity?.entityId, draft.id);
  });
});

describe("playground scoring", () => {
  it("caps unsupported availability response at 40", () => {
    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "Ada keberangkatan bulan Agustus?",
        intent: "DEPARTURE_DATE",
        publishedBusinessBrain: makeBrain([makeProduct({ departures: [] })]),
        retrievedContext: makeRetrieved([makeProduct({ departures: [] })]),
      }),
    );
    const reply = "Ada Kak, untuk bulan Agustus ada beberapa pilihan destinasi.";
    const planValidation = validateResponseAgainstPlan(reply, plan);

    const score = calculatePlaygroundAiScore({
      result: {
        preview: {
          aiReply: reply,
          confidence: 0.97,
          handoffRequired: false,
          handoffReason: null,
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
        retrievalSummary: plan.requestType
          ? {
              intent: "DEPARTURE_DATE",
              matchedKeywords: [],
              productCount: 1,
              articleCount: 0,
              documentCount: 0,
              behaviorCount: 0,
            }
          : undefined,
        customerMemory: emptyPlaygroundMemory,
        customerMemoryUsed: [],
        leadQualification: emptyLeadQualification,
      },
      customerMessage: "Ada keberangkatan bulan Agustus?",
      conversationHistory: [],
      responsePlan: plan,
      planValidation,
    });

    assert.ok(score.breakdown.overall <= 40);
    assert.notEqual(score.overallLabel, "Excellent");
    assert.notEqual(score.overallLabel, "Good");
  });

  it("scores correct handoff positively when data missing", () => {
    const product = makeProduct({ pricing: [] });
    const plan = buildResponsePlan(
      makePlanningInput({
        publishedBusinessBrain: makeBrain([product]),
        retrievedContext: makeRetrieved([product]),
      }),
    );
    const reply =
      "Harga terbaru untuk Paket Jepang belum tersedia pada data aktif kami. Saya teruskan ke tim sales untuk konfirmasi.";
    const planValidation = validateResponseAgainstPlan(reply, plan);

    const score = calculatePlaygroundAiScore({
      result: {
        preview: {
          aiReply: reply,
          confidence: 0.8,
          handoffRequired: true,
          handoffReason: plan.handoffReason,
          suggestedActions: [],
          usedSources: [product.id],
          sourceLabels: ["Paket Jepang"],
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
          intent: "PRICE_INQUIRY",
          matchedKeywords: [],
          productCount: 1,
          articleCount: 0,
          documentCount: 0,
          behaviorCount: 0,
        },
        customerMemory: emptyPlaygroundMemory,
        customerMemoryUsed: [],
        leadQualification: {
          ...emptyLeadQualification,
          completionScore: 50,
        },
      },
      customerMessage: "Berapa harganya?",
      conversationHistory: [{ sender: "customer", text: "Paket Jepang" }],
      responsePlan: plan,
      planValidation,
    });

    assert.ok(score.breakdown.overall >= 60);
    assert.equal(planValidation.handoffPreserved, true);
  });
});
