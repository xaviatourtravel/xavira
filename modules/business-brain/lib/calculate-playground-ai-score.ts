import type { RetrievalSummary } from "@/modules/ai/types/context-retrieval";
import { containsBannedInterrogationPhrase, passesHospitalityTone } from "@/modules/ai/base-brain/hospitality-voice-policy";
import { detectInterrogation, detectWrongEntity, isQuestionOnlyResponse } from "@/modules/ai/response-planner/interrogation-policy";
import {
  isProductEligibleForCountryQuery,
} from "@/modules/ai/response-planner/geographic-eligibility";
import { canonicalizeCountryQuery } from "@/modules/ai/response-planner/product-geography";
import { detectWrongMonthInReply } from "@/modules/ai/response-planner/validate-catalog-consistency";
import { hashMessageText } from "@/modules/ai/response-planner/turn-context";
import { PLAYGROUND_SCORER_VERSION } from "@/modules/ai/runtime/runtime-versions";
import type { ProductContext } from "@/modules/business-brain/types/context";
import type { LeadQualificationSnapshot } from "@/modules/ai/types/lead-qualification";
import type {
  PlanValidationResult,
  ResponsePlan,
} from "@/modules/ai/response-planner/types";
import { buildPlaygroundInspectorView, formatPlaygroundConfidencePercent } from "@/modules/business-brain/lib/build-playground-inspector-view";
import type {
  PlaygroundAvailableContext,
  PlaygroundPreviewResult,
  PlaygroundTestResult,
} from "@/modules/business-brain/types/playground";
import type {
  PlaygroundAiScore,
  PlaygroundGroundingDiagnostics,
} from "@/modules/business-brain/types/playground-ai-score";
import {
  labelPlaygroundAiScoreBreakdown,
  playgroundAiScoreLabel,
} from "@/modules/business-brain/types/playground-ai-score";
import type { WhatsAppConversationTurn } from "@/modules/business-brain/types/prompt";

const CHATBOT_PHRASE_PATTERNS = [
  /\bsebagai\s+ai\b/i,
  /\bsaya\s+adalah\s+chatbot\b/i,
  /\bsaya\s+chatbot\b/i,
  /\bberdasarkan\s+data\s+yang\s+tersedia\b/i,
  /\bsebagai\s+asisten\s+ai\b/i,
  /\bas\s+an\s+ai\b/i,
  /\bi\s+am\s+a\s+chatbot\b/i,
];

const ROBOTIC_PHRASE_PATTERNS = [
  /\bdengan\s+senang\s+hati\s+kami\s+informasikan\s+bahwa\b/i,
  /\bterima\s+kasih\s+telah\s+menghubungi\b/i,
  /\bterima\s+kasih\s+sudah\s+bertanya\b/i,
];

const GREETING_PATTERNS = [
  /^halo\s+kak/i,
  /^hai\s+kak/i,
  /^halo[,!.\s]/i,
  /^hai[,!.\s]/i,
  /^selamat\s+(pagi|siang|sore|malam)/i,
];

const REINTRODUCTION_PATTERNS = [
  /^terima\s+kasih\s+sudah\s+bertanya\b/i,
  /^mengenai\s+pertanyaan\s+(?:kak|anda)\b/i,
  /^untuk\s+pertanyaan\s+(?:kak|anda)\b/i,
  /^mengenai\s+paket\b/i,
  /^untuk\s+paket\b/i,
];

const FRIENDLY_TONE_PATTERNS = [/\bkak\b/i, /\bka\b/i, /\bterima\s+kasih\b/i, /\bbaik\b/i];

const CTA_PATTERNS = [/\?[\s]*$/, /\b(boleh|bisa)\s+(info|kasih\s+tahu|share)\b/i, /\b(mau|ingin)\s+(tanya|tau)\b/i];

const FALLBACK_REPLY_MARKERS = [
  "kami bantu cek dulu",
  "sebentar kami lanjutkan",
  "tim kami akan",
];

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function countPatternMatches(text: string, patterns: RegExp[]): number {
  return patterns.reduce((count, pattern) => (pattern.test(text) ? count + 1 : count), 0);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
}

function hasPriorBusinessReplies(history: WhatsAppConversationTurn[]): boolean {
  return history.some((turn) => turn.sender === "ai" || turn.sender === "human");
}

