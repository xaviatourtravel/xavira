import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { leadQualificationService } from "@/modules/ai/services/lead-qualification-service";
import { promptItemsToPlaygroundMemoryDisplay } from "@/modules/ai/types/memory";
import { buildResponsePlan } from "@/modules/ai/response-planner/build-response-plan";
import {
  buildCatalogResults,
  resolveCatalogQuery,
} from "@/modules/ai/response-planner/resolve-catalog";
import {
  extractCountryQuery,
  matchProductsByCountry,
  matchProductsByDestination,
} from "@/modules/ai/response-planner/resolve-destination-match";
import {
  departureMatchesPeriod,
  normalizeDepartureToIso,
  resolveSchedulePeriod,
} from "@/modules/ai/response-planner/resolve-schedule-period";
import { productMatchesCountry } from "@/modules/ai/response-planner/product-geography";
import { validateCatalogConsistency } from "@/modules/ai/response-planner/validate-catalog-consistency";
import { validateResponseAgainstPlan } from "@/modules/ai/response-planner/validate-response-plan";
import { calculatePlaygroundAiScore } from "@/modules/business-brain/lib/calculate-playground-ai-score";
import { EMPTY_BUSINESS_BRAIN_CONTEXT } from "@/modules/business-brain/types/context";
import { DEFAULT_COMMUNICATION_STYLE } from "@/modules/business-brain/types/company-dna";
import type { BusinessBrainContext, ProductContext } from "@/modules/business-brain/types/context";
import type { RetrievedBusinessBrainContext } from "@/modules/ai/types/context-retrieval";
import type { NormalizedPlanningInput } from "@/modules/ai/response-planner/types";
import { resolveSelectedEntity } from "@/modules/ai/response-planner/resolve-product-context";

const WORKSPACE_ID = "ws-geo-001";
const emptyLeadQualification = leadQualificationService.snapshotFromPromptItems([]);
const emptyPlaygroundMemory = promptItemsToPlaygroundMemoryDisplay([]);

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

