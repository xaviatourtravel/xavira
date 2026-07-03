import { createClient } from "@/utils/supabase/server";

import { createLLMAdapter } from "@/modules/ai/services/llm-adapter";
import { classifyIntent } from "@/modules/ai/services/intent-classifier";
import { retrieveRelevantContext } from "@/modules/ai/services/context-retrieval-engine";
import { extractMemoryFromMessage } from "@/modules/ai/services/memory-extractor";
import { leadQualificationService } from "@/modules/ai/services/lead-qualification-service";
import { memoryService } from "@/modules/ai/services/memory-service";
import type { ConversationMemoryKey, ConversationMemoryMap } from "@/modules/ai/types/memory";
import {
  mergePromptMemoryItems,
  playgroundMemoryTestToPromptItems,
  promptItemsToPlaygroundMemoryDisplay,
  toConversationMemoryPromptItems,
} from "@/modules/ai/types/memory";
import { toPromptBusinessBrainContext } from "@/modules/ai/types/context-retrieval";
import { mapBusinessBrainContextToPlayground } from "@/modules/business-brain/lib/map-context-to-playground";
import { mapUsedContextToPlayground } from "@/modules/business-brain/lib/map-playground-used-context";
import { resolveDocumentActionDisplays } from "@/modules/business-brain/lib/parse-document-actions";
import { parseWhatsAppSalesLlmResponse } from "@/modules/business-brain/lib/parse-whatsapp-sales-llm-response";
import { resolveAiSourceLabels } from "@/modules/business-brain/lib/resolve-ai-source-labels";
import {
  playgroundSaveExampleSchema,
  playgroundTestInputSchema,
  type PlaygroundSaveExampleInput,
} from "@/modules/business-brain/schemas/playground";
import { buildBusinessBrainContextBody } from "@/modules/business-brain/services/context-builder";
import { buildWhatsAppSalesPrompt } from "@/modules/business-brain/services/prompt-builder";
import type {
  PlaygroundAvailableContext,
  PlaygroundCustomerContext,
  PlaygroundSavedExample,
  PlaygroundTestResult,
} from "@/modules/business-brain/types/playground";

const exampleStore = new Map<string, PlaygroundSavedExample[]>();
const memoryStore = new Map<string, ConversationMemoryMap>();

