import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { leadQualificationService } from "@/modules/ai/services/lead-qualification-service";
import { promptItemsToPlaygroundMemoryDisplay } from "@/modules/ai/types/memory";
import { EMPTY_BUSINESS_BRAIN_CONTEXT } from "@/modules/business-brain/types/context";
import { DEFAULT_COMMUNICATION_STYLE } from "@/modules/business-brain/types/company-dna";
import type { BusinessBrainContext, ProductContext } from "@/modules/business-brain/types/context";
import type { RetrievedBusinessBrainContext } from "@/modules/ai/types/context-retrieval";
import type { NormalizedPlanningInput } from "@/modules/ai/response-planner/types";
import { resolveCustomerRequestType } from "@/modules/ai/response-planner/resolve-customer-request";
import { buildResponsePlan } from "@/modules/ai/response-planner/build-response-plan";
import { applyValidatedReply } from "@/modules/ai/response-planner/merge-plan-output";
import { calculatePlaygroundAiScore } from "@/modules/business-brain/lib/calculate-playground-ai-score";
import { processPlaygroundTurnDelivery } from "@/modules/business-brain/services/playground-turn-delivery";
import { RUNTIME_VERSIONS } from "@/modules/ai/runtime/runtime-versions";
import { EMPTY_PLAYGROUND_CONVERSATION_STATE } from "@/modules/business-brain/types/playground-session-state";
import { updatePlaygroundSessionAfterReply } from "@/modules/ai/response-planner/planning-adapters";

const WORKSPACE_ID = "ws-playground-integration";
const SESSION_ID = "session-integration-001";
const emptyLeadQualification = leadQualificationService.snapshotFromPromptItems([]);
const emptyPlaygroundMemory = promptItemsToPlaygroundMemoryDisplay([]);

function makeChinaProducts(): ProductContext[] {
  return [
    {
      id: "prod-yunnan-1",
      name: "Yunnan Kunming–Dali–Lijiang 8D6N",
      category: "International Tour",
      destination: "Yunnan",
      description: "",
      highlights: ["Kunming", "Dali", "Lijiang"],
      pricing: [{ id: "p1", packageName: "Standard", price: 15500000, currency: "IDR", validUntil: "2026-12-31" }],
      departures: [{ id: "d1", departureDate: "12 Agustus 2026", status: "open", availableSeats: 10 }],
      included: [],
      excluded: [],
      aiNotes: "",
      status: "published",
    },
    {
      id: "prod-zhangjiajie",
      name: "Furongzhen Chongqing Zhangjiajie Muslim Friendly Tour",
      category: "International Tour",
      destination: "Chongqing",
      description: "",
      highlights: ["Zhangjiajie", "Chongqing", "Furongzhen"],
      pricing: [{ id: "p2", packageName: "Standard", price: 17200000, currency: "IDR", validUntil: "2026-12-31" }],
      departures: [],
      included: [],
      excluded: [],
      aiNotes: "",
      status: "published",
    },
  ];
}

function makeKoreaProduct(): ProductContext {
  return {
    id: "prod-korea-seoul",
    name: "Lite Korea South Korea Muslim Friendly Tour",
    category: "International Tour",
    destination: "Korea",
    description: "",
    highlights: ["Seoul"],
    pricing: [{ id: "k1", packageName: "Standard", price: 18900000, currency: "IDR", validUntil: "2026-12-31" }],
    departures: [],
    included: [],
    excluded: [],
    aiNotes: "",
    status: "published",
  };
}

function makeJapanProduct(): ProductContext {
  return {
    id: "prod-japan-golden",
    name: "Japan Golden Route Shirakawago + Brunei Muslim Friendly Tour",
    category: "International Tour",
    destination: "Japan",
    description: "",
    highlights: ["Tokyo", "Shirakawago"],
    pricing: [{ id: "jp1", packageName: "Standard", price: 32150000, currency: "IDR", validUntil: "2026-12-31" }],
    departures: [{ id: "jd1", departureDate: "5 Agustus 2026", status: "open", availableSeats: 10 }],
    included: [],
    excluded: [],
    aiNotes: "",
    status: "published",
  };
}

function makeBrain(products: ProductContext[]): BusinessBrainContext {
  return {
    ...EMPTY_BUSINESS_BRAIN_CONTEXT,
    companyDNA: {
      companyName: "Desklabs Travel",
      industry: "Travel & Tour",
      website: "",
      about: "",
      brandPersonality: [],
      communicationStyle: DEFAULT_COMMUNICATION_STYLE,
      salesStyle: "consultative",
      aiGoals: [],
      neverRules: [],
    },
    products,
  };
}

