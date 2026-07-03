import type {
  ImproveReplyQualityParams,
  ImproveReplyQualityResult,
} from "@/modules/ai/types/ai-reply-quality-guard";
import {
  DEFAULT_MAX_REPLY_CHARACTERS,
  DETAILED_EXPLANATION_KEYWORDS,
} from "@/modules/ai/types/ai-reply-quality-guard";

const DESKLABS_PATTERN = /\bdesklabs\b/gi;

const BAD_PHRASE_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bsebagai\s+ai\b/gi, label: "removed_chatbot_phrase" },
  { pattern: /\bsaya\s+adalah\s+chatbot\b/gi, label: "removed_chatbot_phrase" },
  { pattern: /\bsaya\s+chatbot\b/gi, label: "removed_chatbot_phrase" },
  {
    pattern: /\bberdasarkan\s+data\s+yang\s+tersedia\b/gi,
    label: "removed_robotic_phrase",
  },
  {
    pattern: /\bdengan\s+senang\s+hati\s+kami\s+informasikan\s+bahwa\b/gi,
    label: "removed_robotic_phrase",
  },
  {
    pattern: /\bterima\s+kasih\s+telah\s+menghubungi\b/gi,
    label: "removed_thank_you_opener",
  },
  { pattern: /\bsebagai\s+asisten\s+ai\b/gi, label: "removed_chatbot_phrase" },
];

const GREETING_PATTERNS = [
  /^halo\s+kak(?:\s+[^\n,!?.]+)?[,!.\s]*/i,
  /^hai\s+kak(?:\s+[^\n,!?.]+)?[,!.\s]*/i,
  /^halo[,!.\s]*/i,
  /^hai[,!.\s]*/i,
  /^selamat\s+(pagi|siang|sore|malam)(?:\s+kak)?[,!.\s]*/i,
];

const REINTRODUCTION_PATTERNS = [
  /^terima\s+kasih\s+sudah\s+bertanya\b[^.?!]*[.?!]?\s*/i,
  /^mengenai\s+pertanyaan\s+(?:kak|anda)\b[^.?!]*[.?!]?\s*/i,
  /^untuk\s+pertanyaan\s+(?:kak|anda)\b[^.?!]*[.?!]?\s*/i,
  /^mengenai\s+paket\b[^.?!]*[.?!]?\s*/i,
  /^untuk\s+paket\b[^.?!]*[.?!]?\s*/i,
  /^baik\s+kak[,!.\s]*terima\s+kasih\s+sudah\s+menghubungi\b[^.?!]*[.?!]?\s*/i,
];

const CTA_PATTERNS = [
  /\b(boleh|bisa)\s+(info|kasih\s+tahu|share)\b[^?]*\?/gi,
  /\b(mau|ingin)\s+(tanya|tau)\b[^?]*\?/gi,
  /\bhubungi\s+kami\b[^?]*\?/gi,
  /\bsilakan\s+(hubungi|chat)\b[^?]*\?/gi,
];

const SHORT_FOLLOW_UP_MAX_LENGTH = 80;

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function hasPriorOutgoingReplies(history: ImproveReplyQualityParams["conversationHistory"]) {
  return history.some((turn) => turn.sender === "ai" || turn.sender === "human");
}

function customerWantsDetailedExplanation(customerMessage: string): boolean {
  const normalized = customerMessage.trim().toLowerCase();
  return DETAILED_EXPLANATION_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function isShortFollowUp(
  customerMessage: string,
  history: ImproveReplyQualityParams["conversationHistory"],
): boolean {
  const trimmed = customerMessage.trim();
  if (!trimmed || trimmed.length > SHORT_FOLLOW_UP_MAX_LENGTH) {
    return false;
  }

  return hasPriorOutgoingReplies(history);
}

function extractCustomerNames(
  history: ImproveReplyQualityParams["conversationHistory"],
  customerMessage: string,
): string[] {
  const names = new Set<string>();

  for (const turn of history) {
    if (turn.sender !== "customer") continue;
    const firstWord = turn.text.trim().split(/\s+/)[0];
    if (firstWord && firstWord.length >= 2 && /^[a-zA-Z]/.test(firstWord)) {
      names.add(firstWord);
    }
  }

  const customerFirst = customerMessage.trim().split(/\s+/)[0];
  if (customerFirst && customerFirst.length >= 2 && /^[a-zA-Z]/.test(customerFirst)) {
    names.add(customerFirst);
  }

  return [...names];
}

function removeBadPhrases(reply: string, changes: string[]) {
  let result = reply;

  if (DESKLABS_PATTERN.test(result)) {
    result = result.replace(DESKLABS_PATTERN, "tim kami");
    changes.push("removed_desklabs");
  }

  for (const { pattern, label } of BAD_PHRASE_PATTERNS) {
    if (pattern.test(result)) {
      result = result.replace(pattern, "").trim();
      changes.push(label);
    }
  }

  return result;
}

function applyGreetingRules(
  reply: string,
  hasPriorReplies: boolean,
  changes: string[],
) {
  if (!hasPriorReplies) {
    return reply;
  }

  let result = reply;
  for (const pattern of GREETING_PATTERNS) {
    const next = result.replace(pattern, "").trim();
    if (next !== result) {
      result = next;
      changes.push("removed_repeated_greeting");
    }
  }

  return result;
}

function removeRepeatedCustomerNames(
  reply: string,
  names: string[],
  changes: string[],
) {
  if (names.length === 0) {
    return reply;
  }

  let result = reply;
  let keptFirstName = false;

  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(`\\bkak\\s+${escaped}\\b`, "gi"),
      new RegExp(`\\b${escaped}\\b`, "gi"),
    ];

    for (const pattern of patterns) {
      result = result.replace(pattern, (match, offset) => {
        if (!keptFirstName && offset < 50) {
          keptFirstName = true;
          return match;
        }
        changes.push("removed_repeated_customer_name");
        return "";
      });
    }
  }

  return result.replace(/\s{2,}/g, " ").trim();
}