function isKnowledgeIntent(intent: string): boolean {
  return [
    "REFUND",
    "PAYMENT",
    "VISA",
    "HALAL_FOOD",
    "PACKAGE_INQUIRY",
    "PACKAGE_RECOMMENDATION",
    "PRICE_INQUIRY",
    "BROCHURE_REQUEST",
    "ITINERARY_REQUEST",
  ].includes(intent);
}

function calculateHospitalityScore(reply: string): number {
  let score = 85;
  if (containsBannedInterrogationPhrase(reply)) {
    score -= 45;
  }
  if (FRIENDLY_TONE_PATTERNS.some((pattern) => pattern.test(reply))) {
    score += 8;
  }
  return clampScore(score);
}

function calculateUsefulnessScore(args: {
  reply: string;
  responsePlan: ResponsePlan | null;
}): number {
  if (!args.responsePlan) return 70;
  let score = 75;

  if ((args.responsePlan.catalogResults?.length ?? 0) > 0) {
    const mentionedCatalog = args.responsePlan.catalogResults.some((item) =>
      args.reply.toLowerCase().includes(item.displayName.toLowerCase().slice(0, 8)),
    );
    score += mentionedCatalog ? 15 : -25;
  }

  if (args.responsePlan.directAnswerTemplate && args.responsePlan.directAnswerTemplate.trim() === args.reply.trim()) {
    score += 15;
  }

  if (args.responsePlan.directAnswerRequired && args.responsePlan.directAnswerTemplate) {
    const tokens = args.responsePlan.directAnswerTemplate
      .toLowerCase()
      .split(/\s+/)
      .filter((token) => token.length >= 5);
    if (tokens.some((token) => args.reply.toLowerCase().includes(token))) {
      score += 10;
    }
  }

  if (args.responsePlan.requestType === "GREETING" && /ada yang bisa kami bantu/i.test(args.reply)) {
    score += 10;
  }

  return clampScore(score);
}

function calculateCatalogCoverageScore(responsePlan: ResponsePlan | null): number {
  if (!responsePlan) return 70;
  if (responsePlan.requestType !== "CATALOG_DISCOVERY" && responsePlan.requestType !== "DESTINATION_DISCOVERY") {
    return 80;
  }
  if (responsePlan.catalogResults.length === 0) return 45;
  return clampScore(70 + Math.min(25, responsePlan.catalogResults.length * 5));
}

function calculateInterrogationAvoidanceScore(args: {
  reply: string;
  responsePlan: ResponsePlan | null;
}): number {
  if (!args.responsePlan) return 75;
  let score = 85;

  if (detectInterrogation(args.reply, args.responsePlan)) {
    score -= 40;
  }

  if (
    (args.responsePlan.catalogResults?.length ?? 0) > 0 &&
    isQuestionOnlyResponse(args.reply)
  ) {
    score -= 35;
  }

  return clampScore(score);
}

function calculateCorrectProductResolutionScore(args: {
  responsePlan: ResponsePlan | null;
  customerMessage: string;
}): number {
  if (!args.responsePlan) return 75;
  if (detectWrongEntity(args.responsePlan, args.customerMessage)) {
    return 20;
  }
  if (args.responsePlan.destinationMatchType === "no_match" && args.responsePlan.selectedEntity) {
    return 25;
  }
  return 85;
}

function calculateKnowledgeScore(args: {
  preview: PlaygroundPreviewResult;
  retrievalSummary: RetrievalSummary | undefined;
  contextUsed: PlaygroundAvailableContext;
  warningCount: number;
}): number {
  const confidence = formatPlaygroundConfidencePercent(args.preview.confidence);
  let score = confidence * 0.45;

  const summary = args.retrievalSummary;
  if (summary) {
    if (summary.productCount > 0) score += 12;
    if (summary.articleCount > 0) score += 12;
    if (summary.documentCount > 0) score += 8;
    if (summary.behaviorCount > 0) score += 5;

    const intent = summary.intent.trim().toUpperCase();
    if (isKnowledgeIntent(intent)) {
      const hasRelevantContent =
        summary.productCount > 0 ||
        summary.articleCount > 0 ||
        summary.documentCount > 0;
      score += hasRelevantContent ? 10 : -20;
    }
  }

  if (args.preview.sourceLabels.length >= 2) {
    score += 8;
  } else if (args.preview.sourceLabels.length === 1) {
    score += 4;
  }

  if (args.contextUsed.companyDna.items.length > 0) {
    score += 5;
  }

  score -= args.warningCount * 8;

  if (args.preview.handoffRequired) {
    score -= 12;
  }

  return clampScore(score);
}