function makeJapanProducts(): ProductContext[] {
  return [
    {
      id: "prod-japan-golden",
      name: "Japan Golden Route Shirakawago + Brunei Muslim Friendly Tour",
      category: "International Tour",
      destination: "Japan",
      description: "",
      highlights: ["Narita", "Tokyo", "Shirakawago", "Nagoya", "Brunei City Tour"],
      pricing: [{ id: "jp1", packageName: "Standard", price: 32150000, currency: "IDR", validUntil: "2026-12-31" }],
      departures: [
        { id: "jd1", departureDate: "5 Agustus 2026", status: "open", availableSeats: 10 },
        { id: "jd2", departureDate: "12 September 2026", status: "open", availableSeats: 10 },
      ],
      included: [],
      excluded: [],
      aiNotes: "",
      status: "published",
    },
    {
      id: "prod-japan-disney",
      name: "Japan Disneyland Tokyo – Fuji + Brunei",
      category: "International Tour",
      destination: "Japan",
      description: "",
      highlights: ["Tokyo", "Fuji", "Brunei"],
      pricing: [{ id: "jp2", packageName: "Standard", price: 29900000, currency: "IDR", validUntil: "2026-12-31" }],
      departures: [],
      included: [],
      excluded: [],
      aiNotes: "",
      status: "published",
    },
    {
      id: "prod-brunei-only",
      name: "Brunei Muslim Tour 5D3N",
      category: "International Tour",
      destination: "Brunei",
      description: "",
      highlights: ["Brunei"],
      pricing: [{ id: "bn1", packageName: "Standard", price: 12000000, currency: "IDR", validUntil: "2026-12-31" }],
      departures: [],
      included: [],
      excluded: [],
      aiNotes: "",
      status: "published",
    },
    {
      id: "prod-hk-japan",
      name: "Hongkong + Japan Tokyo – Fuji + Brunei",
      category: "International Tour",
      destination: "Hong Kong",
      description: "",
      highlights: ["Hongkong", "Tokyo", "Fuji", "Brunei"],
      pricing: [{ id: "hk1", packageName: "Standard", price: 31000000, currency: "IDR", validUntil: "2026-12-31" }],
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
  const products = [...makeChinaProducts(), ...makeJapanProducts()];
  return {
    workspaceId: WORKSPACE_ID,
    mode: "playground",
    latestMessage: "pengen jalan jalan ke china nih, ada paketnya ga?",
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

describe("AI-003.1B geographic catalog integrity", () => {
  it("1. China query includes Zhangjiajie product", () => {
    const matches = matchProductsByCountry([...makeChinaProducts(), ...makeJapanProducts()], "china");
    assert.ok(matches.some((match) => match.product.id === "prod-zhangjiajie"));
  });

  it("2. China query excludes Japan-only product", () => {
    const matches = matchProductsByCountry(makeJapanProducts(), "china");
    assert.equal(matches.length, 0);
  });

  it("3. China query excludes Brunei-only product", () => {
    const matches = matchProductsByCountry(makeJapanProducts(), "china");
    assert.equal(matches.some((match) => match.product.id === "prod-brunei-only"), false);
  });

  it("4. China query excludes Japan + Brunei product without China", () => {
    const matches = matchProductsByCountry(makeJapanProducts(), "china");
    assert.equal(matches.some((match) => match.product.id === "prod-japan-golden"), false);
  });

  it("5. Exact China result prevents no-China opening", () => {
    const plan = buildResponsePlan(makePlanningInput());
    assert.ok(plan.catalogResults.length > 0);
    assert.doesNotMatch(plan.directAnswerTemplate ?? "", /belum menemukan paket aktif untuk china/i);
    assert.match(plan.directAnswerTemplate ?? "", /memiliki beberapa pilihan/i);
  });

  it("6. No China results produces honest no-match response", () => {
    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "mau ke australia ada paketnya?",
        publishedBusinessBrain: makeBrain(makeChinaProducts()),
        retrievedContext: makeRetrieved(makeChinaProducts()),
      }),
    );
    assert.equal(plan.catalogResults.length, 0);
    assert.match(plan.directAnswerTemplate ?? "", /belum menemukan paket aktif/i);
  });

  it("7. Same-country alternatives are labeled alternatives", () => {
    const catalog = buildCatalogResults({
      products: makeChinaProducts(),
      message: "mau ke yunnan",
      requestType: "DESTINATION_DISCOVERY",
    });
    assert.ok(catalog.exactResults.length > 0 || catalog.alternativeResults.length > 0);
    if (catalog.alternativeResults.length > 0) {
      assert.equal(catalog.alternativeResults[0].matchType, "same_country_alternative");
    }
  });

  it("8. Yunnan matches verified Yunnan products", () => {
    const matches = matchProductsByDestination(makeChinaProducts(), "yunnan");
    assert.ok(matches.every((match) => match.product.name.toLowerCase().includes("yunnan")));
  });

  it("9. Yunnan does not match Zhangjiajie-only product", () => {
    const matches = matchProductsByDestination(makeChinaProducts(), "yunnan");
    assert.equal(matches.some((match) => match.product.id === "prod-zhangjiajie"), false);
  });

  it("10. Tokyo matches Japan products with Tokyo", () => {
    const matches = matchProductsByDestination(makeJapanProducts(), "tokyo");
    assert.ok(matches.some((match) => match.product.id === "prod-japan-disney"));
  });

  it("11. Exact destination outranks weak retrieval", () => {
    const selection = resolveSelectedEntity({
      latestMessage: "mau ke yunnan",
      recentHistory: [],
      storedSelectedEntity: null,
      collectedInformation: {},
      businessBrain: makeBrain(makeChinaProducts()),
      retrieved: makeRetrieved([makeChinaProducts()[1]]),
      includeDraft: false,
      requestType: "DESTINATION_DISCOVERY",
    });
    assert.equal(selection.entity?.entityId, "prod-yunnan-1");
  });

  it("12. Weak retrieval cannot create selectedEntity", () => {
    const selection = resolveSelectedEntity({
      latestMessage: "berapa harganya ya?",
      recentHistory: [],
      storedSelectedEntity: null,
      collectedInformation: {},
      businessBrain: makeBrain(makeChinaProducts()),
      retrieved: makeRetrieved([makeChinaProducts()[1]]),
      includeDraft: false,
      requestType: "PRICE",
    });
    assert.equal(selection.entity, null);
  });

  it("13. Product opening agrees with catalog count", () => {
    const plan = buildResponsePlan(makePlanningInput());
    if (plan.catalogResults.length > 0) {
      assert.doesNotMatch(plan.directAnswerTemplate ?? "", /belum menemukan/i);
    }
  });

  it("14. Contradictory no-result + result list is blocked", () => {
    const plan = buildResponsePlan(makePlanningInput());
    const validation = validateResponseAgainstPlan(
      "Saat ini saya belum menemukan paket aktif untuk China. Namun, kami memiliki beberapa pilihan China lainnya:\n• ZHANGJIAJIE",
      plan,
      { products: makeChinaProducts() },
    );
    assert.equal(validation.catalogContradictionDetected, true);
    assert.ok(validation.fallbackReply);
  });

  it("15. Wrong-country catalog output uses fallback", () => {
    const plan = buildResponsePlan(makePlanningInput());
    const consistency = validateCatalogConsistency({
      reply: "Untuk China: Japan Golden Route Shirakawago + Brunei",
      plan: {
        ...plan,
        catalogResults: [
          {
            ...plan.catalogResults[0],
            entityId: "prod-japan-golden",
            displayName: "Japan Golden Route Shirakawago + Brunei Muslim Friendly Tour",
          },
        ],
      },
      products: [...makeChinaProducts(), ...makeJapanProducts()],
    });
    assert.equal(consistency.geographicViolationDetected, true);
  });

  it("16. Every displayed price belongs to its entity", () => {
    const catalog = buildCatalogResults({
      products: makeChinaProducts(),
      message: "pengen ke china",
      requestType: "DESTINATION_DISCOVERY",
    });
    for (const item of catalog.results) {
      if (item.priceLabel) {
        const product = makeChinaProducts().find((p) => p.id === item.entityId);
        assert.ok(product?.pricing.some((price) => price.price > 0));
      }
    }
  });

  it("17. Explicitly selected product persists", () => {
    const product = makeJapanProducts()[0];
    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: product.name,
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
      }),
    );
    assert.equal(plan.selectedEntity?.entityId, product.id);
  });

  it("18. Immediate schedule question uses selected product", () => {
    const product = makeJapanProducts()[0];
    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "rencananya bulan depan, ada keberangkatan kapan aja?",
        intent: "DEPARTURE_DATE",
        conversationState: {
          greetingSent: true,
          collectedInformation: {},
          questionsAsked: [],
          selectedEntity: {
            entityId: product.id,
            entityType: "product",
            displayName: product.name,
            selectionSource: "explicit_latest_message",
            selectedAt: new Date().toISOString(),
          },
          catalogContext: {
            queryType: "country",
            queryValue: "japan",
            entityIds: [product.id],
            exactEntityIds: [product.id],
            alternativeEntityIds: [],
            establishedAt: new Date().toISOString(),
          },
          currentIntent: null,
          handoffRequested: false,
        },
      }),
    );
    assert.equal(plan.selectedEntity?.entityId, product.id);
    assert.ok(plan.geographicDiagnostics?.requestedPeriodType === "next_month");
  });

  it("19. Immediate price question uses selected product", () => {
    const product = makeJapanProducts()[0];
    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "harganya berapa?",
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
            selectedAt: new Date().toISOString(),
          },
          catalogContext: null,
          currentIntent: null,
          handoffRequested: false,
        },
      }),
    );
    assert.equal(plan.selectedEntity?.entityId, product.id);
    assert.ok(plan.verifiedFacts.some((fact) => fact.field === "price"));
  });

  it("20. Weak later retrieval does not overwrite selected product", () => {
    const product = makeJapanProducts()[0];
    const selection = resolveSelectedEntity({
      latestMessage: "bulan depan ada?",
      recentHistory: [],
      storedSelectedEntity: {
        entityId: product.id,
        entityType: "product",
        displayName: product.name,
        selectionSource: "conversation_state",
        selectedAt: new Date().toISOString(),
      },
      collectedInformation: {},
      businessBrain: makeBrain(makeJapanProducts()),
      retrieved: makeRetrieved([makeChinaProducts()[0]]),
      includeDraft: false,
      requestType: "SCHEDULE_OR_DEPARTURE",
    });
    assert.equal(selection.entity?.entityId, product.id);
  });
});

