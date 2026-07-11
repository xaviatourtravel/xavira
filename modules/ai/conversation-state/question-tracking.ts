import type { QuestionSemanticKey } from "@/modules/ai/conversation-state/types";
import { MAX_QUESTIONS_ASKED } from "@/modules/ai/conversation-state/types";

export function mergeQuestionKeys(
  existing: QuestionSemanticKey[],
  incoming: QuestionSemanticKey[],
): QuestionSemanticKey[] {
  const merged = new Set<QuestionSemanticKey>(existing);
  for (const key of incoming) {
    merged.add(key);
  }

  return [...merged].slice(-MAX_QUESTIONS_ASKED);
}

export function isQuestionKeyBounded(keys: QuestionSemanticKey[]): boolean {
  return keys.length <= MAX_QUESTIONS_ASKED;
}
