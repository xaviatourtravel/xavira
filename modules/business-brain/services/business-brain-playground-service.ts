import { DEFAULT_AI_TIMEZONE } from "@/modules/ai/runtime";
import { createClient } from "@/utils/supabase/server";

import { classifyIntent } from "@/modules/ai/services/intent-classifier";
import { retrieveRelevantContext } from "@/modules/ai/services/context-retrieval-engine";
import { extractMemoryFromMessage } from "@/modules/ai/services/memory-extractor";
import type { ExtractedMessageMemory } from "@/modules/ai/services/memory-extractor";
import { leadQualificationService } from "@/modules/ai/services/lead-qualification-service";
import { memoryService } from "@/modules/ai/services/memory-service";
import { validateAIResponse } from "@/modules/ai/services/ai-safety-validator";
import { improveReplyQuality } from "@/modules/ai/services/ai-reply-quality-guard";
import {
  applyValidatedReply,
  buildResponsePlan,
  buildPlaygroundPlanningInput,
  buildPlaygroundStatePromptContext,
  isAnswerFirstV1Enabled,
  toPlaygroundSessionState,
  updatePlaygroundSessionAfterReply,
} from "@/modules/ai/response-planner";
import type { PlanValidationResult, ResponsePlan } from "@/modules/ai/response-planner/types";
import type { ConversationMemoryKey, ConversationMemoryMap } from "@/modules/ai/types/memory";
import {
  toConversationMemoryPromptItems,
  promptItemsToPlaygroundMemoryDisplay,
} from "@/modules/ai/types/memory";
import { toPromptBusinessBrainContext } from "@/modules/ai/types/context-retrieval";
import { mapBusinessBrainContextToPlayground } from "@/modules/business-brain/lib/map-context-to-playground";
import { mapUsedContextToPlayground } from "@/modules/business-brain/lib/map-playground-used-context";
import { calculatePlaygroundAiScore } from "@/modules/business-brain/lib/calculate-playground-ai-score";
import { resolveDocumentActionDisplays } from "@/modules/business-brain/lib/parse-document-actions";
import { resolveAiSourceLabels } from "@/modules/business-brain/lib/resolve-ai-source-labels";
import {
  playgroundSaveExampleSchema,
  playgroundTestInputSchema,
  type PlaygroundSaveExampleInput,
} from "@/modules/business-brain/schemas/playground";
import {
  buildBusinessBrainContext,
  buildBusinessBrainContextBody,
} from "@/modules/business-brain/services/context-builder";
import { EMPTY_BUSINESS_BRAIN_CONTEXT } from "@/modules/business-brain/types/context";
import type { WhatsAppConversationTurn } from "@/modules/business-brain/types/prompt";
import type {
  PlaygroundAvailableContext,
  PlaygroundPreviewResult,
  PlaygroundSavedExample,
  PlaygroundTestResult,
} from "@/modules/business-brain/types/playground";
import type { SimulatorChatMessage } from "@/modules/business-brain/types/playground-simulator";
import type { PlaygroundPersistedConversationState } from "@/modules/business-brain/types/playground-session-state";
import { aiHandoffService } from "@/lib/whatsapp-inbox/ai/handoff-service";
import {
  aiLLMReplyService,
  WHATSAPP_AI_LLM_FALLBACK_REPLY,
} from "@/lib/whatsapp-inbox/ai/llm-reply-service";
import { aiReplyService } from "@/lib/whatsapp-inbox/ai/reply-service";
import { sanitizeAiReplyBranding } from "@/lib/whatsapp-inbox/ai/workspace-profile";
import {
  getOrCreateActivePlaygroundSession,
  resetActivePlaygroundSession,
  updateActivePlaygroundSession,
} from "@/modules/business-brain/services/playground-session-persistence";
import { EMPTY_PLAYGROUND_CONVERSATION_STATE } from "@/modules/business-brain/types/playground-session-state";

const exampleStore = new Map<string, PlaygroundSavedExample[]>();

