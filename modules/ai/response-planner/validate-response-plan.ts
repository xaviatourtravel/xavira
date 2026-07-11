import type { ResponsePlan, PlanValidationResult } from "@/modules/ai/response-planner/types";
import { containsBannedInterrogationPhrase } from "@/modules/ai/base-brain/hospitality-voice-policy";
import { detectInterrogation, isQuestionOnlyResponse } from "@/modules/ai/response-planner/interrogation-policy";

const UNSUPPORTED_AVAILABILITY_PATTERNS = [
  /\bada\s+kak\b/i,
  /\bada\b[^.?!]{0,40}\b(pilihan|destinasi|jadwal|slot|seat)\b/i,
  /\btersedia\b/i,
  /\bmasih\s+ada\b/i,
  /\bbisa\s+berangkat\b/i,
];

const UNSUPPORTED_PRICE_PATTERNS = [
  /\brp\s*[\d.,]+/i,
  /\b\d{1,3}(\.\d{3})+\b/,
  /\$\s*[\d.,]+/i,
];

function containsUnsupportedAvailability(reply: string, plan: ResponsePlan): boolean {
  if (plan.verifiedFacts.some((fact) => fact.field === "departure_date")) {
    return false;
  }
  if (plan.requestType !== "SCHEDULE_OR_DEPARTURE" && plan.requestType !== "AVAILABILITY") {
    return false;
  }
  return UNSUPPORTED_AVAILABILITY_PATTERNS.some((pattern) => pattern.test(reply));
}

function containsUnsupportedPrice(reply: string, plan: ResponsePlan): boolean {
  if (plan.verifiedFacts.some((fact) => fact.field === "price")) {
    return false;
  }
  if (plan.requestType !== "PRICE") return false;
  return UNSUPPORTED_PRICE_PATTERNS.some((pattern) => pattern.test(reply));
}

function hasDirectAnswer(reply: string, plan: ResponsePlan): boolean {
  if (!plan.directAnswerRequired) return true;
  if (plan.directAnswerTemplate) {
    const keyTokens = plan.directAnswerTemplate
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .filter((token) => token.length >= 4);
    return keyTokens.some((token) => reply.toLowerCase().includes(token));
  }
  return reply.trim().length > 20;
}

function countQuestions(reply: string): number {
  return (reply.match(/\?/g) ?? []).length;
}

export function validateResponseAgainstPlan(
  reply: string,
  plan: ResponsePlan,
): PlanValidationResult {
  const violations: string[] = [];
  const trimmed = reply.trim();

  const unsupportedAvailability = containsUnsupportedAvailability(trimmed, plan);
  const unsupportedPrice = containsUnsupportedPrice(trimmed, plan);
  const unsupportedClaimDetected = unsupportedAvailability || unsupportedPrice;
  const unsupportedClaimType = unsupportedPrice
    ? "price"
    : unsupportedAvailability
      ? "availability"
      : null;

  if (unsupportedClaimDetected) {
    violations.push(`unsupported_${unsupportedClaimType}`);
  }

  if (plan.handoffRequired && !/\b(tim|sales|human|konfirmasi|confirmation)\b/i.test(trimmed)) {
    violations.push("handoff_not_preserved");
  }

  if (plan.attachmentAction && !plan.handoffRequired) {
    violations.push("attachment_required");
  }

  const directAnswerPresent = hasDirectAnswer(trimmed, plan);
  if (plan.directAnswerRequired && !directAnswerPresent) {
    violations.push("missing_direct_answer");
  }

  if (countQuestions(trimmed) > 1) {
    violations.push("too_many_follow_up_questions");
  }

  if (containsBannedInterrogationPhrase(trimmed)) {
    violations.push("bureaucratic_interrogation");
  }

  if (
    (plan.catalogResults?.length ?? 0) > 0 &&
    isQuestionOnlyResponse(trimmed) &&
    plan.directAnswerRequired
  ) {
    violations.push("question_only_with_catalog_data");
  }

  if (detectInterrogation(trimmed, plan)) {
    violations.push("interrogation_detected");
  }

  if (plan.directAnswerRequired && plan.followUpQuestion) {
    const questionIndex = trimmed.indexOf("?");
    const answerTokens = (plan.directAnswerTemplate ?? "").toLowerCase().split(/\s+/).filter(Boolean);
    if (questionIndex >= 0 && answerTokens.length > 0) {
      const beforeQuestion = trimmed.slice(0, questionIndex).toLowerCase();
      if (!answerTokens.some((token) => token.length >= 4 && beforeQuestion.includes(token))) {
        violations.push("follow_up_before_answer");
      }
    }
  }

  const passed =
    violations.length === 0 &&
    (!plan.directAnswerRequired || directAnswerPresent) &&
    (!plan.handoffRequired || /\b(tim|sales|human|konfirmasi|confirmation)\b/i.test(trimmed));

  const answerFirstPassed =
    passed &&
    !unsupportedClaimDetected &&
    (!plan.directAnswerRequired || directAnswerPresent);

  let fallbackReply: string | null = null;
  if (!passed) {
    fallbackReply =
      plan.directAnswerTemplate ??
      (plan.handoffRequired
        ? plan.directAnswerTemplate
        : plan.followUpQuestion) ??
      trimmed;
  }

  return {
    passed,
    directAnswerPresent,
    unsupportedClaimDetected,
    unsupportedClaimType,
    handoffPreserved: !plan.handoffRequired || /\b(tim|sales|human|konfirmasi|confirmation)\b/i.test(trimmed),
    attachmentPreserved: !plan.attachmentAction || Boolean(plan.attachmentAction.documentId),
    answerFirstPassed,
    violations,
    fallbackReply: !passed ? fallbackReply ?? plan.directAnswerTemplate ?? plan.followUpQuestion : null,
    usedDeterministicFallback: !passed,
  };
}
