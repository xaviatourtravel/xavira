import { buildRuntimeContext } from "@/modules/ai/runtime/build-runtime-context";
import type { BuildRuntimeContextInput } from "@/modules/ai/runtime/build-runtime-context";
import { createLLMAdapter } from "@/modules/ai/services/llm-adapter";
import type { RetrievedBusinessBrainContext } from "@/modules/ai/types/context-retrieval";
import { toPromptBusinessBrainContext } from "@/modules/ai/types/context-retrieval";
import type { RetrievalSummary } from "@/modules/ai/types/context-retrieval";
import type { LeadQualificationSnapshot } from "@/modules/ai/types/lead-qualification";
import type { ConversationMemoryMap } from "@/modules/ai/types/memory";
import { toConversationMemoryPromptItems } from "@/modules/ai/types/memory";
import { parseWhatsAppSalesLlmResponse } from "@/modules/business-brain/lib/parse-whatsapp-sales-llm-response";
import { resolveAiSourceLabels } from "@/modules/business-brain/lib/resolve-ai-source-labels";
import { buildWhatsAppSalesPrompt } from "@/modules/business-brain/services/prompt-builder";
import type { BusinessBrainContext } from "@/modules/business-brain/types/context";
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
  conversationMemory?: ConversationMemoryMap;
  leadQualification?: LeadQualificationSnapshot | null;
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
  /** Human-readable labels for internal AI event logs. */
  sourceLabels: string[];
  documentActions: WhatsAppDocumentAction[];
  actions: AIAction[];
  businessBrainContext: BusinessBrainContext | null;
  retrievedContext: RetrievedBusinessBrainContext | null;
  retrievalSummary?: RetrievalSummary;
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
): GenerateWhatsAppReplyResult {
  return {
    success: false,
    reply: WHATSAPP_AI_LLM_FALLBACK_REPLY,
    handoffRequired: false,
    handoffReason: null,
    confidence: 0,
    suggestedActions: [],
    usedSources: [],
    sourceLabels: [],
    documentActions: [],
    actions: [],
    businessBrainContext: retrievedContext
      ? toPromptBusinessBrainContext(retrievedContext)
      : null,
    retrievedContext: retrievedContext ?? null,
    retrievalSummary: retrievedContext?.retrievalSummary,
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

    if (!llm) {
      return buildFallbackResult(
        Date.now() - startedAt,
        "OPENAI_API_KEY is not configured",
        input.contextSource,
        input.retrievedContext,
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

      const promptBundle = buildWhatsAppSalesPrompt({
        workspaceId: input.workspaceId,
        workspaceName: input.workspaceName,
        customerMessage: input.customerMessage,
        conversationHistory: input.conversationHistory,
        retrievedContext: input.retrievedContext,
        conversationMemory: input.conversationMemory
          ? toConversationMemoryPromptItems(input.conversationMemory)
          : undefined,
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
          ),
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
          ),
        };
      }

      const sourceLabels = resolveAiSourceLabels(
        promptBusinessBrainContext,
        contract.usedSources,
      );

      return {
        success: true,
        reply: contract.reply,
        handoffRequired: contract.handoffRequired,
        handoffReason: contract.handoffReason,
        confidence: contract.confidence,
        suggestedActions: contract.suggestedActions,
        usedSources: contract.usedSources,
        sourceLabels,
        documentActions: contract.documentActions,
        actions: contract.actions,
        businessBrainContext: promptBusinessBrainContext,
        retrievedContext: promptBundle.sanitizedContext,
        retrievalSummary: promptBundle.sanitizedContext.retrievalSummary,
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
      );
    }
  },
};