function makeRetrieved(products: ProductContext[]): RetrievedBusinessBrainContext {
  return {
    companyDNA: null,
    relevantProducts: products,
    relevantArticles: [],
    relevantDocuments: [],
    relevantBehaviors: [],
    handoverRules: [],
    replyStyle: null,
    qualificationRules: null,
    retrievalSummary: {
      intent: "PACKAGE_INQUIRY",
      matchedKeywords: [],
      productCount: products.length,
      articleCount: 0,
      documentCount: 0,
      behaviorCount: 0,
    },
  };
}

function makePlanningInput(overrides: Partial<NormalizedPlanningInput> = {}): NormalizedPlanningInput {
  const products = [...makeChinaProducts(), makeKoreaProduct(), makeJapanProduct()];
  return {
    workspaceId: WORKSPACE_ID,
    mode: "playground",
    latestMessage: "Pengen jalan-jalan ke China nih, ada paketnya?",
    recentHistory: [],
    intent: "PACKAGE_INQUIRY",
    conversationState: {
      greetingSent: true,
      collectedInformation: {},
      questionsAsked: [],
      selectedEntity: null,
      catalogContext: null,
      currentIntent: null,
      handoffRequested: false,
    },
    conversationStateContext: null,
    publishedBusinessBrain: makeBrain(products),
    retrievedContext: makeRetrieved(products),
    customerContext: { memory: {}, qualification: null },
    includeDraft: false,
    timezone: "Asia/Jakarta",
    ...overrides,
  };
}

function makeScoreResult(aiReply: string) {
  return {
    preview: {
      aiReply,
      confidence: 0.9,
      handoffRequired: false,
      handoffReason: null,
      suggestedActions: [],
      usedSources: [],
      sourceLabels: ["product"],
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
      intent: "PACKAGE_INQUIRY",
      matchedKeywords: [],
      productCount: 3,
      articleCount: 0,
      documentCount: 0,
      behaviorCount: 0,
    },
    customerMemory: emptyPlaygroundMemory,
    customerMemoryUsed: [],
    leadQualification: emptyLeadQualification,
  };
}

