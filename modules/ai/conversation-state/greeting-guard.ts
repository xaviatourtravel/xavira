import type { GreetingGuardResult } from "@/modules/ai/conversation-state/types";

const OPENING_GREETING_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /^halo\s+kak(?:\s+[^\n,!?.]+)?[,!.\s]*/i, label: "indonesian_halo_kak" },
  { pattern: /^hai\s+kak(?:\s+[^\n,!?.]+)?[,!.\s]*/i, label: "indonesian_hai_kak" },
  { pattern: /^halo[,!.\s]*/i, label: "indonesian_halo" },
  { pattern: /^hai[,!.\s]*/i, label: "indonesian_hai" },
  { pattern: /^hi[,!.\s]*/i, label: "english_hi" },
  { pattern: /^hello[,!.\s]*/i, label: "english_hello" },
  {
    pattern: /^selamat\s+(pagi|siang|sore|malam)(?:\s+kak)?[,!.\s]*/i,
    label: "indonesian_selamat",
  },
  {
    pattern: /^assalamu['’]?alaikum(?:\s+wr\.?\s+wb\.?)?[,!.\s]*/i,
    label: "islamic_assalamu",
  },
  { pattern: /^salam[,!.\s]*/i, label: "islamic_salam" },
  {
    pattern: /^terima\s+kasih\s+telah\s+menghubungi[^.?!]*[.?!]?\s*/i,
    label: "thank_you_contact",
  },
  { pattern: /^senang\s+bisa\s+membantu[^.?!]*[.?!]?\s*/i, label: "happy_to_help" },
  { pattern: /^perkenalkan[,!.\s]*/i, label: "introduction" },
];

const BUSINESS_INTRO_PATTERNS = [
  /^perkenalkan[,!.\s]*/i,
  /^kami\s+dari\b[^.?!]*[.?!]?\s*/i,
  /^di\s+.+\s+kami\b[^.?!]*[.?!]?\s*/i,
];

export function detectOpeningGreeting(reply: string): boolean {
  const trimmed = reply.trim();
  return OPENING_GREETING_PATTERNS.some(({ pattern }) => pattern.test(trimmed));
}

export function detectBusinessIntroduction(reply: string): boolean {
  const trimmed = reply.trim();
  return BUSINESS_INTRO_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function stripForbiddenOpeningGreeting(reply: string): {
  reply: string;
  removed: boolean;
  labels: string[];
} {
  let result = reply.trim();
  const labels: string[] = [];
  let removed = false;

  for (const { pattern, label } of OPENING_GREETING_PATTERNS) {
    const next = result.replace(pattern, "").trim();
    if (next !== result) {
      result = next;
      removed = true;
      labels.push(label);
    }
  }

  result = result.replace(/^[,.\s-]+/, "").trim();

  return { reply: result, removed, labels };
}

export function applyGreetingGuard(input: {
  reply: string;
  greetingAllowed: boolean;
  fallbackReply: string;
}): GreetingGuardResult {
  if (input.greetingAllowed) {
    return {
      reply: input.reply.trim(),
      greetingDetected: detectOpeningGreeting(input.reply),
      greetingRemoved: false,
      usedFallback: false,
      changes: [],
    };
  }

  const initialDetected = detectOpeningGreeting(input.reply);
  const stripped = stripForbiddenOpeningGreeting(input.reply);

  if (!stripped.removed) {
    return {
      reply: input.reply.trim(),
      greetingDetected: initialDetected,
      greetingRemoved: false,
      usedFallback: false,
      changes: [],
    };
  }

  if (!stripped.reply) {
    return {
      reply: input.fallbackReply,
      greetingDetected: true,
      greetingRemoved: true,
      usedFallback: true,
      changes: ["greeting_removed_used_fallback", ...stripped.labels],
    };
  }

  const recheck = stripForbiddenOpeningGreeting(stripped.reply);
  const finalReply = recheck.reply || input.fallbackReply;

  return {
    reply: finalReply,
    greetingDetected: true,
    greetingRemoved: true,
    usedFallback: !recheck.reply,
    changes: recheck.reply
      ? ["greeting_removed", ...stripped.labels]
      : ["greeting_removed_used_fallback", ...stripped.labels],
  };
}
