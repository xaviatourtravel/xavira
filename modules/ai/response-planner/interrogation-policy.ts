import { containsBannedInterrogationPhrase } from "@/modules/ai/base-brain/hospitality-voice-policy";
import type { CatalogResult, ResponsePlan } from "@/modules/ai/response-planner/types";

export function isQuestionOnlyResponse(reply: string): boolean {
  const trimmed = reply.trim();
  if (!trimmed.includes("?")) return false;
  const withoutQuestion = trimmed.replace(/\?[\s\S]*$/, "").trim();
  return withoutQuestion.length < 30;
}

export function detectInterrogation(reply: string, plan: ResponsePlan | null): boolean {
  if (!plan) return false;

  if (containsBannedInterrogationPhrase(reply)) {
    return true;
  }

  const hasCatalogData = (plan.catalogResults?.length ?? 0) > 0;

  if (hasCatalogData && isQuestionOnlyResponse(reply)) {
    return true;
  }

  if (
    plan.responseAction === "ASK_ONE_CLARIFYING_QUESTION" &&
    hasCatalogData &&
    plan.requestType !== "UNKNOWN"
  ) {
    return true;
  }

  return false;
}

export function detectWrongEntity(plan: ResponsePlan, customerMessage: string): boolean {
  if (!plan.selectedEntity) {
    return false;
  }

  if (plan.destinationMatchType === "no_match") {
    return true;
  }

  const normalizedMessage = customerMessage.toLowerCase();
  const entityText = plan.selectedEntity.displayName.toLowerCase();

  if (normalizedMessage.includes("yunnan")) {
    const selectedHasYunnan = entityText.includes("yunnan");
    if (!selectedHasYunnan && plan.selectedEntity.selectionSource === "single_retrieval_match") {
      return true;
    }
    if (
      !selectedHasYunnan &&
      plan.requestType === "DESTINATION_DISCOVERY" &&
      (plan.catalogResults?.some((item) => item.displayName.toLowerCase().includes("yunnan")) ?? false)
    ) {
      return true;
    }
  }

  if (
    plan.requestType === "DESTINATION_DISCOVERY" &&
    plan.catalogQueryValue &&
    !entityText.includes(plan.catalogQueryValue.toLowerCase()) &&
    plan.selectedEntity.selectionSource === "single_retrieval_match"
  ) {
    return true;
  }

  return false;
}

export function hasUsefulCatalogData(results: CatalogResult[] | undefined): boolean {
  return Boolean(results && results.length > 0);
}

export function countFollowUpQuestions(reply: string): number {
  return (reply.match(/\?/g) ?? []).length;
}
