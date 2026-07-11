import type { ResponsePlan, PlanValidationResult } from "@/modules/ai/response-planner/types";
import { validateResponseAgainstPlan } from "@/modules/ai/response-planner/validate-response-plan";
import type { WhatsAppSalesLlmOutputContract } from "@/modules/business-brain/types/prompt";
import type { AIAction } from "@/modules/ai/action-engine/types";

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

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
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
}): {
  finalReply: string;
  rawValidation: PlanValidationResult | null;
  finalValidation: PlanValidationResult | null;
} {
  if (!input.answerFirstEnabled || !input.plan) {
    return { finalReply: input.rawReply, rawValidation: null, finalValidation: null };
  }

  const rawValidation = validateResponseAgainstPlan(input.rawReply, input.plan);
  const finalReply =
    !rawValidation.passed && rawValidation.fallbackReply
      ? rawValidation.fallbackReply
      : input.rawReply;
  const finalValidation = validateResponseAgainstPlan(finalReply, input.plan);

  return { finalReply, rawValidation, finalValidation };
}
