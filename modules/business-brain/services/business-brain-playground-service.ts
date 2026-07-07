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
import { buildBusinessBrainContextBody } from "@/modules/business-brain/services/context-builder";
import { EMPTY_BUSINESS_BRAIN_CONTEXT } from "@/modules/business-brain/types/context";
import type { WhatsAppConversationTurn } from "@/modules/business-brain/types/prompt";
import type {
  PlaygroundAvailableContext,
  PlaygroundPreviewResult,
  PlaygroundSavedExample,
  PlaygroundTestResult,
} from "@/modules/business-brain/types/playground";
import { aiHandoffService } from "@/lib/whatsapp-inbox/ai/handoff-service";
import {
  aiLLMReplyService,
  WHATSAPP_AI_LLM_FALLBACK_REPLY,
} from "@/lib/whatsapp-inbox/ai/llm-reply-service";
import { aiReplyService } from "@/lib/whatsapp-inbox/ai/reply-service";
import { sanitizeAiReplyBranding } from "@/lib/whatsapp-inbox/ai/workspace-profile";

const exampleStore = new Map<string, PlaygroundSavedExample[]>();
const memoryStore = new Map<string, ConversationMemoryMap>();

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

function finalizePlaygroundTestResult(
  body: PlaygroundTestResultBody,
  customerMessage: string,
  conversationHistory: WhatsAppConversationTurn[],
): PlaygroundTestResult {
  return {
    ...body,
    aiScore: calculatePlaygroundAiScore({
      result: body,
      customerMessage,
      conversationHistory,
    }),
  };
}

export async function runTest(
  organizationId: string,
  input: unknown,
): Promise<PlaygroundTestResult> {
  const parsed = playgroundTestInputSchema.parse(input);

  if (!isPlaygroundLlmConfigured()) {
    throw new PlaygroundLlmNotConfiguredError();
  }

  const priorHistory: WhatsAppConversationTurn[] = parsed.conversationHistory;
  const intentHistory = priorHistory.map(({ sender, text }) => ({ sender, text }));
  const hasPriorBusinessReplies = priorHistory.some(
    (turn) => turn.sender === "ai" || turn.sender === "human",
  );

  const [organizationSettings, businessBrainContext] = await Promise.all([
    resolveOrganizationAiSettings(organizationId),
    buildBusinessBrainContextBody(organizationId, {
      includeDraft: true,
      customerMessage: parsed.customerMessage,
    }),
  ]);
  const workspaceName = organizationSettings.name;
  const workspaceTimezone = organizationSettings.timezone;

  const sessionMemory = memoryStore.get(organizationId) ?? {};
  const initialExtraction = extractMemoryFromMessage({
    messageText: parsed.customerMessage,
    conversationId: "playground",
    workspaceId: organizationId,
  }).memories;

  let conversationMemory = memoryService.mergeExtractedMemory(
    sessionMemory,
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
    memoryStore.set(organizationId, conversationMemory);

    const handoffReply = sanitizeAiReplyBranding(
      aiReplyService.getHandoffReply(),
      parsed.customerMessage,
      workspaceName,
    );

    return finalizePlaygroundTestResult(
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
      conversationId: "playground",
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
  memoryStore.set(organizationId, conversationMemory);

  const promptMemoryItems = toConversationMemoryPromptItems(conversationMemory);
  const refreshedLeadQualification = leadQualificationService.snapshotFromPromptItems(
    promptMemoryItems,
  );

  const llmResult = await aiLLMReplyService.generateWhatsAppReply({
    workspaceId: organizationId,
    workspaceName,
    customerMessage: parsed.customerMessage,
    conversationHistory: priorHistory,
    retrievedContext,
    conversationMemory,
    leadQualification: refreshedLeadQualification,
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

    return finalizePlaygroundTestResult(
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

  const finalReplyText = qualityResult.reply.trim() || WHATSAPP_AI_LLM_FALLBACK_REPLY;
  const documentActions = resolveDocumentActionDisplays(
    businessBrainContextForValidation,
    llmResult.documentActions,
  );

  return finalizePlaygroundTestResult(
    {
      preview: buildPreviewResult({
        reply: finalReplyText,
        confidence: llmResult.confidence,
        handoffRequired: llmResult.handoffRequired,
        handoffReason: llmResult.handoffReason,
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

export function getPlaygroundMemory(organizationId: string) {
  const memory = memoryStore.get(organizationId) ?? {};
  return promptItemsToPlaygroundMemoryDisplay(toConversationMemoryPromptItems(memory));
}
