import type { ConversationContext } from "@/lib/intelligence/context/types";
import type { CustomerMemory } from "@/lib/intelligence/memory/types";
import type { IntentAnalysis } from "@/lib/intelligence/intent/types";
import type { ExtractedEntities } from "@/lib/intelligence/entities/types";
import type { EmotionAnalysis } from "@/lib/intelligence/emotion/types";
import type { RecommendationSet } from "@/lib/intelligence/recommendation/types";

export interface RecommendationService {
  generate(
    context: ConversationContext,
    memory: CustomerMemory,
    intent: IntentAnalysis | null,
    entities: ExtractedEntities,
    emotion: EmotionAnalysis | null,
  ): RecommendationSet;
}
