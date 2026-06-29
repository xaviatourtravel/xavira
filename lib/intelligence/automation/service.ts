import type { ConversationContext } from "@/lib/intelligence/context/types";
import type { IntentAnalysis } from "@/lib/intelligence/intent/types";
import type { EmotionAnalysis } from "@/lib/intelligence/emotion/types";
import type { RecommendationSet } from "@/lib/intelligence/recommendation/types";
import type { AutomationSignals } from "@/lib/intelligence/automation/types";

export interface AutomationService {
  evaluate(
    context: ConversationContext,
    intent: IntentAnalysis | null,
    emotion: EmotionAnalysis | null,
    recommendation: RecommendationSet,
  ): AutomationSignals;
}
