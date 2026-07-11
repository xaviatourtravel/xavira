import { buildRuntimeContext } from "@/modules/ai/runtime/build-runtime-context";
import type { BuildRuntimeContextInput } from "@/modules/ai/runtime/build-runtime-context";
import { createLLMAdapter } from "@/modules/ai/services/llm-adapter";
import type { RetrievedBusinessBrainContext } from "@/modules/ai/types/context-retrieval";
import { toPromptBusinessBrainContext } from "@/modules/ai/types/context-retrieval";
import type { RetrievalSummary } from "@/modules/ai/types/context-retrieval";
import type { LeadQualificationSnapshot } from "@/modules/ai/types/lead-qualification";
import type { ConversationMemoryMap } from "@/modules/ai/types/memory";
import { toConversationMemoryPromptItems } from "@/modules/ai/types/memory";
import {
  compileAiPrompt,
  isPromptCompilerV2Enabled,
  type CompiledPromptMetadata,
} from "@/modules/ai/prompt-compiler";
import {
  isAnswerFirstV1Enabled,
  mergeLlmOutputWithPlan,
} from "@/modules/ai/response-planner";
import { parseWhatsAppSalesLlmResponse } from "@/modules/business-brain/lib/parse-whatsapp-sales-llm-response";
import { resolveAiSourceLabels } from "@/modules/business-brain/lib/resolve-ai-source-labels";
import { buildWhatsAppSalesPrompt } from "@/modules/business-brain/services/prompt-builder";
import type {
  BusinessBrainContext,
  BusinessBrainContextMeta,
} from "@/modules/business-brain/types/context";
import type { ConversationStatePromptContext } from "@/modules/ai/conversation-state/types";
import type { ResponsePlan } from "@/modules/ai/response-planner/types";
import type { AIAction } from "@/modules/ai/action-engine/types";
import type {
  WhatsAppConversationTurn,
  WhatsAppDocumentAction,
} from "@/modules/business-brain/types/prompt";

export const WHATSAPP_AI_LLM_FALLBACK_REPLY =
  "Baik Kak, kami bantu cek dulu ya. Sebentar kami lanjutkan informasinya.";

export type GenerateWhatsAppReplyInput = {
  workspaceId: string;
  workspaceName: string;
  customerMessage: string;
  conversationHistory: WhatsAppConversationTurn[];
  retrievedContext: RetrievedBusinessBrainContext;
  fullBusinessBrainContext?: BusinessBrainContext;
  businessBrainMeta?: BusinessBrainContextMeta;
  conversationMemory?: ConversationMemoryMap;
  leadQualification?: LeadQualificationSnapshot | null;
  intent?: string;
  hasPriorBusinessReplies?: boolean;
  isNewConversation?: boolean;
  conversationStateContext?: ConversationStatePromptContext | null;
  responsePlan?: ResponsePlan | null;
  contextSource?: string;
  runtimeContext?: BuildRuntimeContextInput;
  /** @deprecated Use runtimeContext.timezone */
  timezone?: string | null;
};

export type GenerateWhatsAppReplyResult = {
  success: boolean;
  reply: string;
  handoffRequired: boolean;
  handoffReason: string | null;
  confidence: number;
  suggestedActions: string[];
  usedSources: string[];
  missingInformation: string[];
  suggestedNextStep: string | null;
  llmIntent: string;
  /** Human-readable labels for internal AI event logs. */
  sourceLabels: string[];
  documentActions: WhatsAppDocumentAction[];
  actions: AIAction[];
  businessBrainContext: BusinessBrainContext | null;
  retrievedContext: RetrievedBusinessBrainContext | null;
  retrievalSummary?: RetrievalSummary;
  promptMetadata?: CompiledPromptMetadata;
  promptCompilerV2: boolean;
  generationTimeMs: number;
  inputTokens: number;
  outputTokens: number;
  usedFallback: boolean;
  contextSource?: string;
  error?: string;
};

function buildFallbackResult(
  generationTimeMs: number,
  error?: string,
  contextSource?: string,
  retrievedContext?: RetrievedBusinessBrainContext,
  promptCompilerV2 = isPromptCompilerV2Enabled(),
): GenerateWhatsAppReplyResult {
  return {
    success: false,
    reply: WHATSAPP_AI_LLM_FALLBACK_REPLY,
    handoffRequired: false,
    handoffReason: null,
    confidence: 0,
    suggestedActions: [],
    usedSources: [],
    missingInformation: [],
    suggestedNextStep: null,
    llmIntent: "",
    sourceLabels: [],
    documentActions: [],
    actions: [],
    businessBrainContext: retrievedContext
      ? toPromptBusinessBrainContext(retrievedContext)
      : null,
    retrievedContext: retrievedContext ?? null,
    retrievalSummary: retrievedContext?.retrievalSummary,
    promptCompilerV2,
    generationTimeMs,
    inputTokens: 0,
    outputTokens: 0,
    usedFallback: true,
    contextSource,
    error,
  };
}

