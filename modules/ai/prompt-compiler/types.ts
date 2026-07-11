import type { AIAction } from "@/modules/ai/action-engine/types";
import type { LeadQualificationSnapshot } from "@/modules/ai/types/lead-qualification";
import type { RetrievedBusinessBrainContext } from "@/modules/ai/types/context-retrieval";
import type { ConversationMemoryPromptItem } from "@/modules/ai/types/memory";
import type { BusinessBrainContext } from "@/modules/business-brain/types/context";
import type { BusinessBrainContextResult } from "@/modules/business-brain/types/context";
import type { WhatsAppConversationTurn } from "@/modules/business-brain/types/prompt";
import type { BusinessBrainCompleteness } from "@/modules/ai/base-brain/types";
import type { IntentFallbackStrategy } from "@/modules/ai/base-brain/types";
import type { ConversationStatePromptContext } from "@/modules/ai/conversation-state/types";
import type { ResponsePlan } from "@/modules/ai/response-planner/types";

export type CompileAiPromptInput = {
  workspaceId?: string | null;
  workspaceName: string;
  customerMessage: string;
  conversationHistory: WhatsAppConversationTurn[];
  retrievedContext: RetrievedBusinessBrainContext;
  fullBusinessBrainContext: BusinessBrainContext;
  businessBrainMeta: BusinessBrainContextResult["meta"];
  conversationMemory?: ConversationMemoryPromptItem[];
  leadQualification?: LeadQualificationSnapshot | null;
  intent: string;
  hasPriorBusinessReplies: boolean;
  isNewConversation: boolean;
  conversationStateContext?: ConversationStatePromptContext | null;
  responsePlan?: ResponsePlan | null;
  timezone?: string | null;
  locale?: "id" | "en" | null;
  currentUser?: string | null;
  businessName?: string | null;
  environment?: string | null;
};

export type CompiledPromptMetadata = {
  baseBrainVersion: string;
  promptCompilerVersion: string;
  publishedVersionId: string | null;
  publishedVersionNumber: number | null;
  businessBrainSource: BusinessBrainContextResult["meta"]["source"];
  includeDraft: boolean;
  tenantRuleIds: string[];
  retrievedProductIds: string[];
  retrievedKnowledgeIds: string[];
  retrievedDocumentIds: string[];
  appliedBehaviorIds: string[];
  conversationHistoryCount: number;
  businessBrainCompleteness: BusinessBrainCompleteness;
  fallbackStrategy: IntentFallbackStrategy;
  systemPromptLength: number;
  userPromptLength: number;
};

export type CompiledAiPrompt = {
  systemPrompt: string;
  userPrompt: string;
  sanitizedContext: RetrievedBusinessBrainContext;
  usedSourceCatalog: string[];
  metadata: CompiledPromptMetadata;
  outputContractExample: {
    reply: string;
    handoffRequired: boolean;
    handoffReason: string | null;
    confidence: number;
    suggestedActions: string[];
    usedSources: string[];
    missingInformation: string[];
    suggestedNextStep: string | null;
    intent: string;
    actions: AIAction[];
  };
};
