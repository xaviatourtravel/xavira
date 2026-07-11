import { buildHospitalityVoicePolicy } from "@/modules/ai/base-brain/hospitality-voice-policy";
import { DESKLABS_BASE_BRAIN_VERSION } from "@/modules/ai/base-brain/base-brain-version";
import { buildClaimPolicy, buildPlatformSafetyPolicy } from "@/modules/ai/base-brain/claim-policy";
import { buildClarificationPolicy, buildConversationPolicy } from "@/modules/ai/base-brain/conversation-policy";
import { buildCustomerServicePolicy } from "@/modules/ai/base-brain/customer-service-policy";
import { buildHandoffPolicy } from "@/modules/ai/base-brain/handoff-policy";
import {
  buildEmptyBrainPolicy,
  buildIntentFallbackPolicy,
  buildMissingInformationPolicy,
  buildPartialBrainPolicy,
  resolveIntentFallbackStrategy,
} from "@/modules/ai/base-brain/missing-information-policy";
import type { BusinessBrainCompleteness } from "@/modules/ai/base-brain/types";

export type BuildBaseBrainPolicyInput = {
  workspaceName: string;
  completeness: BusinessBrainCompleteness;
  intent: string;
  hasPriorBusinessReplies: boolean;
  isNewConversation: boolean;
};

export function buildBaseBrainPolicy(input: BuildBaseBrainPolicyInput): string {
  const fallbackStrategy = resolveIntentFallbackStrategy(input.intent);
  const partialPolicy = buildPartialBrainPolicy(input.completeness);
  const emptyPolicy = input.completeness === "empty" ? buildEmptyBrainPolicy() : "";

  return [
    `Desklabs Base Brain v${DESKLABS_BASE_BRAIN_VERSION}`,
    "",
    buildCustomerServicePolicy(input.workspaceName),
    "",
    buildHospitalityVoicePolicy(),
    "",
    buildClarificationPolicy(),
    "",
    buildConversationPolicy({
      hasPriorBusinessReplies: input.hasPriorBusinessReplies,
      isNewConversation: input.isNewConversation,
    }),
    "",
    buildMissingInformationPolicy(),
    emptyPolicy,
    partialPolicy,
    "",
    buildIntentFallbackPolicy(fallbackStrategy),
    "",
    buildHandoffPolicy(),
    "",
    buildClaimPolicy(),
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildPlatformSafetySection(): string {
  return buildPlatformSafetyPolicy();
}

export { DESKLABS_BASE_BRAIN_VERSION };