export async function loadActivePlaygroundSession(
  organizationId: string,
  userId: string,
  sessionId?: string | null,
) {
  return getOrCreateActivePlaygroundSession({
    workspaceId: organizationId,
    userId,
    sessionId,
  });
}

export async function resetPlaygroundConversation(
  organizationId: string,
  userId: string,
  sessionId?: string,
) {
  await resetActivePlaygroundSession(organizationId, userId, sessionId);
}

export class PlaygroundLlmNotConfiguredError extends Error {
  constructor() {
    super("AI preview is not available. Add OPENAI_API_KEY to enable response testing.");
    this.name = "PlaygroundLlmNotConfiguredError";
  }
}

export class PlaygroundLlmFailedError extends Error {
  constructor(message = "AI preview failed. Please try again.") {
    super(message);
    this.name = "PlaygroundLlmFailedError";
  }
}

export function isPlaygroundLlmConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

async function resolveOrganizationAiSettings(
  organizationId: string,
): Promise<{ name: string; timezone: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("name, timezone")
    .eq("id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return {
    name: data?.name?.trim() || "Workspace",
    timezone: data?.timezone?.trim() || DEFAULT_AI_TIMEZONE,
  };
}

function mapExtractedMemories(memories: ExtractedMessageMemory[]) {
  return memories.map((memory) => ({
    memoryKey: memory.key as ConversationMemoryKey,
    memoryValue: memory.value,
    confidence: memory.confidence,
    source: memory.source,
  }));
}

function buildPreviewResult(args: {
  reply: string;
  confidence: number;
  handoffRequired: boolean;
  handoffReason: string | null;
  suggestedActions: string[];
  usedSources: string[];
  businessBrainContext: ReturnType<typeof toPromptBusinessBrainContext> | null;
  documentActions: PlaygroundPreviewResult["documentActions"];
}): PlaygroundPreviewResult {
  const sourceLabels = resolveAiSourceLabels(
    args.businessBrainContext ?? EMPTY_BUSINESS_BRAIN_CONTEXT,
    args.usedSources,
  );

  return {
    aiReply: args.reply,
    confidence: args.confidence,
    handoffRequired: args.handoffRequired,
    handoffReason: args.handoffReason,
    suggestedActions: args.suggestedActions,
    usedSources: args.usedSources,
    sourceLabels,
    documentActions: args.documentActions,
  };
}

export async function getAvailableContext(
  organizationId: string,
): Promise<PlaygroundAvailableContext> {
  const context = await buildBusinessBrainContextBody(organizationId, {
    includeDraft: true,
  });

  return mapBusinessBrainContextToPlayground(context);
}

type PlaygroundTestResultBody = Omit<PlaygroundTestResult, "aiScore">;

type PlaygroundPlanEvaluation = {
  responsePlan: ResponsePlan | null;
  rawPlanValidation: PlanValidationResult | null;
  planValidation: PlanValidationResult | null;
  rawReply: string | null;
};

function resolvePlanDocumentActions(
  responsePlan: ResponsePlan | null,
): PlaygroundPreviewResult["documentActions"] {
  if (!responsePlan?.attachmentAction) {
    return [];
  }

  return [
    {
      documentId: responsePlan.attachmentAction.documentId,
      documentName: responsePlan.attachmentAction.documentName,
      action: "SEND_DOCUMENT" as const,
      reason: "Answer-first response plan (simulated delivery)",
      confidence: 1,
    },
  ];
}

function finalizePlaygroundTestResult(
  body: PlaygroundTestResultBody,
  customerMessage: string,
  conversationHistory: WhatsAppConversationTurn[],
  planEvaluation?: PlaygroundPlanEvaluation,
): PlaygroundTestResult {
  return {
    ...body,
    aiScore: calculatePlaygroundAiScore({
      result: body,
      customerMessage,
      conversationHistory,
      responsePlan: planEvaluation?.responsePlan ?? null,
      planValidation: planEvaluation?.planValidation ?? null,
      rawPlanValidation: planEvaluation?.rawPlanValidation ?? null,
      rawReply: planEvaluation?.rawReply ?? null,
    }),
  };
}

