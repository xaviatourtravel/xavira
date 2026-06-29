import type { ConversationContext } from "@/lib/intelligence/context/types";
import type { CustomerMemory } from "@/lib/intelligence/memory/types";
import type { IntentAnalysis } from "@/lib/intelligence/intent/types";
import type { ExtractedEntities } from "@/lib/intelligence/entities/types";

export interface EntityExtractionService {
  extract(
    context: ConversationContext,
    memory: CustomerMemory,
    intent: IntentAnalysis | null,
  ): ExtractedEntities;
}
