import type { ResponsePlan, PlanValidationResult } from "@/modules/ai/response-planner/types";
import { validateResponseAgainstPlan } from "@/modules/ai/response-planner/validate-response-plan";
import {
  assemblePlannerAuthoritativeReply,
  requiresPlannerAuthoritativeDelivery,
} from "@/modules/ai/response-planner/assemble-planner-authoritative-reply";
import type { WhatsAppSalesLlmOutputContract } from "@/modules/business-brain/types/prompt";
import type { AIAction } from "@/modules/ai/action-engine/types";
import type { ProductContext } from "@/modules/business-brain/types/context";

export type StructuredLlmOutput = WhatsAppSalesLlmOutputContract & {
  replyText: string;
  directAnswer: string | null;
  supportingExplanation: string | null;
  followUpQuestion: string | null;
  followUpQuestionKey: string | null;
  requestType: string | null;
  answerability: string | null;
  responseAction: string | null;
  attachmentIds: string[];
};

export type MergedLlmOutput = StructuredLlmOutput & {
  planAuthoritative: boolean;
};

export type AppliedValidatedReplyResult = {
  finalReply: string;
  rawValidation: PlanValidationResult | null;
  finalValidation: PlanValidationResult | null;
  deterministicFallbackUsed: boolean;
  unplannedEntityIdsDetected: string[];
  catalogEntityIdsDelivered: string[];
};

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function detectUnplannedEntityIds(
  reply: string,
  plan: ResponsePlan,
  products?: ProductContext[],
): string[] {
  if (!products?.length) return [];

  const catalogIds = new Set(plan.catalogResults.map((item) => item.entityId));
  const replyLower = reply.toLowerCase();
  const unplanned: string[] = [];

  for (const product of products) {
    if (catalogIds.has(product.id)) continue;
    const marker = product.name.toLowerCase().slice(0, 12);
    if (marker && replyLower.includes(marker)) {
      unplanned.push(product.id);
    }
  }

  return unplanned;
}

export function mergeLlmOutputWithPlan(
  parsed: WhatsAppSalesLlmOutputContract,
  plan: ResponsePlan | null,
  answerFirstEnabled: boolean,
): MergedLlmOutput {
  const record = parsed as Record<string, unknown>;
  const replyText = parsed.reply.trim();

  if (!answerFirstEnabled || !plan) {
    return {
      ...parsed,
      replyText,
      directAnswer: asNullableString(record.directAnswer),
      supportingExplanation: asNullableString(record.supportingExplanation),
      followUpQuestion: asNullableString(record.followUpQuestion),
      followUpQuestionKey: asNullableString(record.followUpQuestionKey),
      requestType: asNullableString(record.requestType),
      answerability: asNullableString(record.answerability),
      responseAction: asNullableString(record.responseAction),
      attachmentIds: asStringArray(record.attachmentIds),
      planAuthoritative: false,
    };
  }

  const planAttachmentIds = plan.attachmentAction ? [plan.attachmentAction.documentId] : [];

  const filteredActions: AIAction[] = parsed.actions.filter((action) => {
    if (action.type !== "SEND_DOCUMENT") return true;
    const documentId =
      typeof action.payload.documentId === "string" ? action.payload.documentId : "";
    if (plan.attachmentAction && documentId === plan.attachmentAction.documentId) {
      return false;
    }
    return true;
  });

  const filteredDocumentActions = parsed.documentActions.filter(
    (item) => !planAttachmentIds.includes(item.documentId),
  );

  return {
    ...parsed,
    replyText,
    directAnswer: asNullableString(record.directAnswer),
    supportingExplanation: asNullableString(record.supportingExplanation),
    followUpQuestion:
      plan.followUpQuestion ?? asNullableString(record.followUpQuestion),
    followUpQuestionKey: plan.followUpQuestionKey,
    requestType: plan.requestType,
    answerability: plan.answerability,
    responseAction: plan.responseAction,
    handoffRequired: plan.handoffRequired,
    handoffReason: plan.handoffReason ?? parsed.handoffReason,
    attachmentIds: planAttachmentIds,
    actions: filteredActions,
    documentActions: filteredDocumentActions,
    planAuthoritative: true,
  };
}

export function applyValidatedReply(input: {
  rawReply: string;
  plan: ResponsePlan | null;
  answerFirstEnabled: boolean;
  products?: ProductContext[];
}): AppliedValidatedReplyResult {
  if (!input.answerFirstEnabled || !input.plan) {
    return {
      finalReply: input.rawReply,
      rawValidation: null,
      finalValidation: null,
      deterministicFallbackUsed: false,
      unplannedEntityIdsDetected: [],
      catalogEntityIdsDelivered: [],
    };
  }

  const validationOptions = { products: input.products };
  const rawValidation = validateResponseAgainstPlan(input.rawReply, input.plan, validationOptions);
  const unplannedFromRaw = detectUnplannedEntityIds(input.rawReply, input.plan, input.products);

  let finalReply = input.rawReply;
  let deterministicFallbackUsed = false;

  if (requiresPlannerAuthoritativeDelivery(input.plan)) {
    const authoritativeReply = assemblePlannerAuthoritativeReply(input.plan);
    if (authoritativeReply.trim()) {
      finalReply = authoritativeReply;
      deterministicFallbackUsed = finalReply.trim() !== input.rawReply.trim();
    }
  } else if (!rawValidation.passed && rawValidation.fallbackReply) {
    finalReply = rawValidation.fallbackReply;
    deterministicFallbackUsed = true;
  }

  const finalValidation = validateResponseAgainstPlan(finalReply, input.plan, validationOptions);
  const catalogEntityIdsDelivered = input.plan.catalogResults
    .filter((item) => finalReply.toLowerCase().includes(item.displayName.toLowerCase().slice(0, 12)))
    .map((item) => item.entityId);

  return {
    finalReply,
    rawValidation,
    finalValidation,
    deterministicFallbackUsed,
    unplannedEntityIdsDetected: unplannedFromRaw,
    catalogEntityIdsDelivered,
  };
}