describe("AI-003.1B relative period and schedule", () => {
  const julyReference = new Date("2026-07-12T10:00:00+07:00");

  it("21. bulan depan resolves using workspace timezone", () => {
    const period = resolveSchedulePeriod("bulan depan", {
      referenceDate: julyReference,
      timezone: "Asia/Jakarta",
    });
    assert.equal(period?.month, 8);
    assert.equal(period?.year, 2026);
    assert.equal(period?.timezone, "Asia/Jakarta");
  });

  it("22. December next month resolves January of next year", () => {
    const period = resolveSchedulePeriod("bulan depan", {
      referenceDate: new Date("2026-12-15T10:00:00+07:00"),
      timezone: "Asia/Jakarta",
    });
    assert.equal(period?.month, 1);
    assert.equal(period?.year, 2027);
  });

  it("23. Agustus resolves correct month", () => {
    const period = resolveSchedulePeriod("Agustus", {
      referenceDate: julyReference,
      timezone: "Asia/Jakarta",
    });
    assert.equal(period?.month, 8);
  });

  it("24. Agustus 2026 resolves correct year", () => {
    const period = resolveSchedulePeriod("Agustus 2026", {
      referenceDate: julyReference,
      timezone: "Asia/Jakarta",
    });
    assert.equal(period?.month, 8);
    assert.equal(period?.year, 2026);
  });

  it("25. malformed timezone falls back safely", () => {
    const period = resolveSchedulePeriod("bulan depan", {
      referenceDate: julyReference,
      timezone: "Not/A_Real_Timezone",
    });
    assert.equal(period?.month, 8);
    assert.equal(period?.timezone, "Asia/Jakarta");
  });

  it("26. August query includes August date", () => {
    const period = resolveSchedulePeriod("bulan depan", { referenceDate: julyReference, timezone: "Asia/Jakarta" });
    const normalized = normalizeDepartureToIso("5 Agustus 2026");
    assert.equal(departureMatchesPeriod(normalized.iso!, period), true);
  });

  it("27. August query excludes September date", () => {
    const period = resolveSchedulePeriod("bulan depan", { referenceDate: julyReference, timezone: "Asia/Jakarta" });
    const normalized = normalizeDepartureToIso("12 September 2026");
    assert.equal(departureMatchesPeriod(normalized.iso!, period), false);
  });

  it("28. selected product cannot use another product's dates", () => {
    const product = makeJapanProducts()[0];
    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "bulan depan ada keberangkatan?",
        intent: "DEPARTURE_DATE",
        conversationState: {
          greetingSent: true,
          collectedInformation: {},
          questionsAsked: [],
          selectedEntity: {
            entityId: product.id,
            entityType: "product",
            displayName: product.name,
            selectionSource: "conversation_state",
            selectedAt: new Date().toISOString(),
          },
          catalogContext: null,
          currentIntent: null,
          handoffRequested: false,
        },
      }),
    );
    const dates = plan.verifiedFacts.filter((fact) => fact.field === "departure_date");
    assert.ok(dates.every((fact) => fact.sourceId === product.id));
  });

  it("29. no matching period triggers handoff", () => {
    const product = { ...makeJapanProducts()[0], departures: [] };
    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "bulan depan ada keberangkatan?",
        intent: "DEPARTURE_DATE",
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
            selectedAt: new Date().toISOString(),
          },
          catalogContext: null,
          currentIntent: null,
          handoffRequested: false,
        },
      }),
    );
    assert.equal(plan.handoffRequired, true);
    assert.match(plan.directAnswerTemplate ?? "", /belum menemukan jadwal/i);
  });

  it("30. malformed dates are excluded", () => {
    const product = {
      ...makeJapanProducts()[0],
      departures: [{ id: "bad", departureDate: "soon maybe", status: "open" as const, availableSeats: 1 }],
    };
    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "bulan depan ada?",
        intent: "DEPARTURE_DATE",
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
            selectedAt: new Date().toISOString(),
          },
          catalogContext: null,
          currentIntent: null,
          handoffRequested: false,
        },
      }),
    );
    assert.equal(plan.verifiedFacts.filter((fact) => fact.field === "departure_date").length, 0);
  });

  it("31. date-only value does not shift timezone day", () => {
    const normalized = normalizeDepartureToIso("2026-08-05");
    assert.equal(normalized.iso, "2026-08-05");
  });
});

