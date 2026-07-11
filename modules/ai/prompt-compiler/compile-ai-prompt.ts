import {
  buildBaseBrainPolicy,
  buildPlatformSafetySection,
  DESKLABS_BASE_BRAIN_VERSION,
} from "@/modules/ai/base-brain";
import { PROMPT_COMPILER_VERSION } from "@/modules/ai/prompt-compiler/prompt-version";
import {
  buildRuntimeContext,
  buildRuntimePrompt,
  resolveLocaleFromCommunicationLanguage,
  type BuildRuntimeContextInput,
} from "@/modules/ai/runtime/build-runtime-context";
import { resolveIntentFallbackStrategy } from "@/modules/ai/base-brain/missing-information-policy";
import {
  assessBusinessBrainCompleteness,
  buildUsedSourceCatalog,
} from "@/modules/ai/prompt-compiler/prompt-context";
import {
  buildActionEngineRulesSection,
  buildOutputContractSection,
  buildSafetyHandoffTopicsSection,
  buildUsedSourcesRulesSection,
  OUTPUT_CONTRACT_EXAMPLE,
  ANSWER_FIRST_OUTPUT_CONTRACT_EXAMPLE,
} from "@/modules/ai/prompt-compiler/prompt-contract";
import {
  extractDeterministicTenantRules,
  formatConversationHistorySection,
  formatConversationStateSection,
  formatCustomerContextSection,
  formatLatestCustomerMessageSection,
  formatLeadQualificationRulesSection,
  formatPublishedBusinessFactsSection,
  formatTenantHardRulesSection,
  wrapPromptSection,
} from "@/modules/ai/prompt-compiler/prompt-sections";
import { formatResponsePlanSection } from "@/modules/ai/response-planner/answer-first-policy";
import type { CompileAiPromptInput, CompiledAiPrompt } from "@/modules/ai/prompt-compiler/types";
import { sanitizeRetrievedContext } from "@/modules/business-brain/services/prompt-builder";

function buildRuntimeContextInput(input: CompileAiPromptInput): BuildRuntimeContextInput {
  return {
    timezone: input.timezone,
    locale:
      input.locale ??
      resolveLocaleFromCommunicationLanguage(
        input.retrievedContext.companyDNA?.communicationStyle.language,
      ),
    workspaceId: input.workspaceId,
    workspaceName: input.workspaceName,
    currentUser: input.currentUser ?? "AI Assistant",
    businessName:
      input.businessName ??
      input.retrievedContext.companyDNA?.companyName ??
      input.workspaceName,
    environment: input.environment ?? "Production",
  };
}

export function compileAiPrompt(input: CompileAiPromptInput): CompiledAiPrompt {
  const sanitizedContext = sanitizeRetrievedContext(input.retrievedContext);
  const completeness = assessBusinessBrainCompleteness(input.fullBusinessBrainContext);
  const tenantRules = extractDeterministicTenantRules(input.fullBusinessBrainContext.behaviors);
  const usedSourceCatalog = buildUsedSourceCatalog({
    companyDNA: sanitizedContext.companyDNA,
    products: sanitizedContext.relevantProducts,
    knowledge: sanitizedContext.relevantArticles,
    documents: sanitizedContext.relevantDocuments,
  });

  const runtimeContext = buildRuntimeContext(buildRuntimeContextInput(input));

  const systemPrompt = [
    wrapPromptSection("PLATFORM_SAFETY", buildPlatformSafetySection()),
    wrapPromptSection(
      "DESKLABS_BASE_BRAIN",
      buildBaseBrainPolicy({
        workspaceName: input.workspaceName,
        completeness,
        intent: input.intent,
        hasPriorBusinessReplies: input.hasPriorBusinessReplies,
        isNewConversation: input.isNewConversation,
      }),
    ),
    wrapPromptSection(
      "TENANT_HARD_RULES",
      formatTenantHardRulesSection({
        neverDo: tenantRules.neverDo,
        alwaysDo: tenantRules.alwaysDo,
        replyStyle: input.fullBusinessBrainContext.replyStyle,
      }),
    ),
    wrapPromptSection("LEAD_QUALIFICATION_RULES", formatLeadQualificationRulesSection()),
    input.responsePlan
      ? formatResponsePlanSection(input.responsePlan)
      : "",
    wrapPromptSection("USED_SOURCES_RULES", buildUsedSourcesRulesSection(usedSourceCatalog)),
    wrapPromptSection("ACTION_ENGINE_RULES", buildActionEngineRulesSection()),
    wrapPromptSection("HIGH_RISK_HANDOFF_TOPICS", buildSafetyHandoffTopicsSection()),
    wrapPromptSection(
      "OUTPUT_CONTRACT",
      buildOutputContractSection(Boolean(input.responsePlan)),
    ),
  ]
    .filter(Boolean)
    .join("\n\n");

  const userPrompt = [
    wrapPromptSection("RUNTIME_CONTEXT", buildRuntimePrompt(runtimeContext)),
    formatPublishedBusinessFactsSection(sanitizedContext, {
      publishedVersionId: input.businessBrainMeta.publishedVersionId,
      publishedVersionNumber: input.businessBrainMeta.publishedVersionNumber,
      businessBrainSource: input.businessBrainMeta.source,
      completeness,
    }),
    formatConversationStateSection({
      hasPriorBusinessReplies: input.hasPriorBusinessReplies,
      isNewConversation: input.isNewConversation,
      intent: input.intent,
      completeness,
      conversationStateContext: input.conversationStateContext,
    }),
    formatCustomerContextSection({
      memory: input.conversationMemory ?? [],
      qualification: input.leadQualification,
      retrievalSummary: sanitizedContext.retrievalSummary,
    }),
    formatConversationHistorySection(input.conversationHistory),
    formatLatestCustomerMessageSection(input.customerMessage),
  ].join("\n\n");

  const tenantRuleIds = [...tenantRules.neverDo, ...tenantRules.alwaysDo].map((item) => item.id);

  return {
    systemPrompt,
    userPrompt,
    sanitizedContext,
    usedSourceCatalog,
    outputContractExample: input.responsePlan
      ? ANSWER_FIRST_OUTPUT_CONTRACT_EXAMPLE
      : OUTPUT_CONTRACT_EXAMPLE,
    metadata: {
      baseBrainVersion: DESKLABS_BASE_BRAIN_VERSION,
      promptCompilerVersion: PROMPT_COMPILER_VERSION,
      publishedVersionId: input.businessBrainMeta.publishedVersionId,
      publishedVersionNumber: input.businessBrainMeta.publishedVersionNumber,
      businessBrainSource: input.businessBrainMeta.source,
      includeDraft: input.businessBrainMeta.source === "draft",
      tenantRuleIds,
      retrievedProductIds: sanitizedContext.relevantProducts.map((item) => item.id),
      retrievedKnowledgeIds: sanitizedContext.relevantArticles.map((item) => item.id),
      retrievedDocumentIds: sanitizedContext.relevantDocuments.map((item) => item.id),
      appliedBehaviorIds: tenantRuleIds,
      conversationHistoryCount: input.conversationHistory.length,
      businessBrainCompleteness: completeness,
      fallbackStrategy: resolveIntentFallbackStrategy(input.intent),
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length,
    },
  };
}
