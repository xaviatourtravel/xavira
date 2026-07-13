import { applyValidatedReply } from "@/modules/ai/response-planner/merge-plan-output";
import { buildResponsePlan } from "@/modules/ai/response-planner/build-response-plan";
import { createTurnContext } from "@/modules/ai/response-planner/turn-context";
import type { NormalizedPlanningInput, ResponsePlan } from "@/modules/ai/response-planner/types";
import type { PlanValidationResult } from "@/modules/ai/response-planner/types";
import type { ProductContext } from "@/modules/business-brain/types/context";
import { RUNTIME_VERSIONS } from "@/modules/ai/runtime/runtime-versions";

export type PlaygroundTurnDeliveryInput = {
  planningInput: NormalizedPlanningInput;
  rawLlmReply: string;
  products: ProductContext[];
  sessionId: string;
  previousTurnId?: string | null;
};

export type PlaygroundTurnDeliveryResult = {
  responsePlan: ResponsePlan;
  finalReply: string;
  rawValidation: PlanValidationResult;
  planValidation: PlanValidationResult;
  deterministicFallbackUsed: boolean;
  unplannedEntityIdsDetected: string[];
  catalogEntityIdsDelivered: string[];
  runtimeVersions: typeof RUNTIME_VERSIONS;
};

export function processPlaygroundTurnDelivery(
  input: PlaygroundTurnDeliveryInput,
): PlaygroundTurnDeliveryResult {
  const turnContext = createTurnContext({
    sessionId: input.sessionId,
    latestMessage: input.planningInput.latestMessage,
    previousTurnId: input.previousTurnId ?? null,
  });

  const responsePlan = buildResponsePlan({
    ...input.planningInput,
    turn: {
      turnId: turnContext.turnId,
      latestMessageTextHash: turnContext.latestMessageTextHash,
      previousTurnId: turnContext.previousTurnId,
      planCreatedAt: turnContext.planCreatedAt,
      previousSelectedEntity: input.planningInput.conversationState?.selectedEntity ?? null,
      selectionOverrideReason: null,
      latestMessageIntent: "UNKNOWN",
      runtimeVersions: turnContext.runtimeVersions,
    },
  });

  const validated = applyValidatedReply({
    rawReply: input.rawLlmReply,
    plan: responsePlan,
    answerFirstEnabled: true,
    products: input.products,
  });

  return {
    responsePlan,
    finalReply: validated.finalReply,
    rawValidation: validated.rawValidation!,
    planValidation: validated.finalValidation!,
    deterministicFallbackUsed: validated.deterministicFallbackUsed,
    unplannedEntityIdsDetected: validated.unplannedEntityIdsDetected,
    catalogEntityIdsDelivered: validated.catalogEntityIdsDelivered,
    runtimeVersions: RUNTIME_VERSIONS,
  };
}
