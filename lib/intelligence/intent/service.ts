import type { ConversationContext } from "@/lib/intelligence/context/types";
import type { CustomerMemory } from "@/lib/intelligence/memory/types";
import type { IntentAnalysis } from "@/lib/intelligence/intent/types";

export interface IntentService {
  analyze(
    context: ConversationContext,
    memory: CustomerMemory,
  ): IntentAnalysis | null;
}