function withSessionId(
  result: PlaygroundTestResult,
  sessionId: string,
): PlaygroundTestResult & { sessionId: string } {
  return { ...result, sessionId };
}

function appendConversationTurn(
  existing: SimulatorChatMessage[],
  customerMessage: string,
  aiReply: string,
  aiScore?: PlaygroundTestResult["aiScore"],
): SimulatorChatMessage[] {
  const turnId = Date.now();
  return [
    ...existing,
    {
      id: `cust-${turnId}`,
      role: "customer" as const,
      text: customerMessage,
    },
    {
      id: `ai-${turnId}`,
      role: "ai" as const,
      text: aiReply,
      aiScore,
    },
  ];
}

async function persistPlaygroundTurn(input: {
  workspaceId: string;
  sessionId: string;
  userId: string;
  conversation: SimulatorChatMessage[];
  conversationState: PlaygroundPersistedConversationState;
  testResult: PlaygroundTestResult;
}) {
  await updateActivePlaygroundSession({
    workspaceId: input.workspaceId,
    sessionId: input.sessionId,
    userId: input.userId,
    conversation: input.conversation,
    conversationState: input.conversationState,
    inspector: input.testResult as unknown as Record<string, unknown>,
    score: input.testResult.aiScore.breakdown.overall,
  });
}

