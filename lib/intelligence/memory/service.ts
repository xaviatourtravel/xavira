import type { ConversationContext } from "@/lib/intelligence/context/types";
import type { CustomerMemory } from "@/lib/intelligence/memory/types";

export interface MemoryService {
  analyze(context: ConversationContext): CustomerMemory;
}