function calculateRuleComplianceScore(args: {
  reply: string;
  preview: PlaygroundPreviewResult;
  rulesApplied: string[];
  retrievalSummary: RetrievalSummary | undefined;
}): number {
  let score = 100;

  if (/\bdesklabs\b/i.test(args.reply)) {
    score -= 45;
  }

  score -= countPatternMatches(args.reply, CHATBOT_PHRASE_PATTERNS) * 20;

  if (args.rulesApplied.length === 0) {
    score -= 15;
  } else {
    score += Math.min(10, args.rulesApplied.length * 2);
  }

  const intent = args.retrievalSummary?.intent.trim().toUpperCase() ?? "";
  const humanRequiredIntents = [
    "NEGOTIATION",
    "REFUND",
    "PAYMENT_PROOF",
    "COMPLAINT",
    "PHONE_CALL",
    "PRIVATE_TRIP",
    "BOOKING_CONFIRMATION",
  ];

  if (humanRequiredIntents.includes(intent) && !args.preview.handoffRequired) {
    score -= 25;
  }

  if (args.preview.handoffRequired) {
    score -= 5;
  }

  return clampScore(score);
}

function calculateToneScore(args: {
  reply: string;
  hasPriorReplies: boolean;
}): number {
  let score = 82;

  score -= countPatternMatches(args.reply, CHATBOT_PHRASE_PATTERNS) * 18;
  score -= countPatternMatches(args.reply, ROBOTIC_PHRASE_PATTERNS) * 12;

  if (FRIENDLY_TONE_PATTERNS.some((pattern) => pattern.test(args.reply))) {
    score += 10;
  }

  if (!args.hasPriorReplies && GREETING_PATTERNS.some((pattern) => pattern.test(args.reply))) {
    score += 8;
  }

  if (args.hasPriorReplies && GREETING_PATTERNS.some((pattern) => pattern.test(args.reply))) {
    score -= 8;
  }

  if (/[A-Z]{5,}/.test(args.reply)) {
    score -= 10;
  }

  return clampScore(score);
}

function calculateCompletenessScore(args: {
  reply: string;
  customerMessage: string;
  preview: PlaygroundPreviewResult;
  leadQualification: LeadQualificationSnapshot;
}): number {
  const replyLength = args.reply.trim().length;
  let score = 55;

  if (replyLength >= 40 && replyLength <= 500) {
    score += 20;
  } else if (replyLength >= 20) {
    score += 10;
  } else {
    score -= 15;
  }

  if (CTA_PATTERNS.some((pattern) => pattern.test(args.reply))) {
    score += 12;
  }

  if (args.preview.suggestedActions.length > 0 || args.preview.documentActions.length > 0) {
    score += 10;
  }

  const customerTokens = new Set(tokenize(args.customerMessage));
  const replyTokens = tokenize(args.reply);
  const overlap = replyTokens.filter((token) => customerTokens.has(token)).length;
  if (overlap > 0) {
    score += Math.min(12, overlap * 4);
  }

  score += args.leadQualification.completionScore * 0.12;

  if (FALLBACK_REPLY_MARKERS.some((marker) => args.reply.toLowerCase().includes(marker))) {
    score -= 25;
  }

  if (args.preview.handoffRequired && replyLength < 40) {
    score -= 10;
  }

  return clampScore(score);
}

function calculateNaturalnessScore(args: {
  reply: string;
  hasPriorReplies: boolean;
}): number {
  let score = 88;

  score -= countPatternMatches(args.reply, CHATBOT_PHRASE_PATTERNS) * 15;
  score -= countPatternMatches(args.reply, ROBOTIC_PHRASE_PATTERNS) * 12;

  if (args.hasPriorReplies && REINTRODUCTION_PATTERNS.some((pattern) => pattern.test(args.reply))) {
    score -= 18;
  }

  if (args.reply.length > 650) {
    score -= 12;
  }

  if (args.reply.split(/\n{2,}/).length > 4) {
    score -= 8;
  }

  if (FRIENDLY_TONE_PATTERNS.some((pattern) => pattern.test(args.reply))) {
    score += 6;
  }

  return clampScore(score);
}

