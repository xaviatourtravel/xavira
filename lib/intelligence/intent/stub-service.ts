import type { IntentService } from "@/lib/intelligence/intent/service";
import type { ConversationContext } from "@/lib/intelligence/context/types";
import type { CustomerMemory } from "@/lib/intelligence/memory/types";
import type { IntentAnalysis } from "@/lib/intelligence/intent/types";
import { INTENT_LABELS } from "@/lib/intelligence/intent/types";
import {
  detectTravelHints,
  hashString,
} from "@/lib/intelligence/stub/travel-heuristics";

export class StubIntentService implements IntentService {
  analyze(
    context: ConversationContext,
    _memory: CustomerMemory,
  ): IntentAnalysis | null {
    if (!context.lastIncomingText) {
      return null;
    }

    const seed = hashString(context.conversationId);
    const hints = detectTravelHints(context.lastIncomingText, seed);

    return {
      primary: hints.intent,
      label: INTENT_LABELS[hints.intent],
      confidence: context.incomingMessageCount > 2 ? "high" : "medium",
      rationale: `Derived from latest customer message on ${context.channelLabel}.`,
    };
  }
}