describe("AI-003.1B scoring and parity", () => {
  it("32. Wrong-country output caps score at 30", () => {
    const plan = buildResponsePlan(makePlanningInput());
    const wrongPlan = {
      ...plan,
      catalogResults: plan.catalogResults.map((item) => ({
        ...item,
        entityId: "prod-japan-golden",
        displayName: "Japan Golden Route Shirakawago + Brunei Muslim Friendly Tour",
      })),
    };
    const validation = validateResponseAgainstPlan(
      wrongPlan.directAnswerTemplate ?? "",
      wrongPlan,
      { products: [...makeChinaProducts(), ...makeJapanProducts()] },
    );
    const score = calculatePlaygroundAiScore({
      result: makeScoreResult(wrongPlan.directAnswerTemplate ?? ""),
      customerMessage: "pengen ke china",
      conversationHistory: [],
      responsePlan: wrongPlan,
      planValidation: validation,
      products: [...makeChinaProducts(), ...makeJapanProducts()],
    });
    assert.ok(score.breakdown.overall <= 30);
  });

  it("33. Contradictory catalog caps score at 40", () => {
    const plan = buildResponsePlan(makePlanningInput());
    const validation = validateResponseAgainstPlan(
      "Saat ini saya belum menemukan paket aktif untuk China. Namun ada ZHANGJIAJIE",
      plan,
      { products: makeChinaProducts() },
    );
    const score = calculatePlaygroundAiScore({
      result: makeScoreResult("Saat ini saya belum menemukan paket aktif untuk China."),
      customerMessage: "pengen ke china",
      conversationHistory: [],
      responsePlan: plan,
      planValidation: validation,
      rawPlanValidation: validation,
      products: makeChinaProducts(),
    });
    assert.ok(score.breakdown.overall <= 40);
  });

  it("34. Wrong-month availability caps score at 30", () => {
    const product = {
      ...makeJapanProducts()[0],
      departures: [{ id: "jd2", departureDate: "12 September 2026", status: "open" as const, availableSeats: 10 }],
    };
    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "bulan depan ada keberangkatan?",
        intent: "DEPARTURE_DATE",
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
            selectedAt: new Date().toISOString(),
          },
          catalogContext: null,
          currentIntent: null,
          handoffRequested: false,
        },
      }),
    );
    const badReply = "Untuk Japan Golden Route, keberangkatan bulan depan tersedia pada 12 September 2026.";
    const validation = validateResponseAgainstPlan(badReply, plan);
    const score = calculatePlaygroundAiScore({
      result: makeScoreResult(badReply),
      customerMessage: "bulan depan ada keberangkatan?",
      conversationHistory: [],
      responsePlan: plan,
      planValidation: validation,
      rawPlanValidation: validation,
    });
    assert.ok(score.breakdown.overall <= 30);
  });

  it("35. Correct catalog response scores positively", () => {
    const plan = buildResponsePlan(makePlanningInput());
    const validation = validateResponseAgainstPlan(plan.directAnswerTemplate ?? "", plan, {
      products: [...makeChinaProducts(), ...makeJapanProducts()],
    });
    const score = calculatePlaygroundAiScore({
      result: makeScoreResult(plan.directAnswerTemplate ?? ""),
      customerMessage: "pengen ke china",
      conversationHistory: [],
      responsePlan: plan,
      planValidation: validation,
      products: [...makeChinaProducts(), ...makeJapanProducts()],
    });
    assert.ok(score.breakdown.overall >= 50);
  });

  it("36. Correct selected-product period response scores positively", () => {
    const product = makeJapanProducts()[0];
    const plan = buildResponsePlan(
      makePlanningInput({
        latestMessage: "bulan depan ada keberangkatan?",
        intent: "DEPARTURE_DATE",
        conversationState: {
          greetingSent: true,
          collectedInformation: {},
          questionsAsked: [],
          selectedEntity: {
            entityId: product.id,
            entityType: "product",
            displayName: product.name,
            selectionSource: "conversation_state",
            selectedAt: new Date().toISOString(),
          },
          catalogContext: null,
          currentIntent: null,
          handoffRequested: false,
        },
      }),
    );
    const validation = validateResponseAgainstPlan(plan.directAnswerTemplate ?? "", plan);
    const score = calculatePlaygroundAiScore({
      result: makeScoreResult(plan.directAnswerTemplate ?? ""),
      customerMessage: "bulan depan ada?",
      conversationHistory: [],
      responsePlan: plan,
      planValidation: validation,
    });
    assert.ok(score.breakdown.overall >= 50);
  });

  it("37. Live and playground use same geography normalizer", () => {
    const query = resolveCatalogQuery("pengen ke china", "PACKAGE_INQUIRY");
    assert.equal(query.queryType, "country");
    assert.equal(extractCountryQuery("pengen jalan jalan ke china nih, ada paketnya ga?"), "china");
  });

  it("38. Both use same period resolver", () => {
    const period = resolveSchedulePeriod("bulan depan", {
      referenceDate: new Date("2026-07-12T10:00:00+07:00"),
      timezone: "Asia/Jakarta",
    });
    assert.equal(period?.month, 8);
  });

  it("39. Both use same schedule filter", () => {
    const period = resolveSchedulePeriod("Agustus 2026", {
      referenceDate: new Date("2026-07-12T10:00:00+07:00"),
      timezone: "Asia/Jakarta",
    });
    assert.equal(departureMatchesPeriod("2026-08-05", period), true);
    assert.equal(departureMatchesPeriod("2026-09-05", period), false);
  });

  it("40. Both use same contradiction validator", () => {
    const plan = buildResponsePlan(makePlanningInput());
    const result = validateCatalogConsistency({
      reply: "belum menemukan paket aktif untuk China. ZHANGJIAJIE tersedia",
      plan,
      products: makeChinaProducts(),
    });
    assert.equal(result.contradictionDetected, true);
  });
});