function removeFollowUpReintroduction(
  reply: string,
  isFollowUp: boolean,
  changes: string[],
) {
  if (!isFollowUp) {
    return reply;
  }

  let result = reply;
  for (const pattern of REINTRODUCTION_PATTERNS) {
    const next = result.replace(pattern, "").trim();
    if (next !== result) {
      result = next;
      changes.push("removed_follow_up_reintroduction");
    }
  }

  return result;
}

function limitQuestions(reply: string, changes: string[]) {
  const questionMatches = [...reply.matchAll(/[^?]*\?/g)];
  if (questionMatches.length <= 1) {
    return reply;
  }

  const firstQuestionEnd = (questionMatches[0].index ?? 0) + questionMatches[0][0].length;
  const trimmed = reply.slice(0, firstQuestionEnd).trim();

  const trailingQuestions = reply
    .slice(firstQuestionEnd)
    .split(/(?<=[.!?])\s+/)
    .filter((part) => part.includes("?"));

  if (trailingQuestions.length === 0) {
    return reply;
  }

  let withoutExtraCtas = trimmed;
  for (const pattern of CTA_PATTERNS) {
    withoutExtraCtas = withoutExtraCtas.replace(pattern, "").trim();
  }
  changes.push("limited_to_one_question");
  return withoutExtraCtas || trimmed;
}

function limitParagraphs(reply: string, changes: string[]) {
  const paragraphs = reply
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (paragraphs.length <= 3) {
    return reply;
  }

  changes.push("limited_paragraphs");
  return paragraphs.slice(0, 3).join("\n\n");
}

function truncateAtSentence(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  const slice = text.slice(0, maxLength);
  const lastSentenceEnd = Math.max(
    slice.lastIndexOf("."),
    slice.lastIndexOf("!"),
    slice.lastIndexOf("?"),
  );

  if (lastSentenceEnd > maxLength * 0.6) {
    return slice.slice(0, lastSentenceEnd + 1).trim();
  }

  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace > maxLength * 0.7) {
    return `${slice.slice(0, lastSpace).trim()}…`;
  }

  return `${slice.trim()}…`;
}

function applyLengthRules(
  reply: string,
  customerMessage: string,
  changes: string[],
) {
  const maxLength = customerWantsDetailedExplanation(customerMessage)
    ? DEFAULT_MAX_REPLY_CHARACTERS * 2
    : DEFAULT_MAX_REPLY_CHARACTERS;

  if (reply.length <= maxLength) {
    return reply;
  }

  changes.push("trimmed_length");
  return truncateAtSentence(reply, maxLength);
}

function dedupeChanges(changes: string[]): string[] {
  return [...new Set(changes)];
}

export function improveReplyQuality(
  params: ImproveReplyQualityParams,
): ImproveReplyQualityResult {
  const changes: string[] = [];
  const hasPriorReplies = hasPriorOutgoingReplies(params.conversationHistory);
  const followUp = isShortFollowUp(params.customerMessage, params.conversationHistory);
  const customerNames = extractCustomerNames(
    params.conversationHistory,
    params.customerMessage,
  );

  void params.businessBrainContext;

  let reply = params.reply.trim();

  reply = removeBadPhrases(reply, changes);
  reply = applyGreetingRules(reply, hasPriorReplies, changes);
  reply = removeRepeatedCustomerNames(reply, customerNames, changes);
  reply = removeFollowUpReintroduction(reply, followUp, changes);
  reply = limitQuestions(reply, changes);
  reply = limitParagraphs(reply, changes);
  reply = applyLengthRules(reply, params.customerMessage, changes);
  reply = normalizeWhitespace(reply);

  if (!reply) {
    reply = params.reply.trim();
  }

  const uniqueChanges = dedupeChanges(changes);

  return {
    reply,
    changed: reply !== params.reply.trim(),
    changes: uniqueChanges,
  };
}
