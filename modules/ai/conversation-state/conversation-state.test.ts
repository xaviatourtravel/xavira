import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildInitialConversationState,
  inferGreetingSentFromHistory,
  hasPriorBusinessRepliesFromHistory,
} from "@/modules/ai/conversation-state/backfill";
import {
  buildCollectedInformationFromMemory,
  mergeCollectedInformation,
  resolveAnsweredQuestionKeys,
  resolveUnansweredQuestionKeys,
} from "@/modules/ai/conversation-state/collected-information";
import { parseConversationStateV1Flag } from "@/modules/ai/conversation-state/feature-flag";
import { getGreetingDecision } from "@/modules/ai/conversation-state/greeting-decision";
import {
  applyGreetingGuard,
  detectOpeningGreeting,
  stripForbiddenOpeningGreeting,
} from "@/modules/ai/conversation-state/greeting-guard";
import { mergeQuestionKeys, isQuestionKeyBounded } from "@/modules/ai/conversation-state/question-tracking";
import {
  canTransitionConversationPhase,
  transitionConversationPhase,
} from "@/modules/ai/conversation-state/state-machine";
import type { ConversationAiStateSnapshot } from "@/modules/ai/conversation-state/types";
import { compileAiPrompt } from "@/modules/ai/prompt-compiler/compile-ai-prompt";
import {
  EMPTY_BUSINESS_BRAIN_CONTEXT,
  type BusinessBrainContextMeta,
} from "@/modules/business-brain/types/context";
import type { RetrievedBusinessBrainContext } from "@/modules/ai/types/context-retrieval";
import { conversationStateService } from "@/modules/ai/conversation-state/service";

const emptySnapshot = (
  overrides: Partial<ConversationAiStateSnapshot> = {},
): ConversationAiStateSnapshot => ({
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
  ...overrides,
});

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
    productCount: 0,
    articleCount: 0,
    documentCount: 0,
    behaviorCount: 0,
    matchedKeywords: [],
    intent: "GENERAL",
  },
};

const publishedMeta: BusinessBrainContextMeta = {
  workspaceId: "ws-1",
  businessBrainId: "bb-1",
  source: "published",
  publishedVersionId: "ver-1",
  publishedVersionNumber: 1,
  builtAt: "2026-07-11T10:00:00.000Z",
};

describe("conversation state feature flag", () => {
  it("unset is disabled", () => {
    assert.equal(parseConversationStateV1Flag(undefined), false);
  });

  it("true enables", () => {
    assert.equal(parseConversationStateV1Flag("true"), true);
  });

  it("false disables", () => {
    assert.equal(parseConversationStateV1Flag("false"), false);
  });

  it("unknown disables", () => {
    assert.equal(parseConversationStateV1Flag("enabled"), false);
  });
});

describe("getGreetingDecision", () => {
  it("allows greeting on first interaction", () => {
    const decision = getGreetingDecision({
      conversationState: emptySnapshot(),
      hasPriorBusinessReplies: false,
      incomingMessage: "Halo",
      aiState: "AI_ACTIVE",
    });
    assert.equal(decision.allowed, true);
    assert.equal(decision.reason, "first_interaction");
  });

  it("blocks greeting when greeting_sent is true", () => {
    const decision = getGreetingDecision({
      conversationState: emptySnapshot({ greetingSent: true }),
      hasPriorBusinessReplies: false,
      incomingMessage: "Halo",
      aiState: "AI_ACTIVE",
    });
    assert.equal(decision.allowed, false);
  });

  it("blocks greeting on second customer message", () => {
    const decision = getGreetingDecision({
      conversationState: emptySnapshot({ currentPhase: "ENGAGED" }),
      hasPriorBusinessReplies: true,
      incomingMessage: "Mau tanya paket",
      aiState: "AI_ACTIVE",
    });
    assert.equal(decision.allowed, false);
  });

  it("blocks greeting after human handoff state", () => {
    const decision = getGreetingDecision({
      conversationState: emptySnapshot({ handoffRequested: true, currentPhase: "READY_FOR_HANDOFF" }),
      hasPriorBusinessReplies: true,
      incomingMessage: "Halo",
      aiState: "READY_FOR_HUMAN",
    });
    assert.equal(decision.allowed, false);
  });
});

describe("backfill greeting inference", () => {
  it("backfills greeting conservatively for existing conversation", () => {
    const history = [
      { direction: "outgoing", sender_type: "ai", text: "Halo Kak, ada yang bisa dibantu?" },
    ];
    assert.equal(inferGreetingSentFromHistory(history), true);
    const initial = buildInitialConversationState({
      workspaceId: "ws-1",
      conversationId: "conv-1",
      aiState: "AI_ACTIVE",
      historyMessages: history,
    });
    assert.equal(initial.greetingSent, true);
    assert.equal(initial.currentPhase, "ENGAGED");
  });

  it("prefers greeting blocked when uncertain with prior replies", () => {
    const history = [
      { direction: "outgoing", sender_type: "ai", text: "Baik Kak, kami bantu cek dulu ya." },
    ];
    const initial = buildInitialConversationState({
      workspaceId: "ws-1",
      conversationId: "conv-1",
      aiState: "AI_ACTIVE",
      historyMessages: history,
    });
    assert.equal(initial.greetingSent, true);
  });
});