function calculateGroundednessScore(args: {
  reply: string;
  responsePlan: ResponsePlan | null;
  planValidation: PlanValidationResult | null;
  preview: PlaygroundPreviewResult;
}): number {
  if (!args.responsePlan || !args.planValidation) {
    return 70;
  }

  let score = 85;

  if (args.planValidation.unsupportedClaimDetected) {
    score -= 55;
  }

  if (args.responsePlan.directAnswerRequired && !args.planValidation.directAnswerPresent) {
    score -= 30;
  }

  if (args.responsePlan.handoffRequired && !args.planValidation.handoffPreserved) {
    score -= 35;
  }

  if (args.responsePlan.attachmentAction && !args.planValidation.attachmentPreserved) {
    score -= 25;
  }

  if (args.responsePlan.groundedSourceCount > 0 && args.preview.sourceLabels.length === 0) {
    score -= 15;
  } else if (args.responsePlan.groundedSourceCount > 0) {
    score += Math.min(10, args.responsePlan.groundedSourceCount * 3);
  }

  if (args.planValidation.answerFirstPassed) {
    score += 8;
  }

  return clampScore(score);
}

function calculateAnswerRelevanceScore(args: {
  reply: string;
  customerMessage: string;
  responsePlan: ResponsePlan | null;
  planValidation: PlanValidationResult | null;
}): number {
  if (!args.responsePlan || !args.planValidation) {
    const customerTokens = new Set(tokenize(args.customerMessage));
    const replyTokens = tokenize(args.reply);
    const overlap = replyTokens.filter((token) => customerTokens.has(token)).length;
    return clampScore(65 + Math.min(20, overlap * 5));
  }

  let score = 80;

  if (args.responsePlan.directAnswerRequired && !args.planValidation.directAnswerPresent) {
    score -= 40;
  }

  if (args.planValidation.violations.includes("follow_up_before_answer")) {
    score -= 35;
  }

  if (args.planValidation.violations.includes("too_many_follow_up_questions")) {
    score -= 20;
  }

  if (
    args.responsePlan.responseAction === "ASK_ONE_CLARIFYING_QUESTION" &&
    args.reply.includes("?")
  ) {
    score += 8;
  }

  if (args.responsePlan.handoffRequired && args.planValidation.handoffPreserved) {
    score += 12;
  }

  if (args.planValidation.answerFirstPassed) {
    score += 10;
  }

  return clampScore(score);
}