describe("AI-003.1D playground turn integration", () => {
  it("1. China query delivery excludes Korea from planner-authoritative reply", () => {
    const products = [...makeChinaProducts(), makeKoreaProduct()];
    const badLlmReply =
      "Tentu Kak! Ada Furongzhen Chongqing Zhangjiajie dan Lite Korea South Korea Muslim Friendly Tour.";
    const delivery = processPlaygroundTurnDelivery({
      planningInput: makePlanningInput({
        latestMessage: "Pengen jalan-jalan ke China nih, ada paketnya?",
        publishedBusinessBrain: makeBrain(products),
        retrievedContext: makeRetrieved(products),
      }),
      rawLlmReply: badLlmReply,
      products,
      sessionId: SESSION_ID,
    });

    assert.equal(delivery.responsePlan.requestType, "DESTINATION_DISCOVERY");
    assert.ok(!delivery.finalReply.toLowerCase().includes("korea"));
    assert.ok(delivery.deterministicFallbackUsed);
    assert.ok(delivery.catalogEntityIdsDelivered.every((id) => id !== "prod-korea-seoul"));
    assert.equal(delivery.runtimeVersions.responsePlannerVersion, RUNTIME_VERSIONS.responsePlannerVersion);
  });

  it("2. Yunnan query does not present Furongzhen in final reply", () => {
    const products = makeChinaProducts();
    const delivery = processPlaygroundTurnDelivery({
      planningInput: makePlanningInput({
        latestMessage: "Mau ke Yunnan",
        publishedBusinessBrain: makeBrain(products),
        retrievedContext: makeRetrieved(products),
      }),
      rawLlmReply: "Ada Furongzhen Chongqing Zhangjiajie Muslim Friendly Tour ke Yunnan.",
      products,
      sessionId: SESSION_ID,
    });

    assert.ok(
      delivery.responsePlan.catalogResults.every((item) => item.entityId === "prod-yunnan-1"),
    );
    assert.ok(!delivery.finalReply.includes("Furongzhen"));
  });

  it("3. second turn price uses PRICE request type, not stale discovery", () => {
    const products = makeChinaProducts();
    const catalogPlan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "Pengen jalan-jalan ke China nih, ada paketnya?",
        publishedBusinessBrain: makeBrain(products),
        retrievedContext: makeRetrieved(products),
      }),
    );
    const session = updatePlaygroundSessionAfterReply({
      session: { workspaceId: WORKSPACE_ID, sessionId: SESSION_ID, ...EMPTY_PLAYGROUND_CONVERSATION_STATE },
      intent: "PACKAGE_INQUIRY",
      replyText: catalogPlan.directAnswerTemplate ?? "",
      responsePlan: catalogPlan,
      usePlanQuestionKeys: true,
    });

    const pricePlan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "Harganya berapa?",
        intent: "PRICE_INQUIRY",
        publishedBusinessBrain: makeBrain(products),
        retrievedContext: makeRetrieved(products),
        conversationState: {
          greetingSent: true,
          collectedInformation: {},
          questionsAsked: [],
          selectedEntity: session.selectedEntity,
          catalogContext: session.catalogContext,
          currentIntent: session.currentIntent,
          handoffRequested: false,
        },
      }),
    );

    assert.equal(pricePlan.requestType, "PRICE");
    assert.notEqual(pricePlan.requestType, "DESTINATION_DISCOVERY");
  });

  it("4. Japan request overrides prior Furongzhen selection", () => {
    const products = [...makeChinaProducts(), makeJapanProduct()];
    const furongzhenEntity = {
      entityId: "prod-zhangjiajie",
      entityType: "product" as const,
      displayName: "Furongzhen Chongqing Zhangjiajie Muslim Friendly Tour",
      selectionSource: "explicit_latest_message" as const,
      selectedAt: new Date().toISOString(),
    };
    const delivery = processPlaygroundTurnDelivery({
      planningInput: makePlanningInput({
        latestMessage: "Kalau Japan Muslim Friendly Tour ada ga ka?",
        publishedBusinessBrain: makeBrain(products),
        retrievedContext: makeRetrieved(products),
        conversationState: {
          greetingSent: true,
          collectedInformation: {},
          questionsAsked: [],
          selectedEntity: furongzhenEntity,
          catalogContext: null,
          currentIntent: "PRICE_INQUIRY",
          handoffRequested: false,
        },
      }),
      rawLlmReply: "Untuk Furongzhen harganya Rp17.200.000.",
      products,
      sessionId: SESSION_ID,
    });

    assert.equal(delivery.responsePlan.selectedEntity?.entityId, "prod-japan-golden");
    assert.ok(!delivery.finalReply.toLowerCase().includes("furongzhen"));
    assert.ok(delivery.responsePlan.turn.selectionOverrideReason != null);
  });

  it("5. schedule turn classifies as SCHEDULE_OR_DEPARTURE with dates or handoff", () => {
    const products = [makeJapanProduct()];
    const selected = {
      entityId: "prod-japan-golden",
      entityType: "product" as const,
      displayName: products[0].name,
      selectionSource: "explicit_latest_message" as const,
      selectedAt: new Date().toISOString(),
    };
    const delivery = processPlaygroundTurnDelivery({
      planningInput: makePlanningInput({
        latestMessage: "4 orang. Rencananya bulan depan, ada keberangkatan kapan aja?",
        publishedBusinessBrain: makeBrain(products),
        retrievedContext: makeRetrieved(products),
        conversationState: {
          greetingSent: true,
          collectedInformation: {},
          questionsAsked: [],
          selectedEntity: selected,
          catalogContext: null,
          currentIntent: "PRICE_INQUIRY",
          handoffRequested: false,
        },
      }),
      rawLlmReply: "Ada beberapa jadwal bulan depan. Budget berapa?",
      products,
      sessionId: SESSION_ID,
    });

    assert.equal(delivery.responsePlan.requestType, "SCHEDULE_OR_DEPARTURE");
    assert.ok(!delivery.finalReply.toLowerCase().includes("budget"));
    assert.ok(
      delivery.finalReply.includes("Agustus") ||
        delivery.finalReply.toLowerCase().includes("belum menemukan"),
    );
  });

  it("6. geographic confirmation answers directly with bukan in template", () => {
    const products = makeChinaProducts();
    const selected = {
      entityId: "prod-zhangjiajie",
      entityType: "product" as const,
      displayName: products[1].name,
      selectionSource: "explicit_latest_message" as const,
      selectedAt: new Date().toISOString(),
    };
    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "Emang itu di Yunnan?",
        publishedBusinessBrain: makeBrain(products),
        retrievedContext: makeRetrieved(products),
        conversationState: {
          greetingSent: true,
          collectedInformation: {},
          questionsAsked: [],
          selectedEntity: selected,
          catalogContext: null,
          currentIntent: null,
          handoffRequested: false,
        },
      }),
    );

    assert.equal(resolveCustomerRequestType("Emang itu di Yunnan?", "GENERAL"), "GEOGRAPHIC_CONFIRMATION");
    assert.equal(plan.requestType, "GEOGRAPHIC_CONFIRMATION");
    assert.match(plan.directAnswerTemplate ?? "", /bukan/i);
    assert.match(plan.directAnswerTemplate ?? "", /yunnan/i);
  });

  it("7. reset clears selected entity through session adapter", () => {
    const session = updatePlaygroundSessionAfterReply({
      session: { workspaceId: WORKSPACE_ID, sessionId: SESSION_ID, ...EMPTY_PLAYGROUND_CONVERSATION_STATE },
      intent: "PACKAGE_INQUIRY",
      replyText: "ok",
      responsePlan: buildResponsePlan(makePlanningInput()),
      usePlanQuestionKeys: true,
    });
    assert.ok(session.selectedEntity || session.catalogContext);

    const resetSession = { workspaceId: WORKSPACE_ID, sessionId: SESSION_ID, ...EMPTY_PLAYGROUND_CONVERSATION_STATE };
    assert.equal(resetSession.selectedEntity, null);
    assert.equal(resetSession.lastTurnId, null);
  });

  it("8. two sequential turns receive different turn IDs", () => {
    const products = makeChinaProducts();
    const firstTurn = processPlaygroundTurnDelivery({
      planningInput: makePlanningInput({
        latestMessage: "Pengen jalan-jalan ke China nih, ada paketnya?",
        publishedBusinessBrain: makeBrain(products),
        retrievedContext: makeRetrieved(products),
      }),
      rawLlmReply: "China packages available.",
      products,
      sessionId: SESSION_ID,
    });

    const secondTurn = processPlaygroundTurnDelivery({
      planningInput: makePlanningInput({
        latestMessage: "Harganya berapa?",
        intent: "PRICE_INQUIRY",
        publishedBusinessBrain: makeBrain(products),
        retrievedContext: makeRetrieved(products),
        conversationState: {
          greetingSent: true,
          collectedInformation: {},
          questionsAsked: [],
          selectedEntity: null,
          catalogContext: firstTurn.responsePlan.catalogContext,
          currentIntent: "PACKAGE_INQUIRY",
          handoffRequested: false,
        },
      }),
      rawLlmReply: "Harga mulai Rp15.500.000.",
      products,
      sessionId: SESSION_ID,
      previousTurnId: firstTurn.responsePlan.turn.turnId,
    });

    assert.notEqual(firstTurn.responsePlan.turn.turnId, secondTurn.responsePlan.turn.turnId);
    assert.equal(secondTurn.responsePlan.turn.previousTurnId, firstTurn.responsePlan.turn.turnId);
  });

  it("9. unplanned entity in raw LLM reply is rejected from final delivery", () => {
    const products = makeChinaProducts();
    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "Mau ke Yunnan",
        publishedBusinessBrain: makeBrain(products),
        retrievedContext: makeRetrieved(products),
      }),
    );
    const validated = applyValidatedReply({
      rawReply: "Coba Furongzhen Chongqing Zhangjiajie Muslim Friendly Tour untuk Yunnan.",
      plan,
      answerFirstEnabled: true,
      products,
    });

    assert.ok(validated.deterministicFallbackUsed);
    assert.ok(validated.unplannedEntityIdsDetected.includes("prod-zhangjiajie"));
    assert.ok(!validated.finalReply.includes("Furongzhen"));
  });

  it("10. runtime version markers appear in delivery result", () => {
    const delivery = processPlaygroundTurnDelivery({
      planningInput: makePlanningInput(),
      rawLlmReply: "ok",
      products: makeChinaProducts(),
      sessionId: SESSION_ID,
    });

    assert.equal(
      delivery.responsePlan.turn.runtimeVersions.responsePlannerVersion,
      RUNTIME_VERSIONS.responsePlannerVersion,
    );
    assert.equal(
      delivery.responsePlan.turn.runtimeVersions.geographicEligibilityVersion,
      RUNTIME_VERSIONS.geographicEligibilityVersion,
    );
    assert.equal(
      delivery.responsePlan.turn.runtimeVersions.catalogValidatorVersion,
      RUNTIME_VERSIONS.catalogValidatorVersion,
    );
    assert.equal(delivery.runtimeVersions.playgroundScorerVersion, RUNTIME_VERSIONS.playgroundScorerVersion);
  });

  it("11. score turn pairing keeps turnId aligned and staleTurnDetected false", () => {
    const products = makeChinaProducts();
    const delivery = processPlaygroundTurnDelivery({
      planningInput: makePlanningInput({
        publishedBusinessBrain: makeBrain(products),
        retrievedContext: makeRetrieved(products),
      }),
      rawLlmReply: "China packages available.",
      products,
      sessionId: SESSION_ID,
    });

    const score = calculatePlaygroundAiScore({
      result: makeScoreResult(delivery.finalReply),
      customerMessage: "Pengen jalan-jalan ke China nih, ada paketnya?",
      conversationHistory: [],
      responsePlan: delivery.responsePlan,
      planValidation: delivery.planValidation,
      rawPlanValidation: delivery.rawValidation,
      products,
      turnId: delivery.responsePlan.turn.turnId,
    });

    assert.equal(score.groundingDiagnostics?.turnId, delivery.responsePlan.turn.turnId);
    assert.equal(score.groundingDiagnostics?.staleTurnDetected, false);
  });
});
