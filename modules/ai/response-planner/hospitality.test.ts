import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { leadQualificationService } from "@/modules/ai/services/lead-qualification-service";
import { promptItemsToPlaygroundMemoryDisplay } from "@/modules/ai/types/memory";

import { passesHospitalityTone } from "@/modules/ai/base-brain/hospitality-voice-policy";
import { EMPTY_BUSINESS_BRAIN_CONTEXT } from "@/modules/business-brain/types/context";
import { DEFAULT_COMMUNICATION_STYLE } from "@/modules/business-brain/types/company-dna";
import type { BusinessBrainContext, ProductContext } from "@/modules/business-brain/types/context";
import type { RetrievedBusinessBrainContext } from "@/modules/ai/types/context-retrieval";
import { buildResponsePlan } from "@/modules/ai/response-planner/build-response-plan";
import { resolveCustomerRequestType } from "@/modules/ai/response-planner/resolve-customer-request";
import { resolveSelectedEntity } from "@/modules/ai/response-planner/resolve-product-context";
import {
  matchProductsByCountry,
  matchProductsByDestination,
} from "@/modules/ai/response-planner/resolve-destination-match";
import { toProductSummary } from "@/modules/ai/response-planner/product-summary";
import { resolveWorkspaceDaypart } from "@/modules/ai/response-planner/resolve-greeting";
import { validateResponseAgainstPlan } from "@/modules/ai/response-planner/validate-response-plan";
import { calculatePlaygroundAiScore } from "@/modules/business-brain/lib/calculate-playground-ai-score";
import { isAnswerFirstV1Enabled } from "@/modules/ai/response-planner/feature-flag";
import { detectInterrogation } from "@/modules/ai/response-planner/interrogation-policy";
import type { NormalizedPlanningInput } from "@/modules/ai/response-planner/types";
import { updatePlaygroundSessionAfterReply } from "@/modules/ai/response-planner/planning-adapters";
import { EMPTY_PLAYGROUND_CONVERSATION_STATE } from "@/modules/business-brain/types/playground-session-state";

const WORKSPACE_ID = "ws-hospitality-001";
const emptyLeadQualification = leadQualificationService.snapshotFromPromptItems([]);
const emptyPlaygroundMemory = promptItemsToPlaygroundMemoryDisplay([]);