function buildGroundingDiagnostics(args: {
  responsePlan: ResponsePlan | null;
  rawPlanValidation: PlanValidationResult | null;
  planValidation: PlanValidationResult | null;
  preview: PlaygroundPreviewResult;
  rawReply?: string | null;
  customerMessage?: string;
  turnId?: string | null;
  deterministicFallbackUsed?: boolean;
  unplannedEntityIdsDetected?: string[];
  catalogEntityIdsDelivered?: string[];
}): PlaygroundGroundingDiagnostics | undefined {
  if (!args.responsePlan) {
    return undefined;
  }

  const geo = args.responsePlan.geographicDiagnostics;
  const staleTurnDetected = Boolean(
    args.turnId && args.responsePlan.turn.turnId !== args.turnId,
  ) || Boolean(
    args.turnId &&
      args.responsePlan.turn.turnId === args.turnId &&
      args.customerMessage &&
      hashMessageText(args.customerMessage) !== args.responsePlan.turn.latestMessageTextHash,
  );

  return {
    requestType: args.responsePlan.requestType,
    selectedEntity: args.responsePlan.selectedEntity?.displayName ?? null,
    selectedEntitySource: args.responsePlan.selectedEntity?.selectionSource ?? null,
    interpretedPeriod: args.responsePlan.interpretedPeriod,
    answerability: args.responsePlan.answerability,
    responseAction: args.responsePlan.responseAction,
    directAnswerRequired: args.responsePlan.directAnswerRequired,
    directAnswerPresent: args.planValidation?.directAnswerPresent ?? false,
    answerFirstPassed: args.planValidation?.answerFirstPassed ?? false,
    verifiedFactCount: args.responsePlan.verifiedFacts.length,
    groundedSourceCount: args.responsePlan.groundedSourceCount,
    unsupportedClaimDetected:
      args.rawPlanValidation?.unsupportedClaimDetected ??
      args.planValidation?.unsupportedClaimDetected ??
      false,
    unsupportedClaimType:
      args.rawPlanValidation?.unsupportedClaimType ??
      args.planValidation?.unsupportedClaimType ??
      null,
    handoffRequired: args.responsePlan.handoffRequired,
    handoffPreserved: args.planValidation?.handoffPreserved ?? true,
    attachmentRequired: Boolean(args.responsePlan.attachmentAction),
    attachmentPreserved: args.planValidation?.attachmentPreserved ?? true,
    followUpQuestionKey: args.responsePlan.followUpQuestionKey,
    deterministicFallbackUsed:
      args.deterministicFallbackUsed ??
      args.planValidation?.usedDeterministicFallback ??
      false,
    rawModelReplyPreview: args.rawReply?.slice(0, 120) ?? null,
    finalReplyPreview: args.preview.aiReply.slice(0, 120),
    greetingAllowed: args.responsePlan.greetingAllowed,
    greetingType: args.responsePlan.greetingType,
    companyNameUsed: args.responsePlan.companyNameUsed,
    catalogQueryType: args.responsePlan.catalogQueryType,
    catalogQueryValue: args.responsePlan.catalogQueryValue,
    catalogResultCount: args.responsePlan.catalogResults.length,
    catalogEntityIds: args.responsePlan.catalogResults.map((item) => item.entityId),
    selectionConfidence: args.responsePlan.selectionConfidence,
    destinationMatchType: args.responsePlan.destinationMatchType,
    priceFieldsFound: args.responsePlan.priceFieldsFound,
    hospitalityPassed: passesHospitalityTone(args.preview.aiReply),
    interrogationDetected: detectInterrogation(args.preview.aiReply, args.responsePlan),
    wrongEntityDetected: detectWrongEntity(args.responsePlan, args.customerMessage ?? ""),
    geographicDiagnostics: args.responsePlan.geographicDiagnostics,
    catalogContradictionDetected:
      args.planValidation?.catalogContradictionDetected ??
      args.rawPlanValidation?.catalogContradictionDetected ??
      false,
    geographicViolationDetected:
      args.planValidation?.geographicViolationDetected ??
      args.rawPlanValidation?.geographicViolationDetected ??
      false,
    requestedPeriodType: args.responsePlan.geographicDiagnostics?.requestedPeriodType ?? null,
    requestedPeriodStart: args.responsePlan.geographicDiagnostics?.requestedPeriodStart ?? null,
    requestedPeriodEnd: args.responsePlan.geographicDiagnostics?.requestedPeriodEnd ?? null,
    requestedPeriodMonth: args.responsePlan.geographicDiagnostics?.requestedPeriodMonth ?? null,
    requestedPeriodYear: args.responsePlan.geographicDiagnostics?.requestedPeriodYear ?? null,
    requestedPeriodTimezone: args.responsePlan.geographicDiagnostics?.requestedPeriodTimezone ?? null,
    matchingDepartureDates: geo?.matchingDepartureDates ?? [],
    scheduleGrounded: geo?.scheduleGrounded ?? false,
    turnId: args.responsePlan.turn.turnId,
    responsePlannerVersion: args.responsePlan.turn.runtimeVersions.responsePlannerVersion,
    geographicEligibilityVersion: args.responsePlan.turn.runtimeVersions.geographicEligibilityVersion,
    catalogValidatorVersion: args.responsePlan.turn.runtimeVersions.catalogValidatorVersion,
    playgroundScorerVersion: PLAYGROUND_SCORER_VERSION,
    promptCompilerVersion: args.responsePlan.turn.runtimeVersions.promptCompilerVersion,
    latestMessageIntent: args.responsePlan.turn.latestMessageIntent,
    previousSelectedEntity: args.responsePlan.turn.previousSelectedEntity?.displayName ?? null,
    currentSelectedEntity: args.responsePlan.selectedEntity?.displayName ?? null,
    selectionOverrideReason: args.responsePlan.turn.selectionOverrideReason,
    geographicQueryType: args.responsePlan.catalogQueryType,
    geographicQueryValue: args.responsePlan.catalogQueryValue,
    exactMatchEntityIds: geo?.exactMatchEntityIds ?? [],
    alternativeEntityIds: geo?.alternativeEntityIds ?? [],
    excludedEntityIds: geo?.excludedEntityIds ?? [],
    catalogEntityIdsDelivered:
      args.catalogEntityIdsDelivered ??
      args.responsePlan.catalogResults.map((item) => item.entityId),
    unplannedEntityIdsDetected: args.unplannedEntityIdsDetected ?? [],
    requestedPeriod: args.responsePlan.interpretedPeriod,
    staleTurnDetected,
  };
}

