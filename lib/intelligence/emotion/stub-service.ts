import type { EmotionService } from "@/lib/intelligence/emotion/service";
import type { ConversationContext } from "@/lib/intelligence/context/types";
import type { CustomerMemory } from "@/lib/intelligence/memory/types";
import type { IntentAnalysis } from "@/lib/intelligence/intent/types";
import type { EmotionAnalysis } from "@/lib/intelligence/emotion/types";
import { EMOTION_LABELS } from "@/lib/intelligence/emotion/types";
import {
  detectTravelHints,
  hashString,
} from "@/lib/intelligence/stub/travel-heuristics";

export class StubEmotionService implements EmotionService {
  analyze(
    context: ConversationContext,
    _memory: CustomerMemory,
    _intent: IntentAnalysis | null,
  ): EmotionAnalysis | null {
    if (!context.lastIncomingText) {
      return null;
    }

    const seed = hashString(context.conversationId);
    const hints = detectTravelHints(context.lastIncomingText, seed);
    const indicators: string[] = [];

    if (context.lastIncomingText.includes("!")) {
      indicators.push("Exclamation marks in message");
    }
    if (context.lastIncomingText.toLowerCase().includes("segera")) {
      indicators.push("Urgency language detected");
    }
    if (hints.emotion === "positive") {
      indicators.push("Enthusiastic inquiry tone");
    }

    return {
      primary: hints.emotion,
      label: EMOTION_LABELS[hints.emotion],
      confidence: indicators.length > 0 ? "high" : "medium",
      indicators,
    };
  }
}