export class PlaygroundLlmNotConfiguredError extends Error {
  constructor() {
    super("LLM is not configured. Add OPENAI_API_KEY to enable AI preview.");
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

async function resolveWorkspaceName(organizationId: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.name?.trim() || "Workspace";
}

function buildCustomerContextSummary(context: PlaygroundCustomerContext): string | null {
  const lines = [
    context.customerName ? `Customer name: ${context.customerName}` : null,
    context.destinationInterest ? `Destination interest: ${context.destinationInterest}` : null,
    context.budget ? `Budget: ${context.budget}` : null,
    context.departureMonth ? `Departure month: ${context.departureMonth}` : null,
    context.passengerCount ? `Passenger count: ${context.passengerCount}` : null,
  ].filter(Boolean);

  if (lines.length === 0) {
    return null;
  }

  return lines.join("\n");
}

function buildPlaygroundCustomerMessage(
  customerMessage: string,
  context: PlaygroundCustomerContext,
): string {
  const summary = buildCustomerContextSummary(context);
  if (!summary) {
    return customerMessage;
  }

  return `${customerMessage}\n\nOptional customer context:\n${summary}`;
}

export async function getAvailableContext(
  organizationId: string,
): Promise<PlaygroundAvailableContext> {
  const context = await buildBusinessBrainContextBody(organizationId, {
    includeDraft: true,
  });

  return mapBusinessBrainContextToPlayground(context);
}

export async function runTest(
  organizationId: string,
  input: unknown,
): Promise<PlaygroundTestResult> {
  const parsed = playgroundTestInputSchema.parse(input);

  if (!isPlaygroundLlmConfigured()) {
    throw new PlaygroundLlmNotConfiguredError();
  }

  const llm = createLLMAdapter();
  if (!llm) {
    throw new PlaygroundLlmNotConfiguredError();
  }

  const [workspaceName, businessBrainContext] = await Promise.all([
    resolveWorkspaceName(organizationId),
    buildBusinessBrainContextBody(organizationId, {
      includeDraft: true,
      customerMessage: parsed.customerMessage,
    }),
  ]);

  const effectiveCustomerMessage = buildPlaygroundCustomerMessage(
    parsed.customerMessage,
    parsed.context,
  );

  const sessionMemoryItems = toConversationMemoryPromptItems(
    memoryStore.get(organizationId) ?? {},
  );
  const manualMemoryItems = playgroundMemoryTestToPromptItems(parsed.memoryTest);
  const extractedMemoryItems = extractMemoryFromMessage({
    messageText: parsed.customerMessage,
    conversationId: "playground",
    workspaceId: organizationId,
  }).memories.map((memory) => ({
    memory_key: memory.key,
    memory_value: memory.value,
    confidence: memory.confidence,
  }));

  const customerMemoryUsed = mergePromptMemoryItems(
    sessionMemoryItems,
    manualMemoryItems,
    extractedMemoryItems,
  );

  const leadQualification = leadQualificationService.snapshotFromPromptItems(
    customerMemoryUsed,
  );

  const intentResult = classifyIntent({
    customerMessage: effectiveCustomerMessage,
    conversationHistory: [],
  });

  const retrievedContext = retrieveRelevantContext({
    workspaceId: organizationId,
    customerMessage: effectiveCustomerMessage,
    intent: intentResult.intent,
    businessBrainContext,
  });

  const promptBundle = buildWhatsAppSalesPrompt({
    workspaceName,
    customerMessage: effectiveCustomerMessage,
    conversationHistory: [],
    retrievedContext,
    conversationMemory: customerMemoryUsed,
    leadQualification,
  });

  const llmResult = await llm.generateJSON({
    systemPrompt: promptBundle.systemPrompt,
    userPrompt: promptBundle.userPrompt,
    temperature: 0.4,
    maxTokens: 900,
  });

  if (!llmResult.success) {
    throw new PlaygroundLlmFailedError(
      llmResult.error ?? "AI preview failed. Please try again.",
    );
  }

  const contract = parseWhatsAppSalesLlmResponse(llmResult.data);
  if (!contract) {
    throw new PlaygroundLlmFailedError("AI preview failed. Please try again.");
  }

  const sourceLabels = resolveAiSourceLabels(
    toPromptBusinessBrainContext(promptBundle.sanitizedContext),
    contract.usedSources,
  );
  const documentActions = resolveDocumentActionDisplays(
    toPromptBusinessBrainContext(promptBundle.sanitizedContext),
    contract.documentActions,
  );

  const preview = {
    aiReply: contract.reply,
    confidence: contract.confidence,
    handoffRequired: contract.handoffRequired,
    handoffReason: contract.handoffReason,
    suggestedActions: contract.suggestedActions,
    usedSources: contract.usedSources,
    sourceLabels,
    documentActions,
  };

  const contextUsed = mapUsedContextToPlayground(
    promptBundle.sanitizedContext,
    contract.usedSources,
  );

  const extracted = extractMemoryFromMessage({
    messageText: parsed.customerMessage,
    conversationId: "playground",
    workspaceId: organizationId,
  }, {
    productDestinations: retrievedContext.relevantProducts
      .map((product) => product.destination)
      .filter((destination): destination is string => Boolean(destination?.trim())),
  }).memories.map((memory) => ({
    memoryKey: memory.key as ConversationMemoryKey,
    memoryValue: memory.value,
    confidence: memory.confidence,
    source: memory.source,
  }));

  const updatedMemory = memoryService.mergeExtractedMemory(
    memoryStore.get(organizationId) ?? {},
    extracted,
  );
  memoryStore.set(organizationId, updatedMemory);
  const customerMemory = promptItemsToPlaygroundMemoryDisplay(customerMemoryUsed);

  return {
    preview,
    contextUsed,
    retrievalSummary: retrievedContext.retrievalSummary,
    customerMemory,
    customerMemoryUsed,
    leadQualification,
  };
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