function detectWrongCountryInPlan(
  responsePlan: ResponsePlan,
  products: ProductContext[],
): boolean {
  if (responsePlan.catalogQueryType !== "country" || !responsePlan.catalogQueryValue) {
    return false;
  }
  const canonical = canonicalizeCountryQuery(responsePlan.catalogQueryValue);
  if (!canonical) return false;
  return responsePlan.catalogResults.some((result) => {
    const product = products.find((item) => item.id === result.entityId);
    return product ? !isProductEligibleForCountryQuery(product, canonical) : false;
  });
}

function applyHardScoreCaps(args: {
  breakdown: PlaygroundAiScore["breakdown"];
  responsePlan: ResponsePlan | null;
  rawPlanValidation: PlanValidationResult | null;
  planValidation: PlanValidationResult | null;
  reply: string;
  rawReply?: string | null;
  customerMessage: string;
  products?: ProductContext[];
  staleTurnDetected?: boolean;
  unplannedEntityIdsDetected?: string[];
  selectionOverrideReason?: string | null;
}): PlaygroundAiScore["breakdown"] {
  if (!args.responsePlan) {
    return args.breakdown;
  }

  let { overall, answerRelevance, modelGeneration, tone } = args.breakdown;

  const rawValidation = args.rawPlanValidation ?? args.planValidation;
  if (rawValidation?.unsupportedClaimDetected) {
    modelGeneration = Math.min(modelGeneration, 40);
    overall = Math.min(overall, 40);
  }

  if (args.responsePlan.handoffRequired && rawValidation && !rawValidation.handoffPreserved) {
    modelGeneration = Math.min(modelGeneration, 50);
    overall = Math.min(overall, 50);
  }

  if (
    args.responsePlan.directAnswerRequired &&
    rawValidation &&
    !rawValidation.directAnswerPresent
  ) {
    modelGeneration = Math.min(modelGeneration, 60);
    overall = Math.min(overall, 60);
  }

  if (rawValidation?.violations.includes("follow_up_before_answer")) {
    answerRelevance = Math.min(answerRelevance, 50);
  }

  if (detectWrongEntity(args.responsePlan, args.customerMessage)) {
    overall = Math.min(overall, 30);
  }

  if (
    (args.responsePlan.catalogResults?.length ?? 0) > 0 &&
    containsBannedInterrogationPhrase(args.reply)
  ) {
    overall = Math.min(overall, 50);
  }

  if (
    (args.responsePlan.catalogResults?.length ?? 0) > 0 &&
    ["CATALOG_DISCOVERY", "DESTINATION_DISCOVERY"].includes(args.responsePlan.requestType) &&
    !args.responsePlan.catalogResults.some((item) =>
      args.reply.toLowerCase().includes(item.displayName.toLowerCase().slice(0, 10)),
    )
  ) {
    overall = Math.min(overall, 50);
  }

  if (
    (args.responsePlan.catalogResults?.length ?? 0) > 0 &&
    isQuestionOnlyResponse(args.reply)
  ) {
    overall = Math.min(overall, 55);
  }

  if (containsBannedInterrogationPhrase(args.reply)) {
    tone = Math.min(tone, 50);
    overall = Math.min(overall, 55);
  }

  if (rawValidation?.catalogContradictionDetected) {
    overall = Math.min(overall, 40);
    modelGeneration = Math.min(modelGeneration, 40);
  }

  if (rawValidation?.geographicViolationDetected) {
    overall = Math.min(overall, 30);
    answerRelevance = Math.min(answerRelevance, 30);
  }

  if (
    args.responsePlan &&
    args.products?.length &&
    detectWrongCountryInPlan(args.responsePlan, args.products)
  ) {
    overall = Math.min(overall, 30);
    answerRelevance = Math.min(answerRelevance, 30);
  }

  if (detectWrongMonthInReply(args.reply, args.responsePlan)) {
    overall = Math.min(overall, 30);
    answerRelevance = Math.min(answerRelevance, 30);
  }

  if (
    args.responsePlan?.requestType === "SCHEDULE_OR_DEPARTURE" &&
    args.responsePlan.interpretedPeriod &&
    !args.responsePlan.selectedEntity
  ) {
    answerRelevance = Math.min(answerRelevance, 40);
  }

  if (args.staleTurnDetected) {
    overall = Math.min(overall, 20);
    modelGeneration = Math.min(modelGeneration, 20);
  }

  if (
    args.selectionOverrideReason &&
    args.responsePlan?.selectedEntity?.entityId === args.responsePlan.turn.previousSelectedEntity?.entityId
  ) {
    answerRelevance = Math.min(answerRelevance, 30);
    overall = Math.min(overall, 30);
  }

  if ((args.unplannedEntityIdsDetected?.length ?? 0) > 0) {
    overall = Math.min(overall, 30);
    answerRelevance = Math.min(answerRelevance, 30);
    modelGeneration = Math.min(modelGeneration, 30);
  }

  if (
    args.responsePlan?.requestType === "SCHEDULE_OR_DEPARTURE" &&
    !args.responsePlan.geographicDiagnostics?.scheduleGrounded &&
    /\b(beberapa|several|ada)\b[^.?!]{0,30}\b(jadwal|keberangkatan|schedule)\b/i.test(args.reply)
  ) {
    overall = Math.min(overall, 40);
    modelGeneration = Math.min(modelGeneration, 40);
  }

  if (
    args.responsePlan?.requestType === "SCHEDULE_OR_DEPARTURE" &&
    !args.responsePlan.geographicDiagnostics?.scheduleGrounded
  ) {
    overall = Math.min(overall, 30);
  }

  if (
    args.responsePlan?.requestType === "GEOGRAPHIC_CONFIRMATION" &&
    /tim kami akan membantu agar penjelasannya lebih nyaman/i.test(args.rawReply ?? args.reply)
  ) {
    overall = Math.min(overall, 50);
    modelGeneration = Math.min(modelGeneration, 50);
  }

  return {
    ...args.breakdown,
    overall,
    answerRelevance,
    modelGeneration,
    tone,
  };
}