export const aiLLMReplyService = {
  async generateWhatsAppReply(
    input: GenerateWhatsAppReplyInput,
  ): Promise<GenerateWhatsAppReplyResult> {
    const startedAt = Date.now();
    const llm = createLLMAdapter();
    const promptCompilerV2 = isPromptCompilerV2Enabled();

    if (!llm) {
      return buildFallbackResult(
        Date.now() - startedAt,
        "OPENAI_API_KEY is not configured",
        input.contextSource,
        input.retrievedContext,
        promptCompilerV2,
      );
    }

    try {
      const runtimeContextInput: BuildRuntimeContextInput =
        input.runtimeContext ?? {
          timezone: input.timezone,
          workspaceId: input.workspaceId,
          workspaceName: input.workspaceName,
          businessName: input.retrievedContext.companyDNA?.companyName ?? undefined,
        };
      const runtimeContext = buildRuntimeContext(runtimeContextInput);
      const memoryItems = input.conversationMemory
        ? toConversationMemoryPromptItems(input.conversationMemory)
        : undefined;

      const promptBundle = promptCompilerV2
        ? compileAiPrompt({
            workspaceId: input.workspaceId,
            workspaceName: input.workspaceName,
            customerMessage: input.customerMessage,
            conversationHistory: input.conversationHistory,
            retrievedContext: input.retrievedContext,
            fullBusinessBrainContext:
              input.fullBusinessBrainContext ??
              toPromptBusinessBrainContext(input.retrievedContext),
            businessBrainMeta: input.businessBrainMeta ?? {
              workspaceId: input.workspaceId,
              businessBrainId: null,
              source: input.contextSource === "playground_simulator" ? "draft" : "published",
              publishedVersionId: null,
              publishedVersionNumber: null,
              builtAt: new Date().toISOString(),
            },
            conversationMemory: memoryItems,
            leadQualification: input.leadQualification,
            intent: input.intent ?? "UNKNOWN",
            hasPriorBusinessReplies: input.hasPriorBusinessReplies ?? false,
            isNewConversation: input.isNewConversation ?? input.conversationHistory.length === 0,
            conversationStateContext: input.conversationStateContext,
            responsePlan: input.responsePlan,
            timezone: runtimeContext.timezone,
            locale: runtimeContext.locale,
            currentUser: runtimeContext.currentUser,
            businessName: runtimeContext.businessName,
            environment: runtimeContext.environment,
          })
        : buildWhatsAppSalesPrompt({
            workspaceId: input.workspaceId,
            workspaceName: input.workspaceName,
            customerMessage: input.customerMessage,
            conversationHistory: input.conversationHistory,
            retrievedContext: input.retrievedContext,
            conversationMemory: memoryItems,
            leadQualification: input.leadQualification,
            timezone: runtimeContext.timezone,
            locale: runtimeContext.locale,
            currentUser: runtimeContext.currentUser,
            businessName: runtimeContext.businessName,
            environment: runtimeContext.environment,
          });

      const llmResult = await llm.generateJSON({
        systemPrompt: promptBundle.systemPrompt,
        userPrompt: promptBundle.userPrompt,
        temperature: 0.4,
        maxTokens: 900,
        runtimeContext: runtimeContextInput,
        runtimeInjection: "user",
      });

      const generationTimeMs = Date.now() - startedAt;
      const promptBusinessBrainContext = toPromptBusinessBrainContext(
        promptBundle.sanitizedContext,
      );

      if (!llmResult.success) {
        return {
          ...buildFallbackResult(
            generationTimeMs,
            llmResult.error ?? "LLM request failed",
            input.contextSource,
            promptBundle.sanitizedContext,
            promptCompilerV2,
          ),
          promptMetadata: "metadata" in promptBundle ? promptBundle.metadata : undefined,
        };
      }

      const contract = parseWhatsAppSalesLlmResponse(llmResult.data);
      if (!contract) {
        return {
          ...buildFallbackResult(
            generationTimeMs,
            "Invalid LLM JSON response",
            input.contextSource,
            promptBundle.sanitizedContext,
            promptCompilerV2,
          ),
          promptMetadata: "metadata" in promptBundle ? promptBundle.metadata : undefined,
        };
      }

      const merged = mergeLlmOutputWithPlan(
        contract,
        input.responsePlan ?? null,
        isAnswerFirstV1Enabled(),
      );

      const sourceLabels = resolveAiSourceLabels(
        promptBusinessBrainContext,
        merged.usedSources,
      );

      return {
        success: true,
        reply: merged.replyText,
        handoffRequired: merged.handoffRequired,
        handoffReason: merged.handoffReason,
        confidence: merged.confidence,
        suggestedActions: merged.suggestedActions,
        usedSources: merged.usedSources,
        missingInformation: merged.missingInformation,
        suggestedNextStep: merged.suggestedNextStep,
        llmIntent: merged.intent,
        sourceLabels,
        documentActions: merged.documentActions,
        actions: merged.actions,
        businessBrainContext: promptBusinessBrainContext,
        retrievedContext: promptBundle.sanitizedContext,
        retrievalSummary: promptBundle.sanitizedContext.retrievalSummary,
        promptMetadata: "metadata" in promptBundle ? promptBundle.metadata : undefined,
        promptCompilerV2,
        generationTimeMs,
        inputTokens: 0,
        outputTokens: 0,
        usedFallback: false,
        contextSource: input.contextSource,
      };
    } catch (error) {
      return buildFallbackResult(
        Date.now() - startedAt,
        error instanceof Error ? error.message : String(error),
        input.contextSource,
        input.retrievedContext,
        promptCompilerV2,
      );
    }
  },
};