export async function runTest(
  organizationId: string,
  userId: string,
  input: unknown,
): Promise<PlaygroundTestResult & { sessionId: string }> {
  const parsed = playgroundTestInputSchema.parse(input);

  if (!isPlaygroundLlmConfigured()) {
    throw new PlaygroundLlmNotConfiguredError();
  }

  const priorHistory: WhatsAppConversationTurn[] = parsed.conversationHistory;
  const intentHistory = priorHistory.map(({ sender, text }) => ({ sender, text }));
  const hasPriorBusinessReplies = priorHistory.some(
    (turn) => turn.sender === "ai" || turn.sender === "human",
  );

  const [organizationSettings, businessBrainContextResult] = await Promise.all([
    resolveOrganizationAiSettings(organizationId),
    buildBusinessBrainContext(organizationId, {
      includeDraft: true,
      customerMessage: parsed.customerMessage,
    }),
  ]);
  const { meta: businessBrainMeta, ...businessBrainContext } = businessBrainContextResult;
  const workspaceName = organizationSettings.name;
  const workspaceTimezone = organizationSettings.timezone;

  const activeSession = await getOrCreateActivePlaygroundSession({
    workspaceId: organizationId,
    userId,
    sessionId: parsed.sessionId ?? null,
  });

  const sessionState = toPlaygroundSessionState({
    workspaceId: organizationId,
    sessionId: activeSession.id,
    state: activeSession.conversationState,
  });

  let conversationMemory = sessionState.customerMemory;

  const initialExtraction = extractMemoryFromMessage({
    messageText: parsed.customerMessage,
    conversationId: activeSession.id,
    workspaceId: organizationId,
  }).memories;

  conversationMemory = memoryService.mergeExtractedMemory(
    conversationMemory,
    mapExtractedMemories(initialExtraction),
  );

  const customerMemoryUsed = toConversationMemoryPromptItems(conversationMemory);
  const leadQualification = leadQualificationService.snapshotFromPromptItems(
    customerMemoryUsed,
  );

  const intentResult = classifyIntent({
    customerMessage: parsed.customerMessage,
    conversationHistory: intentHistory,
  });

  if (aiHandoffService.requiresHandoff(intentResult)) {
    const handoffReply = sanitizeAiReplyBranding(
      aiReplyService.getHandoffReply(),
      parsed.customerMessage,
      workspaceName,
    );

    const testResult = finalizePlaygroundTestResult(
      {
        preview: buildPreviewResult({
          reply: handoffReply,
          confidence: intentResult.confidence,
          handoffRequired: true,
          handoffReason: `Intent ${intentResult.intent} requires a human agent.`,
          suggestedActions: [],
          usedSources: [],
          businessBrainContext: null,
          documentActions: [],
        }),
        contextUsed: mapUsedContextToPlayground(businessBrainContext, []),
        retrievalSummary: {
          intent: intentResult.intent,
          matchedKeywords: [],
          productCount: 0,
          articleCount: 0,
          documentCount: 0,
          behaviorCount: 0,
        },
        customerMemory: promptItemsToPlaygroundMemoryDisplay(customerMemoryUsed),
        customerMemoryUsed,
        leadQualification,
      },
      parsed.customerMessage,
      priorHistory,
    );

    const updatedConversation = appendConversationTurn(
      activeSession.conversation,
      parsed.customerMessage,
      handoffReply,
      testResult.aiScore,
    );

    await persistPlaygroundTurn({
      workspaceId: organizationId,
      sessionId: activeSession.id,
      userId,
      conversation: updatedConversation,
      conversationState: {
        ...activeSession.conversationState,
        handoffRequested: true,
        currentIntent: intentResult.intent,
        customerMemory: conversationMemory,
      },
      testResult,
    });

    return withSessionId(testResult, activeSession.id);
  }

  const retrievedContext = retrieveRelevantContext({
    workspaceId: organizationId,
    customerMessage: parsed.customerMessage,
    intent: intentResult.intent,
    businessBrainContext,
  });

  const enrichedExtraction = extractMemoryFromMessage(
    {
      messageText: parsed.customerMessage,
      conversationId: activeSession.id,
      workspaceId: organizationId,
    },
    {
      productDestinations: retrievedContext.relevantProducts
        .map((product) => product.destination)
        .filter((destination): destination is string => Boolean(destination?.trim())),
    },
  ).memories;

  conversationMemory = memoryService.mergeExtractedMemory(
    conversationMemory,
    mapExtractedMemories(enrichedExtraction),
  );

  const promptMemoryItems = toConversationMemoryPromptItems(conversationMemory);
  const refreshedLeadQualification = leadQualificationService.snapshotFromPromptItems(
    promptMemoryItems,
  );

  const conversationStateContext = buildPlaygroundStatePromptContext({
    session: sessionState,
    hasPriorBusinessReplies,
    incomingMessage: parsed.customerMessage,
    qualification: refreshedLeadQualification,
  });

  let responsePlan: ResponsePlan | null = null;
  if (isAnswerFirstV1Enabled()) {
    responsePlan = buildResponsePlan(
      buildPlaygroundPlanningInput({
        workspaceId: organizationId,
        session: sessionState,
        latestMessage: parsed.customerMessage,
        recentHistory: priorHistory,
        intent: intentResult.intent,
        conversationStateContext,
        publishedBusinessBrain: businessBrainContext,
        retrievedContext,
        memory: conversationMemory,
        qualification: refreshedLeadQualification,
      }),
    );
  }

  const llmResult = await aiLLMReplyService.generateWhatsAppReply({
    workspaceId: organizationId,
    workspaceName,
    customerMessage: parsed.customerMessage,
    conversationHistory: priorHistory,
    retrievedContext,
    fullBusinessBrainContext: businessBrainContext,
    businessBrainMeta,
    conversationMemory,
    leadQualification: refreshedLeadQualification,
    intent: intentResult.intent,
    hasPriorBusinessReplies,
    isNewConversation: priorHistory.length === 0,
    conversationStateContext,
    responsePlan,
    contextSource: "playground_simulator",
    runtimeContext: {
      timezone: workspaceTimezone,
      workspaceId: organizationId,
      workspaceName,
      businessName:
        businessBrainContext.companyDNA?.companyName ??
        businessBrainContext.companyDNA?.industry ??
        workspaceName,
      currentUser: "Playground User",
    },
  });

  if (!llmResult.success) {
    throw new PlaygroundLlmFailedError(
      llmResult.error ?? "AI preview failed. Please try again.",
    );
  }

  const businessBrainContextForValidation =
    llmResult.businessBrainContext ?? EMPTY_BUSINESS_BRAIN_CONTEXT;

  const safetyValidation = validateAIResponse({
    reply: llmResult.reply,
    handoffRequired: llmResult.handoffRequired,
    handoffReason: llmResult.handoffReason,
    documentActions: llmResult.documentActions,
    actions: llmResult.actions,
    businessBrainContext: businessBrainContextForValidation,
    customerMessage: parsed.customerMessage,
    hasPriorBusinessReplies,
    companyName: workspaceName,
  });

  if (safetyValidation.forceHandoff || !safetyValidation.allowed) {
    const handoffReply = sanitizeAiReplyBranding(
      aiReplyService.getHandoffReply(),
      parsed.customerMessage,
      workspaceName,
    );

    const documentActions = resolveDocumentActionDisplays(
      businessBrainContextForValidation,
      llmResult.documentActions,
    );

    const testResult = finalizePlaygroundTestResult(
      {
        preview: buildPreviewResult({
          reply: handoffReply,
          confidence: llmResult.confidence,
          handoffRequired: true,
          handoffReason:
            safetyValidation.reason ?? "Response did not pass safety validation.",
          suggestedActions: llmResult.suggestedActions,
          usedSources: llmResult.usedSources,
          businessBrainContext: businessBrainContextForValidation,
          documentActions,
        }),
        contextUsed: mapUsedContextToPlayground(
          llmResult.retrievedContext ?? retrievedContext,
          llmResult.usedSources,
        ),
        retrievalSummary: llmResult.retrievalSummary ?? retrievedContext.retrievalSummary,
        customerMemory: promptItemsToPlaygroundMemoryDisplay(promptMemoryItems),
        customerMemoryUsed: promptMemoryItems,
        leadQualification: refreshedLeadQualification,
      },
      parsed.customerMessage,
      priorHistory,
    );

    const updatedConversation = appendConversationTurn(
      activeSession.conversation,
      parsed.customerMessage,
      handoffReply,
      testResult.aiScore,
    );

    await persistPlaygroundTurn({
      workspaceId: organizationId,
      sessionId: activeSession.id,
      userId,
      conversation: updatedConversation,
      conversationState: {
        ...activeSession.conversationState,
        handoffRequested: true,
        currentIntent: intentResult.intent,
        customerMemory: conversationMemory,
      },
      testResult,
    });

    return withSessionId(testResult, activeSession.id);
  }

  const validatedReplyText =
    safetyValidation.sanitizedReply ??
    sanitizeAiReplyBranding(llmResult.reply, parsed.customerMessage, workspaceName);

  const qualityResult = improveReplyQuality({
    reply: validatedReplyText,
    conversationHistory: priorHistory,
    customerMessage: parsed.customerMessage,
    businessBrainContext: businessBrainContextForValidation,
  });

  let finalReplyText = qualityResult.reply.trim() || WHATSAPP_AI_LLM_FALLBACK_REPLY;
  const rawReplyText = finalReplyText;
  let rawPlanValidation: PlanValidationResult | null = null;
  let planValidation: PlanValidationResult | null = null;

  if (isAnswerFirstV1Enabled() && responsePlan) {
    const validated = applyValidatedReply({
      rawReply: finalReplyText,
      plan: responsePlan,
      answerFirstEnabled: true,
    });
    rawPlanValidation = validated.rawValidation;
    planValidation = validated.finalValidation;
    finalReplyText = validated.finalReply;
  }

  let simulatedAttachments = [...sessionState.simulatedAttachments];
  const planDocumentActions = resolvePlanDocumentActions(responsePlan);
  if (responsePlan?.attachmentAction && planDocumentActions.length > 0) {
    const doc = businessBrainContext.documents.find(
      (item) => item.id === responsePlan.attachmentAction?.documentId,
    );
    if (doc) {
      simulatedAttachments = [
        {
          documentId: doc.id,
          documentName: doc.name,
          documentType: doc.documentType,
          simulated: true as const,
          deliveredAt: new Date().toISOString(),
        },
      ];
    }
  }

  const documentActions =
    planDocumentActions.length > 0
      ? planDocumentActions
      : resolveDocumentActionDisplays(
          businessBrainContextForValidation,
          llmResult.documentActions,
        );

  const effectiveHandoffRequired =
    responsePlan?.handoffRequired ?? llmResult.handoffRequired;
  const effectiveHandoffReason =
    responsePlan?.handoffReason ?? llmResult.handoffReason;

  const updatedSession = isAnswerFirstV1Enabled()
    ? updatePlaygroundSessionAfterReply({
        session: sessionState,
        intent: intentResult.intent,
        replyText: finalReplyText,
        responsePlan,
        usePlanQuestionKeys: true,
        customerMemory: conversationMemory,
        simulatedAttachments,
      })
    : sessionState;

  const testBody = finalizePlaygroundTestResult(
    {
      preview: buildPreviewResult({
        reply: finalReplyText,
        confidence: llmResult.confidence,
        handoffRequired: effectiveHandoffRequired,
        handoffReason: effectiveHandoffReason,
        suggestedActions: llmResult.suggestedActions,
        usedSources: llmResult.usedSources,
        businessBrainContext: businessBrainContextForValidation,
        documentActions,
      }),
      contextUsed: mapUsedContextToPlayground(
        llmResult.retrievedContext ?? retrievedContext,
        llmResult.usedSources,
      ),
      retrievalSummary: llmResult.retrievalSummary ?? retrievedContext.retrievalSummary,
      customerMemory: promptItemsToPlaygroundMemoryDisplay(promptMemoryItems),
      customerMemoryUsed: promptMemoryItems,
      leadQualification: refreshedLeadQualification,
    },
    parsed.customerMessage,
    priorHistory,
    { responsePlan, rawPlanValidation, planValidation, rawReply: rawReplyText },
  );

  const updatedConversation = appendConversationTurn(
    activeSession.conversation,
    parsed.customerMessage,
    finalReplyText,
    testBody.aiScore,
  );

  await persistPlaygroundTurn({
    workspaceId: organizationId,
    sessionId: activeSession.id,
    userId,
    conversation: updatedConversation,
    conversationState: {
      greetingSent: updatedSession.greetingSent,
      collectedInformation: updatedSession.collectedInformation,
      questionsAsked: updatedSession.questionsAsked,
      selectedEntity: updatedSession.selectedEntity,
      catalogContext: updatedSession.catalogContext,
      currentIntent: updatedSession.currentIntent,
      handoffRequested: updatedSession.handoffRequested,
      customerMemory: updatedSession.customerMemory,
      simulatedAttachments: updatedSession.simulatedAttachments,
    },
    testResult: testBody,
  });

  return { ...testBody, sessionId: activeSession.id };
}

export async function saveExample(
  organizationId: string,
  input: unknown,
): Promise<PlaygroundSavedExample> {
  const parsed = playgroundSaveExampleSchema.parse(input) as PlaygroundSaveExampleInput;
  const example: PlaygroundSavedExample = {
    id: `example-${Date.now()}`,
    customerMessage: parsed.customerMessage,
    aiReply: parsed.aiReply,
    savedAt: new Date().toISOString(),
  };

  const existing = exampleStore.get(organizationId) ?? [];
  exampleStore.set(organizationId, [example, ...existing].slice(0, 20));
  return example;
}

export function listSavedExamples(organizationId: string): PlaygroundSavedExample[] {
  return exampleStore.get(organizationId) ?? [];
}

export async function getPlaygroundMemory(
  organizationId: string,
  userId: string,
) {
  const session = await getOrCreateActivePlaygroundSession({
    workspaceId: organizationId,
    userId,
    sessionId: null,
  });
  return promptItemsToPlaygroundMemoryDisplay(
    toConversationMemoryPromptItems(session.conversationState.customerMemory),
  );
}
