import type { ResponsePlan } from "@/modules/ai/response-planner/types";

export function formatResponsePlanSection(plan: ResponsePlan): string {
  return [
    "=== DETERMINISTIC_RESPONSE_PLAN ===",
    "Execute this approved response plan. Do not replace it with unrelated qualification.",
    `requestType: ${plan.requestType}`,
    `answerability: ${plan.answerability}`,
    `responseAction: ${plan.responseAction}`,
    `handoffRequired: ${plan.handoffRequired}`,
    plan.handoffReason ? `handoffReason: ${plan.handoffReason}` : "handoffReason: (none)",
    plan.selectedEntity
      ? `selectedEntity: ${plan.selectedEntity.displayName} (${plan.selectedEntity.entityId})`
      : "selectedEntity: (none)",
    plan.catalogResults.length
      ? `catalogResults:\n${plan.catalogResults
          .map(
            (item) =>
              `- ${item.displayName}${item.priceLabel ? ` | ${item.priceLabel}` : ""}${item.duration ? ` | ${item.duration}` : ""}`,
          )
          .join("\n")}`
      : "catalogResults: (none)",
    plan.catalogContext
      ? `catalogContext: ${plan.catalogContext.queryType}=${plan.catalogContext.queryValue ?? "(general)"}`
      : "catalogContext: (none)",
    plan.directAnswerRequired
      ? "directAnswerRequired: yes — answer the customer first"
      : "directAnswerRequired: no",
    plan.directAnswerTemplate ? `directAnswerTemplate: ${plan.directAnswerTemplate}` : "",
    plan.verifiedFacts.length
      ? `verifiedFacts:\n${plan.verifiedFacts.map((fact) => `- ${fact.field}: ${fact.value}`).join("\n")}`
      : "verifiedFacts: (none)",
    plan.unsupportedFields.length
      ? `unsupportedFields: ${plan.unsupportedFields.join(", ")}`
      : "unsupportedFields: (none)",
    plan.attachmentAction
      ? `attachmentAction: SEND_DOCUMENT ${plan.attachmentAction.documentId} (${plan.attachmentAction.documentName})`
      : "attachmentAction: (none)",
    plan.followUpQuestion
      ? `followUpQuestion: ${plan.followUpQuestion}`
      : "followUpQuestion: (none)",
    plan.followUpQuestionKey ? `followUpQuestionKey: ${plan.followUpQuestionKey}` : "",
    plan.answeredQuestionKeys.length
      ? `answeredQuestionKeys: ${plan.answeredQuestionKeys.join(", ")}`
      : "answeredQuestionKeys: (none)",
    "Rules:",
    "- Do not invent prices, schedules, availability, or documents.",
    "- Do not ask answered question keys again.",
    "- Maximum one follow-up question and only after the direct answer.",
    "- Do not change handoffRequired or attachmentAction.",
    "=== END DETERMINISTIC_RESPONSE_PLAN ===",
  ]
    .filter(Boolean)
    .join("\n");
}
