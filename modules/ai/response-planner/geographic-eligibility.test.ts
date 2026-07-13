import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildResponsePlan } from "@/modules/ai/response-planner/build-response-plan";
import { buildCatalogResults } from "@/modules/ai/response-planner/resolve-catalog";
import {
  filterProductsForCountryScope,
  filterProductsForDestinationScope,
  isProductEligibleForCountryQuery,
  isProductEligibleForDestinationQuery,
} from "@/modules/ai/response-planner/geographic-eligibility";
import { findProductTitleMatch } from "@/modules/ai/response-planner/resolve-product-title-match";
import { validateResponseAgainstPlan } from "@/modules/ai/response-planner/validate-response-plan";
import { calculatePlaygroundAiScore } from "@/modules/business-brain/lib/calculate-playground-ai-score";
import { leadQualificationService } from "@/modules/ai/services/lead-qualification-service";
import { promptItemsToPlaygroundMemoryDisplay } from "@/modules/ai/types/memory";
import { EMPTY_BUSINESS_BRAIN_CONTEXT } from "@/modules/business-brain/types/context";
import { DEFAULT_COMMUNICATION_STYLE } from "@/modules/business-brain/types/company-dna";
import type { BusinessBrainContext, ProductContext } from "@/modules/business-brain/types/context";
import type { RetrievedBusinessBrainContext } from "@/modules/ai/types/context-retrieval";
import type { NormalizedPlanningInput } from "@/modules/ai/response-planner/types";

const WORKSPACE_ID = "ws-geo-eligibility";
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
      name: "ZHANGJIAJIE CHONGQING FURONGZHEN",
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
    name: "Korea Seoul Busan 7D5N",
    category: "International Tour",
    destination: "Korea",
    description: "",
    highlights: ["Seoul", "Busan"],
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
    highlights: ["Narita", "Tokyo", "Shirakawago", "Nagoya", "Brunei City Tour"],
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
    latestMessage: "pengen jalan jalan ke china nih, ada paketnya ga?",
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

describe("AI-003.1C geographic eligibility", () => {
  it("Case A: Yunnan query lists only Yunnan products", () => {
    const products = makeChinaProducts();
    const exact = filterProductsForDestinationScope(products, "yunnan", "exact");
    assert.equal(exact.eligible.length, 1);
    assert.equal(exact.eligible[0].id, "prod-yunnan-1");
    assert.ok(!exact.eligible.some((item) => item.id === "prod-zhangjiajie"));

    const catalog = buildCatalogResults({
      products,
      message: "Mau ke Yunnan",
      requestType: "DESTINATION_DISCOVERY",
    });
    assert.ok(catalog.exactResults.every((item) => item.entityId === "prod-yunnan-1"));
    assert.ok(!catalog.exactResults.some((item) => item.entityId === "prod-zhangjiajie"));
  });

  it("Case A: no Yunnan product offers China alternatives honestly", () => {
    const products = [makeChinaProducts()[1]];
    const catalog = buildCatalogResults({
      products,
      message: "mau ke yunnan",
      requestType: "DESTINATION_DISCOVERY",
    });
    assert.equal(catalog.exactResults.length, 0);
    assert.ok(catalog.alternativeResults.length > 0);
    assert.match(
      buildResponsePlan(
        makePlanningInput({
          latestMessage: "mau ke yunnan",
          publishedBusinessBrain: makeBrain(products),
          retrievedContext: makeRetrieved(products),
        }),
      ).directAnswerTemplate ?? "",
      /belum menemukan paket aktif khusus/i,
    );
  });

  it("Case B: China query excludes Korea and Japan products", () => {
    const products = [...makeChinaProducts(), makeKoreaProduct(), makeJapanProduct()];
    const scoped = filterProductsForCountryScope(products, "china");
    assert.ok(scoped.eligible.every((item) => isProductEligibleForCountryQuery(item, "china")));
    assert.ok(!scoped.eligible.some((item) => item.id === "prod-korea-seoul"));
    assert.ok(!scoped.eligible.some((item) => item.id === "prod-japan-golden"));

    const catalog = buildCatalogResults({
      products,
      message: "Pengen jalan-jalan ke China nih, ada paketnya?",
      requestType: "DESTINATION_DISCOVERY",
    });
    assert.ok(catalog.exactResults.every((item) => ["prod-yunnan-1", "prod-zhangjiajie"].includes(item.entityId)));
    assert.ok(!catalog.results.some((item) => item.entityId === "prod-korea-seoul"));
  });

  it("Case C: exact product title becomes PRODUCT_SELECTION with fact-first answer", () => {
    const product = makeJapanProduct();
    const match = findProductTitleMatch(product.name, [product]);
    assert.ok(match);
    assert.equal(match?.matchType, "exact_title");

    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: product.name,
        publishedBusinessBrain: makeBrain([product]),
        retrievedContext: makeRetrieved([product]),
      }),
    );
    assert.equal(plan.requestType, "PRODUCT_SELECTION");
    assert.equal(plan.selectedEntity?.entityId, product.id);
    assert.match(plan.directAnswerTemplate ?? "", /Japan Golden Route/i);
    assert.match(plan.directAnswerTemplate ?? "", /Harga/i);

    const factReply =
      "Tentu, Kak. Japan Golden Route Shirakawago + Brunei Muslim Friendly Tour adalah perjalanan dengan rute Narita, Tokyo, Shirakawago. Harga mulai Rp32.150.000 per orang. Kakak rencananya ingin berangkat kapan?";
    const validation = validateResponseAgainstPlan(factReply, plan, { products: [product] });
    assert.equal(validation.directAnswerPresent, true);
    assert.ok(!validation.violations.includes("missing_direct_answer"));

    const score = calculatePlaygroundAiScore({
      result: makeScoreResult(factReply),
      customerMessage: product.name,
      conversationHistory: [],
      responsePlan: plan,
      planValidation: validation,
      products: [product],
    });
    assert.ok(score.breakdown.groundedness >= 70);
    assert.ok(score.breakdown.answerRelevance >= 70);
  });

  it("Zhangjiajie-only product is not eligible for Yunnan destination scope", () => {
    const product = makeChinaProducts()[1];
    assert.equal(isProductEligibleForDestinationQuery(product, "yunnan"), false);
    assert.equal(isProductEligibleForDestinationQuery(makeChinaProducts()[0], "yunnan"), true);
  });
});
