import type { ConversationContext } from "@/lib/intelligence/context/types";
import type { CustomerMemory } from "@/lib/intelligence/memory/types";
import type { IntentAnalysis } from "@/lib/intelligence/intent/types";
import type { EmotionAnalysis } from "@/lib/intelligence/emotion/types";

export interface EmotionService {
  analyze(
    context: ConversationContext,
    memory: CustomerMemory,
    intent: IntentAnalysis | null,
  ): EmotionAnalysis | null;
}
