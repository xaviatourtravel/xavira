import type { RetrievalSummary } from "@/modules/ai/types/context-retrieval";
import type { LeadQualificationSnapshot } from "@/modules/ai/types/lead-qualification";
import { buildPlaygroundInspectorView, formatPlaygroundConfidencePercent } from "@/modules/business-brain/lib/build-playground-inspector-view";
import type {
  PlaygroundAvailableContext,
  PlaygroundPreviewResult,
  PlaygroundTestResult,
} from "@/modules/business-brain/types/playground";
import type { PlaygroundAiScore } from "@/modules/business-brain/types/playground-ai-score";
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

export type CalculatePlaygroundAiScoreInput = {
  result: Omit<PlaygroundTestResult, "aiScore">;
  customerMessage: string;
  conversationHistory: WhatsAppConversationTurn[];
};

export function calculatePlaygroundAiScore(
  input: CalculatePlaygroundAiScoreInput,
): PlaygroundAiScore {
  const { result, customerMessage, conversationHistory } = input;
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
    overall: 0,
  };

  breakdown.overall = clampScore(
    breakdown.tone * 0.15 +
      breakdown.knowledge * 0.25 +
      breakdown.ruleCompliance * 0.25 +
      breakdown.completeness * 0.2 +
      breakdown.naturalness * 0.15,
  );

  return {
    breakdown,
    overallLabel: playgroundAiScoreLabel(breakdown.overall),
    dimensionLabels: labelPlaygroundAiScoreBreakdown(breakdown),
  };
}