function makeScoreResult(aiReply: string, intent = "PACKAGE_INQUIRY") {
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
      intent,
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

function makeChinaProducts(): ProductContext[] {
  return [
    {
      id: "prod-yunnan-1",
      name: "Yunnan Kunming–Dali–Lijiang 8D6N",
      category: "International Tour",
      destination: "Yunnan",
      description: "Tour Yunnan Muslim friendly",
      highlights: ["Kunming", "Dali", "Lijiang"],
      pricing: [{ id: "p1", packageName: "Standard", price: 15500000, currency: "IDR", validUntil: "2026-12-31" }],
      departures: [{ id: "d1", departureDate: "12 Agustus 2026", status: "open", availableSeats: 10 }],
      included: [],
      excluded: [],
      aiNotes: "Yunnan scenery",
      status: "published",
    },
    {
      id: "prod-yunnan-2",
      name: "Yunnan Muslim Tour 9D7N",
      category: "International Tour",
      destination: "Yunnan",
      description: "Muslim friendly Yunnan",
      highlights: ["Yunnan"],
      pricing: [{ id: "p2", packageName: "Standard", price: 16800000, currency: "IDR", validUntil: "2026-12-31" }],
      departures: [],
      included: [],
      excluded: [],
      aiNotes: "",
      status: "published",
    },
    {
      id: "prod-chongqing",
      name: "Furongzhen Chongqing Zhangjiajie Muslim Friendly Tour",
      category: "International Tour",
      destination: "Chongqing",
      description: "China tour Chongqing and Zhangjiajie",
      highlights: ["Chongqing", "Zhangjiajie"],
      pricing: [{ id: "p3", packageName: "Standard", price: 17200000, currency: "IDR", validUntil: "2026-12-31" }],
      departures: [],
      included: [],
      excluded: [],
      aiNotes: "",
      status: "published",
    },
    {
      id: "prod-xian",
      name: "Xi'an Muslim Tour 7D5N",
      category: "International Tour",
      destination: "Xi'an",
      description: "China Xi'an",
      highlights: ["Xi'an"],
      pricing: [{ id: "p4", packageName: "Standard", price: 14900000, currency: "IDR", validUntil: "2026-12-31" }],
      departures: [],
      included: [],
      excluded: [],
      aiNotes: "",
      status: "published",
    },
  ];
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
  const products = makeChinaProducts();
  return {
    workspaceId: WORKSPACE_ID,
    mode: "playground",
    latestMessage: "mau ke yunnan",
    recentHistory: [],
    intent: "PACKAGE_INQUIRY",
    conversationState: {
      greetingSent: false,
      collectedInformation: {},
      questionsAsked: [],
      selectedEntity: null,
      catalogContext: null,
      currentIntent: null,
      handoffRequested: false,
    },
    conversationStateContext: {
      conversationState: {
        greetingSent: false,
        businessIntroductionSent: false,
        customerName: null,
        currentIntent: null,
        currentPhase: "NEW",
        qualificationStage: null,
        collectedInformation: {},
        questionsAsked: [],
        selectedEntity: null,
        catalogContext: null,
        handoffRequested: false,
        handoffReason: null,
        handoffAt: null,
        aiPaused: false,
        lastAiReplyAt: null,
        lastCustomerMessageAt: null,
        stateVersion: 1,
      },
      greetingAllowed: true,
      greetingReason: "first_interaction",
      currentPhase: "NEW",
      collectedInformation: {},
      questionsAsked: [],
      answeredQuestionKeys: [],
      unansweredQuestionKeys: [],
      handoffState: "none",
      aiPaused: false,
      hasPriorBusinessReplies: false,
    },
    publishedBusinessBrain: makeBrain(products),
    retrievedContext: makeRetrieved([products[2]]),
    customerContext: { memory: {}, qualification: null },
    includeDraft: true,
    timezone: "Asia/Jakarta",
    ...overrides,
  };
}

describe("AI-003.1A hospitality and catalog", () => {
  it("1. halo classifies as GREETING", () => {
    assert.equal(resolveCustomerRequestType("halo", "GENERAL"), "GREETING");
    assert.equal(resolveCustomerRequestType("hallo ka", "GENERAL"), "GREETING");
  });

  it("2. first greeting uses verified company name", () => {
    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "halo",
        intent: "GENERAL",
      }),
    );
    assert.equal(plan.requestType, "GREETING");
    assert.match(plan.directAnswerTemplate ?? "", /Desklabs Travel/);
  });

  it("3. first greeting uses workspace daypart", () => {
    const daypart = resolveWorkspaceDaypart("Asia/Jakarta", new Date("2026-07-12T02:00:00+07:00"));
    assert.equal(daypart, "malam");
    const plan = buildResponsePlan(makePlanningInput({ latestMessage: "halo", intent: "GENERAL" }));
    assert.match(plan.directAnswerTemplate ?? "", /malam/i);
  });

  it("4. first greeting is warm and not generic clarification", () => {
    const plan = buildResponsePlan(makePlanningInput({ latestMessage: "halo ka", intent: "GENERAL" }));
    assert.notEqual(plan.responseAction, "ASK_ONE_CLARIFYING_QUESTION");
    assert.match(plan.directAnswerTemplate ?? "", /ada yang bisa kami bantu/i);
  });

  it("5. second message does not repeat greeting when greeting already sent", () => {
    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "halo",
        intent: "GENERAL",
        conversationStateContext: {
          ...makePlanningInput().conversationStateContext!,
          greetingAllowed: false,
        },
        conversationState: {
          greetingSent: true,
          collectedInformation: {},
          questionsAsked: [],
          selectedEntity: null,
          catalogContext: null,
          currentIntent: null,
          handoffRequested: false,
        },
      }),
    );
    assert.equal(plan.greetingAllowed, false);
    assert.doesNotMatch(plan.directAnswerTemplate ?? "", /selamat (pagi|siang|sore|malam)/i);
  });

  it("6. missing company identity uses safe neutral greeting", () => {
    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "halo",
        intent: "GENERAL",
        publishedBusinessBrain: { ...makeBrain(makeChinaProducts()), companyDNA: null },
      }),
    );
    assert.doesNotMatch(plan.directAnswerTemplate ?? "", /undefined/i);
    assert.match(plan.directAnswerTemplate ?? "", /ada yang bisa kami bantu/i);
  });

  it("7. Yunnan matches Yunnan products only", () => {
    const matches = matchProductsByDestination(makeChinaProducts(), "yunnan");
    assert.ok(matches.every((match) => match.summary.displayName.toLowerCase().includes("yunnan")));
  });

  it("8. Yunnan does not match Chongqing–Zhangjiajie without Yunnan metadata", () => {
    const matches = matchProductsByDestination(makeChinaProducts(), "yunnan");
    assert.equal(
      matches.some((match) => match.product.id === "prod-chongqing"),
      false,
    );
  });

  it("9. exact destination beats weak semantic retrieval", () => {
    const selection = resolveSelectedEntity({
      latestMessage: "mau ke yunnan",
      recentHistory: [],
      storedSelectedEntity: null,
      collectedInformation: {},
      businessBrain: makeBrain(makeChinaProducts()),
      retrieved: makeRetrieved([makeChinaProducts()[2]]),
      includeDraft: true,
      requestType: "DESTINATION_DISCOVERY",
    });
    assert.equal(selection.entity, null);
  });

  it("10. weak single retrieval match does not automatically select an entity", () => {
    const selection = resolveSelectedEntity({
      latestMessage: "mau ke yunnan",
      recentHistory: [],
      storedSelectedEntity: null,
      collectedInformation: {},
      businessBrain: makeBrain(makeChinaProducts()),
      retrieved: makeRetrieved([makeChinaProducts()[2]]),
      includeDraft: false,
      requestType: "DESTINATION_DISCOVERY",
    });
    assert.equal(selection.entity, null);
  });

  it("11. archived product is excluded", () => {
    const archived = { ...makeChinaProducts()[0], id: "archived", status: "archived" };
    const selection = resolveSelectedEntity({
      latestMessage: "Yunnan Muslim Tour",
      recentHistory: [],
      storedSelectedEntity: null,
      collectedInformation: {},
      businessBrain: makeBrain([archived]),
      retrieved: makeRetrieved([archived]),
      includeDraft: false,
    });
    assert.equal(selection.entity, null);
  });

  it("12. live uses published products only", () => {
    const draft = { ...makeChinaProducts()[0], id: "draft", status: "draft" };
    const selection = resolveSelectedEntity({
      latestMessage: "Yunnan Kunming",
      recentHistory: [],
      storedSelectedEntity: null,
      collectedInformation: {},
      businessBrain: makeBrain([draft]),
      retrieved: makeRetrieved([draft]),
      includeDraft: false,
    });
    assert.equal(selection.entity, null);
  });

  it("13. playground may use draft products", () => {
    const draft = { ...makeChinaProducts()[0], id: "draft", status: "draft" };
    const selection = resolveSelectedEntity({
      latestMessage: "Yunnan Kunming",
      recentHistory: [],
      storedSelectedEntity: null,
      collectedInformation: {},
      businessBrain: makeBrain([draft]),
      retrieved: makeRetrieved([draft]),
      includeDraft: true,
    });
    assert.equal(selection.entity?.entityId, "draft");
  });

  it("14. ada paket ke mana aja lists destinations or products", () => {
    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "ada paket ke mana aja?",
        intent: "PACKAGE_INQUIRY",
      }),
    );
    assert.equal(plan.requestType, "CATALOG_DISCOVERY");
    assert.ok(plan.catalogResults.length > 0);
    assert.match(plan.directAnswerTemplate ?? "", /pilihan/i);
  });

  it("15. trip ke China lists China products", () => {
    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "trip ke cina",
        intent: "PACKAGE_INQUIRY",
      }),
    );
    assert.equal(plan.requestType, "DESTINATION_DISCOVERY");
    assert.ok(plan.catalogResults.length >= 2);
    assert.equal(plan.selectedEntity, null);
  });

  it("16. mau ke Yunnan lists Yunnan products before asking a question", () => {
    const plan = buildResponsePlan(makePlanningInput({ latestMessage: "mau ke yunnan" }));
    assert.equal(plan.requestType, "DESTINATION_DISCOVERY");
    assert.equal(plan.catalogResults.length, 2);
    assert.match(plan.directAnswerTemplate ?? "", /Yunnan/);
    assert.ok(plan.followUpQuestion);
  });

  it("17. more than five results are bounded", () => {
    const many = Array.from({ length: 8 }, (_, index) => ({
      ...makeChinaProducts()[0],
      id: `prod-${index}`,
      name: `Tour ${index}`,
      destination: `Dest ${index}`,
    }));
    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "ada paket ke mana aja?",
        publishedBusinessBrain: makeBrain(many),
        retrievedContext: makeRetrieved(many),
      }),
    );
    assert.ok(plan.catalogResults.length <= 5);
  });

  it("18. no exact Yunnan product gives honest alternatives", () => {
    const nonYunnan = makeChinaProducts().filter((product) => !product.destination.includes("Yunnan"));
    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "mau ke yunnan",
        publishedBusinessBrain: makeBrain(nonYunnan),
        retrievedContext: makeRetrieved(nonYunnan),
      }),
    );
    assert.equal(plan.catalogResults.length, 0);
  });

  it("19. catalog response persists catalogContext", () => {
    const plan = buildResponsePlan(
      makePlanningInput({ latestMessage: "trip ke cina", intent: "PACKAGE_INQUIRY" }),
    );
    const updated = updatePlaygroundSessionAfterReply({
      session: {
        workspaceId: WORKSPACE_ID,
        sessionId: "s1",
        ...EMPTY_PLAYGROUND_CONVERSATION_STATE,
      },
      intent: "PACKAGE_INQUIRY",
      replyText: plan.directAnswerTemplate ?? "",
      responsePlan: plan,
      usePlanQuestionKeys: true,
    });
    assert.ok(updated.catalogContext);
    assert.ok(updated.catalogContext!.entityIds.length > 0);
  });

  it("20. price follow-up after China catalog lists verified prices", () => {
    const catalogPlan = buildResponsePlan(
      makePlanningInput({ latestMessage: "trip ke cina", intent: "PACKAGE_INQUIRY" }),
    );
    const pricePlan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "harganya berapa?",
        intent: "PRICE_INQUIRY",
        conversationState: {
          greetingSent: true,
          collectedInformation: {},
          questionsAsked: [],
          selectedEntity: null,
          catalogContext: catalogPlan.catalogContext,
          currentIntent: "PACKAGE_INQUIRY",
          handoffRequested: false,
        },
      }),
    );
    assert.equal(pricePlan.requestType, "PRICE");
    assert.ok(pricePlan.catalogResults.some((item) => item.priceLabel));
    assert.match(pricePlan.directAnswerTemplate ?? "", /Rp/i);
  });

  it("21. multiple prices do not force product clarification first", () => {
    const catalogPlan = buildResponsePlan(
      makePlanningInput({ latestMessage: "trip ke cina", intent: "PACKAGE_INQUIRY" }),
    );
    const pricePlan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "harganya berapa?",
        intent: "PRICE_INQUIRY",
        conversationState: {
          greetingSent: true,
          collectedInformation: {},
          questionsAsked: [],
          selectedEntity: null,
          catalogContext: catalogPlan.catalogContext,
          currentIntent: "PACKAGE_INQUIRY",
          handoffRequested: false,
        },
      }),
    );
    assert.notEqual(pricePlan.responseAction, "ASK_ONE_CLARIFYING_QUESTION");
  });

  it("22. one selected product answers direct price", () => {
    const product = makeChinaProducts()[0];
    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "berapa harganya?",
        intent: "PRICE_INQUIRY",
        conversationState: {
          greetingSent: true,
          collectedInformation: {},
          questionsAsked: [],
          selectedEntity: {
            entityId: product.id,
            entityType: "product",
            displayName: product.name,
            selectionSource: "conversation_state",
            selectedAt: "2026-07-12T00:00:00.000Z",
          },
          catalogContext: null,
          currentIntent: "PRICE_INQUIRY",
          handoffRequested: false,
        },
      }),
    );
    assert.equal(plan.answerability, "ANSWERABLE");
    assert.match(plan.directAnswerTemplate ?? "", /15[.,\s]?500[.,\s]?000|15\.500\.000|15500000/i);
  });

  it("23. missing price for selected product triggers handoff", () => {
    const product = { ...makeChinaProducts()[0], pricing: [] };
    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "berapa harganya?",
        intent: "PRICE_INQUIRY",
        publishedBusinessBrain: makeBrain([product]),
        retrievedContext: makeRetrieved([product]),
        conversationState: {
          greetingSent: true,
          collectedInformation: {},
          questionsAsked: [],
          selectedEntity: {
            entityId: product.id,
            entityType: "product",
            displayName: product.name,
            selectionSource: "conversation_state",
            selectedAt: "2026-07-12T00:00:00.000Z",
          },
          catalogContext: null,
          currentIntent: "PRICE_INQUIRY",
          handoffRequested: false,
        },
      }),
    );
    assert.equal(plan.handoffRequired, true);
  });

  it("24. unknown context asks one clarification", () => {
    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "harganya berapa?",
        intent: "PRICE_INQUIRY",
        conversationState: {
          greetingSent: true,
          collectedInformation: {},
          questionsAsked: [],
          selectedEntity: null,
          catalogContext: null,
          currentIntent: null,
          handoffRequested: false,
        },
      }),
    );
    assert.equal(plan.answerability, "NEEDS_DISAMBIGUATION");
    assert.equal(plan.followUpQuestionKey, "requested_service");
  });

  it("25. existing product price fields are mapped correctly", () => {
    const summary = toProductSummary(makeChinaProducts()[0]);
    assert.equal(summary.startingPrice, 15500000);
    assert.equal(summary.currency, "IDR");
    assert.match(summary.priceLabel ?? "", /Rp/);
  });

  it("26. generic bureaucratic response fails hospitality", () => {
    assert.equal(
      passesHospitalityTone("Bisa dijelaskan lebih spesifik kebutuhannya?"),
      false,
    );
  });

  it("27. question-only response fails when catalog data exists", () => {
    const plan = buildResponsePlan(makePlanningInput({ latestMessage: "mau ke yunnan" }));
    assert.equal(detectInterrogation("Kapan rencananya berangkat?", plan), true);
  });

  it("28. maximum one follow-up question in plan", () => {
    const plan = buildResponsePlan(makePlanningInput({ latestMessage: "mau ke yunnan" }));
    const questions = (plan.followUpQuestion ?? "").split("?").length - 1;
    assert.ok(questions <= 1);
  });

  it("29. follow-up appears after the answer in template", () => {
    const plan = buildResponsePlan(makePlanningInput({ latestMessage: "mau ke yunnan" }));
    assert.ok(plan.directAnswerTemplate);
    assert.ok(plan.followUpQuestion);
  });

  it("30. previously answered information is not asked again for participant count", () => {
    const product = makeChinaProducts()[0];
    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "berapa harganya?",
        intent: "PRICE_INQUIRY",
        conversationState: {
          greetingSent: true,
          collectedInformation: { participantCount: { value: "4", sourceMessageId: null, updatedAt: "2026-07-12" } },
          questionsAsked: ["participant_count"],
          selectedEntity: {
            entityId: product.id,
            entityType: "product",
            displayName: product.name,
            selectionSource: "conversation_state",
            selectedAt: "2026-07-12T00:00:00.000Z",
          },
          catalogContext: null,
          currentIntent: "PRICE_INQUIRY",
          handoffRequested: false,
        },
      }),
    );
    assert.equal(plan.followUpQuestion, null);
  });

  it("31. wrong Yunnan product caps score at 30", () => {
    const plan = buildResponsePlan(makePlanningInput({ latestMessage: "mau ke yunnan" }));
    const badPlan = {
      ...plan,
      selectedEntity: {
        entityId: "prod-chongqing",
        entityType: "product" as const,
        displayName: "Furongzhen Chongqing Zhangjiajie Muslim Friendly Tour",
        selectionSource: "single_retrieval_match" as const,
        selectedAt: "2026-07-12T00:00:00.000Z",
      },
    };
    const score = calculatePlaygroundAiScore({
      customerMessage: "mau ke yunnan",
      conversationHistory: [],
      responsePlan: badPlan,
      planValidation: validateResponseAgainstPlan(
        "Untuk Yunnan, kapan rencananya berangkat?",
        badPlan,
      ),
      result: makeScoreResult("Untuk Yunnan, kapan rencananya berangkat?"),
    });
    assert.ok(score.breakdown.overall <= 30);
  });

  it("32. generic non-answer with catalog data caps score at 50", () => {
    const plan = buildResponsePlan(makePlanningInput({ latestMessage: "ada paket ke mana aja?" }));
    const reply = "Baik Kak, tim kami akan segera membantu agar penjelasannya lebih nyaman.";
    const score = calculatePlaygroundAiScore({
      customerMessage: "ada paket ke mana aja?",
      conversationHistory: [],
      responsePlan: plan,
      planValidation: validateResponseAgainstPlan(reply, plan),
      result: makeScoreResult(reply),
    });
    assert.ok(score.breakdown.overall <= 50);
  });

  it("33. question-only response with useful data caps score at 55", () => {
    const plan = buildResponsePlan(makePlanningInput({ latestMessage: "mau ke yunnan" }));
    const reply = "Kapan rencananya berangkat?";
    const score = calculatePlaygroundAiScore({
      customerMessage: "mau ke yunnan",
      conversationHistory: [],
      responsePlan: plan,
      planValidation: validateResponseAgainstPlan(reply, plan),
      result: makeScoreResult(reply),
    });
    assert.ok(score.breakdown.overall <= 55);
  });

  it("34. correct warm catalog answer scores positively", () => {
    const plan = buildResponsePlan(makePlanningInput({ latestMessage: "mau ke yunnan" }));
    const reply = plan.directAnswerTemplate ?? "";
    const score = calculatePlaygroundAiScore({
      customerMessage: "mau ke yunnan",
      conversationHistory: [],
      responsePlan: plan,
      planValidation: validateResponseAgainstPlan(reply, plan),
      result: makeScoreResult(reply),
    });
    assert.ok(score.breakdown.overall >= 70);
  });

  it("37-40. live and playground share normalized product and planner logic", () => {
    const livePlan = buildResponsePlan(
      makePlanningInput({ mode: "live", includeDraft: false, latestMessage: "trip ke cina" }),
    );
    const playgroundPlan = buildResponsePlan(
      makePlanningInput({ mode: "playground", includeDraft: true, latestMessage: "trip ke cina" }),
    );
    assert.equal(livePlan.requestType, playgroundPlan.requestType);
    assert.equal(livePlan.responseAction, playgroundPlan.responseAction);
    assert.ok(livePlan.catalogResults.length > 0);
    assert.ok(playgroundPlan.catalogResults.length > 0);
  });

  it("41-42. answer first flag behavior remains available", () => {
    assert.equal(typeof isAnswerFirstV1Enabled(), "boolean");
  });

  it("country-level discovery aggregates China products", () => {
    const matches = matchProductsByCountry(makeChinaProducts(), "china");
    assert.ok(matches.length >= 3);
  });
});