describe("applyGreetingGuard", () => {
  const fallback = "Baik Kak, kami bantu cek dulu ya.";

  it("detects English greeting", () => {
    assert.equal(detectOpeningGreeting("Hello, how can I help?"), true);
  });

  it("detects Indonesian greeting", () => {
    assert.equal(detectOpeningGreeting("Halo Kak, mau tanya paket"), true);
  });

  it("detects Islamic greeting", () => {
    assert.equal(detectOpeningGreeting("Assalamu'alaikum, saya mau tanya"), true);
  });

  it("does not strip greeting in the middle of a sentence", () => {
    const reply = "Untuk halo ini kami bantu cek jadwalnya ya.";
    const stripped = stripForbiddenOpeningGreeting(reply);
    assert.equal(stripped.removed, false);
    assert.equal(stripped.reply, reply);
  });

  it("removes forbidden repeated greeting", () => {
    const result = applyGreetingGuard({
      reply: "Halo Kak, untuk paket Jepang kami bantu catat dulu ya.",
      greetingAllowed: false,
      fallbackReply: fallback,
    });
    assert.equal(result.greetingRemoved, true);
    assert.match(result.reply, /paket Jepang/);
  });

  it("uses fallback when reply becomes empty after stripping", () => {
    const result = applyGreetingGuard({
      reply: "Halo Kak",
      greetingAllowed: false,
      fallbackReply: fallback,
    });
    assert.equal(result.usedFallback, true);
    assert.equal(result.reply, fallback);
  });
});

describe("collected information and questions", () => {
  it("merges without overwriting valid values with empty values", () => {
    const merged = mergeCollectedInformation(
      {
        requestedService: {
          value: "Japan",
          sourceMessageId: "m1",
          updatedAt: "2026-07-11T10:00:00.000Z",
        },
      },
      {
        requestedService: {
          value: "",
          sourceMessageId: "m2",
          updatedAt: "2026-07-11T11:00:00.000Z",
        },
      },
    );
    assert.equal(merged.requestedService?.value, "Japan");
  });

  it("tracks answered and unanswered question keys", () => {
    const collected = buildCollectedInformationFromMemory(
      {
        destination: {
          id: "1",
          workspaceId: "ws",
          conversationId: "conv",
          customerId: null,
          memoryKey: "destination",
          memoryValue: "Japan",
          confidence: 0.9,
          source: "customer_message",
          createdAt: "2026-07-11T10:00:00.000Z",
          updatedAt: "2026-07-11T10:00:00.000Z",
        },
      },
      "m1",
    );

    const answered = resolveAnsweredQuestionKeys({ collectedInformation: collected });
    assert.deepEqual(answered, ["requested_service"]);

    const unanswered = resolveUnansweredQuestionKeys({
      answeredQuestionKeys: answered,
      questionsAsked: ["budget_range", "participant_count"],
    });
    assert.ok(unanswered.includes("budget_range"));
    assert.ok(!unanswered.includes("requested_service"));
  });

  it("keeps question keys bounded", () => {
    const keys = mergeQuestionKeys([], ["requested_service", "budget_range"]);
    assert.equal(isQuestionKeyBounded(keys), true);
  });
});

describe("state machine", () => {
  it("allows NEW to ENGAGED", () => {
    assert.equal(canTransitionConversationPhase("NEW", "ENGAGED"), true);
  });

  it("rejects invalid transition", () => {
    const result = transitionConversationPhase("CLOSED", "ENGAGED");
    assert.equal(result.ok, false);
  });
});