export type CalculatePlaygroundAiScoreInput = {
  result: Omit<PlaygroundTestResult, "aiScore">;
  customerMessage: string;
  conversationHistory: WhatsAppConversationTurn[];
  responsePlan?: ResponsePlan | null;
  planValidation?: PlanValidationResult | null;
  rawPlanValidation?: PlanValidationResult | null;
  rawReply?: string | null;
  products?: ProductContext[];
  turnId?: string | null;
  deterministicFallbackUsed?: boolean;
  unplannedEntityIdsDetected?: string[];
  catalogEntityIdsDelivered?: string[];
};

export function calculatePlaygroundAiScore(
  input: CalculatePlaygroundAiScoreInput,
): PlaygroundAiScore {
  const { result, customerMessage, conversationHistory } = input;
  const responsePlan = input.responsePlan ?? null;
  const planValidation = input.planValidation ?? null;
  const rawPlanValidation = input.rawPlanValidation ?? null;
  const rawReply = input.rawReply ?? null;
  const reply = result.preview.aiReply;
  const hasPriorReplies = hasPriorBusinessReplies(conversationHistory);
  const inspectorView = buildPlaygroundInspectorView(result);

  const breakdown = {
    tone: calculateToneScore({ reply, hasPriorReplies }),
    knowledge: calculateKnowledgeScore({
      preview: result.preview,
      retrievalSummary: result.retrievalSummary,
      contextUsed: result.contextUsed,
      warningCount: inspectorView.warnings.length,
    }),
    ruleCompliance: calculateRuleComplianceScore({
      reply,
      preview: result.preview,
      rulesApplied: inspectorView.rulesApplied,
      retrievalSummary: result.retrievalSummary,
    }),
    completeness: calculateCompletenessScore({
      reply,
      customerMessage,
      preview: result.preview,
      leadQualification: result.leadQualification,
    }),
    naturalness: calculateNaturalnessScore({ reply, hasPriorReplies }),
    groundedness: calculateGroundednessScore({
      reply,
      responsePlan,
      planValidation,
      preview: result.preview,
    }),
    answerRelevance: calculateAnswerRelevanceScore({
      reply,
      customerMessage,
      responsePlan,
      planValidation,
    }),
    modelGeneration: calculateGroundednessScore({
      reply: rawReply ?? reply,
      responsePlan,
      planValidation: rawPlanValidation ?? planValidation,
      preview: result.preview,
    }),
    finalDeliverySafety: calculateGroundednessScore({
      reply,
      responsePlan,
      planValidation,
      preview: result.preview,
    }),
    overall: 0,
  };

  const usePlanScoring = Boolean(responsePlan && planValidation);

  const hospitalityScore = calculateHospitalityScore(reply);
  const usefulnessScore = calculateUsefulnessScore({ reply, responsePlan });
  const catalogCoverageScore = calculateCatalogCoverageScore(responsePlan);
  const interrogationScore = calculateInterrogationAvoidanceScore({ reply, responsePlan });
  const productResolutionScore = calculateCorrectProductResolutionScore({
    responsePlan,
    customerMessage,
  });

  breakdown.overall = clampScore(
    usePlanScoring
      ? breakdown.finalDeliverySafety * 0.25 +
          breakdown.answerRelevance * 0.15 +
          breakdown.modelGeneration * 0.1 +
          breakdown.ruleCompliance * 0.1 +
          breakdown.completeness * 0.08 +
          hospitalityScore * 0.1 +
          usefulnessScore * 0.12 +
          catalogCoverageScore * 0.05 +
          interrogationScore * 0.05 +
          productResolutionScore * 0.1
      : breakdown.tone * 0.15 +
          breakdown.knowledge * 0.25 +
          breakdown.ruleCompliance * 0.25 +
          breakdown.completeness * 0.2 +
          breakdown.naturalness * 0.15,
  );

  const staleTurnDetected = Boolean(
    input.turnId && responsePlan && responsePlan.turn.turnId !== input.turnId,
  ) || Boolean(
    input.turnId &&
      responsePlan &&
      responsePlan.turn.turnId === input.turnId &&
      hashMessageText(customerMessage) !== responsePlan.turn.latestMessageTextHash,
  );

  const cappedBreakdown = applyHardScoreCaps({
    breakdown,
    responsePlan,
    rawPlanValidation,
    planValidation,
    reply,
    rawReply,
    customerMessage,
    products: input.products,
    staleTurnDetected,
    unplannedEntityIdsDetected: input.unplannedEntityIdsDetected,
    selectionOverrideReason: responsePlan?.turn.selectionOverrideReason ?? null,
  });

  return {
    breakdown: cappedBreakdown,
    overallLabel: playgroundAiScoreLabel(cappedBreakdown.overall),
    finalDeliveryLabel: playgroundAiScoreLabel(cappedBreakdown.finalDeliverySafety),
    modelGenerationLabel: playgroundAiScoreLabel(cappedBreakdown.modelGeneration),
    dimensionLabels: labelPlaygroundAiScoreBreakdown(cappedBreakdown),
    groundingDiagnostics: buildGroundingDiagnostics({
      responsePlan,
      rawPlanValidation,
      planValidation,
      preview: result.preview,
      rawReply,
      customerMessage,
      turnId: input.turnId ?? responsePlan?.turn.turnId ?? null,
      deterministicFallbackUsed: input.deterministicFallbackUsed,
      unplannedEntityIdsDetected: input.unplannedEntityIdsDetected,
      catalogEntityIdsDelivered: input.catalogEntityIdsDelivered,
    }),
  };
}
