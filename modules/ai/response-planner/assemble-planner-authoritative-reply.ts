import type { ResponsePlan } from "@/modules/ai/response-planner/types";
import { formatCatalogList } from "@/modules/ai/response-planner/resolve-catalog";

export function requiresPlannerAuthoritativeDelivery(plan: ResponsePlan): boolean {
  if (plan.catalogResults.length > 0) return true;
  if (plan.requestType === "GEOGRAPHIC_CONFIRMATION") return true;
  if (plan.directAnswerRequired && plan.directAnswerTemplate) return true;
  return false;
}

export function assemblePlannerAuthoritativeReply(plan: ResponsePlan): string {
  const parts: string[] = [];

  if (plan.directAnswerTemplate?.trim()) {
    parts.push(plan.directAnswerTemplate.trim());
  } else if (plan.catalogResults.length > 0) {
    parts.push(formatCatalogList(plan.catalogResults));
  }

  if (plan.followUpQuestion?.trim() && !plan.handoffRequired) {
    const assembled = parts.join("\n\n");
    if (!assembled.includes(plan.followUpQuestion.trim())) {
      parts.push(plan.followUpQuestion.trim());
    }
  }

  return parts.join("\n\n").trim();
}