describe("prompt compiler conversation state integration", () => {
  it("includes greetingAllowed in structured state", () => {
    const promptContext = conversationStateService.buildPromptContext({
      state: {
        id: "s1",
        workspaceId: "ws-1",
        conversationId: "conv-1",
        greetingSent: true,
        businessIntroductionSent: false,
        customerName: null,
        currentIntent: null,
        currentPhase: "ENGAGED",
        qualificationStage: null,
        collectedInformation: {},
        questionsAsked: [],
        selectedEntity: null,
  catalogContext: null,
        handoffRequested: false,
        handoffReason: null,
        handoffAt: null,
        aiPaused: false,
        lastAiReplyAt: "2026-07-11T10:00:00.000Z",
        lastCustomerMessageAt: "2026-07-11T10:05:00.000Z",
        lastStateTransitionAt: "2026-07-11T10:00:00.000Z",
        stateVersion: 2,
        createdAt: "2026-07-11T10:00:00.000Z",
        updatedAt: "2026-07-11T10:05:00.000Z",
      },
      hasPriorBusinessReplies: true,
      incomingMessage: "Mau tanya paket",
      aiState: "AI_ACTIVE",
    });

    const compiled = compileAiPrompt({
      workspaceName: "Test Co",
      customerMessage: "Mau tanya paket",
      conversationHistory: [{ sender: "customer", text: "Halo" }, { sender: "ai", text: "Halo Kak" }],
      retrievedContext: emptyRetrieved,
      fullBusinessBrainContext: EMPTY_BUSINESS_BRAIN_CONTEXT,
      businessBrainMeta: publishedMeta,
      intent: "PACKAGE_INQUIRY",
      hasPriorBusinessReplies: true,
      isNewConversation: false,
      conversationStateContext: promptContext,
    });

    assert.match(compiled.userPrompt, /Greeting allowed: no/);
    assert.match(compiled.userPrompt, /HARD RULE: Do not greet/);
    assert.match(compiled.userPrompt, /Collected information:/);
    assert.equal(compiled.systemPrompt.includes("Mau tanya paket"), false);
  });

  it("places structured state before recent conversation", () => {
    const promptContext = conversationStateService.buildPromptContext({
      state: {
        id: "s1",
        workspaceId: "ws-1",
        conversationId: "conv-1",
        greetingSent: false,
        businessIntroductionSent: false,
        customerName: null,
        currentIntent: null,
        currentPhase: "NEW",
        qualificationStage: null,
        collectedInformation: {
          requestedService: {
            value: "Japan",
            sourceMessageId: "m1",
            updatedAt: "2026-07-11T10:00:00.000Z",
          },
        },
        questionsAsked: [],
        selectedEntity: null,
  catalogContext: null,
        handoffRequested: false,
        handoffReason: null,
        handoffAt: null,
        aiPaused: false,
        lastAiReplyAt: null,
        lastCustomerMessageAt: null,
        lastStateTransitionAt: "2026-07-11T10:00:00.000Z",
        stateVersion: 1,
        createdAt: "2026-07-11T10:00:00.000Z",
        updatedAt: "2026-07-11T10:00:00.000Z",
      },
      hasPriorBusinessReplies: false,
      incomingMessage: "Halo",
      aiState: "AI_ACTIVE",
    });

    const compiled = compileAiPrompt({
      workspaceName: "Test Co",
      customerMessage: "Halo",
      conversationHistory: [],
      retrievedContext: emptyRetrieved,
      fullBusinessBrainContext: EMPTY_BUSINESS_BRAIN_CONTEXT,
      businessBrainMeta: publishedMeta,
      intent: "GENERAL",
      hasPriorBusinessReplies: false,
      isNewConversation: true,
      conversationStateContext: promptContext,
    });

    const stateIndex = compiled.userPrompt.indexOf("=== CONVERSATION_STATE ===");
    const historyIndex = compiled.userPrompt.indexOf("=== RECENT_CONVERSATION ===");
    assert.ok(stateIndex >= 0);
    assert.ok(historyIndex >= 0);
    assert.ok(stateIndex < historyIndex);
    assert.match(compiled.userPrompt, /requestedService: Japan/);
  });
});

describe("observability metadata", () => {
  it("logs greeting decision without full sensitive values", () => {
    const state = {
      id: "s1",
      workspaceId: "ws-1",
      conversationId: "conv-1",
      greetingSent: true,
      businessIntroductionSent: false,
      customerName: "Andi",
      currentIntent: "GENERAL",
      currentPhase: "ENGAGED" as const,
      qualificationStage: null,
      collectedInformation: {
        budgetRange: {
          value: "15 juta",
          sourceMessageId: "m1",
          updatedAt: "2026-07-11T10:00:00.000Z",
        },
      },
      questionsAsked: ["budget_range" as const],
      selectedEntity: null,
  catalogContext: null,
      handoffRequested: false,
      handoffReason: null,
      handoffAt: null,
      aiPaused: false,
      lastAiReplyAt: "2026-07-11T10:00:00.000Z",
      lastCustomerMessageAt: "2026-07-11T10:05:00.000Z",
      lastStateTransitionAt: "2026-07-11T10:00:00.000Z",
      stateVersion: 2,
      createdAt: "2026-07-11T10:00:00.000Z",
      updatedAt: "2026-07-11T10:05:00.000Z",
    };

    const promptContext = conversationStateService.buildPromptContext({
      state,
      hasPriorBusinessReplies: true,
      incomingMessage: "Budget sekitar 15 juta",
      aiState: "AI_ACTIVE",
    });

    const metadata = conversationStateService.buildObservabilityMetadata({
      state,
      promptContext,
      greetingDetectedInGeneratedReply: false,
      greetingRemoved: false,
      transitionFrom: "NEW",
      transitionTo: "ENGAGED",
    });

    assert.equal(metadata.greetingAllowed, false);
    assert.equal(metadata.conversationPhase, "ENGAGED");
    assert.deepEqual(metadata.collectedInformationKeys, ["budgetRange"]);
    assert.equal(JSON.stringify(metadata).includes("15 juta"), false);
  });
});

describe("workspace and conversation scoping", () => {
  it("builds state with workspace and conversation ids", () => {
    const initial = buildInitialConversationState({
      workspaceId: "ws-abc",
      conversationId: "conv-xyz",
      aiState: "AI_ACTIVE",
      historyMessages: [],
    });
    assert.equal(initial.workspaceId, "ws-abc");
    assert.equal(initial.conversationId, "conv-xyz");
    assert.equal(hasPriorBusinessRepliesFromHistory([]), false);
  });
});
