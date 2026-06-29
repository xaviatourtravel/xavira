import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import type { IntelligenceSnapshot } from "@/lib/intelligence/types/snapshot";
import type { MemoryService } from "@/lib/intelligence/memory/service";
import type { IntentService } from "@/lib/intelligence/intent/service";
import type { EntityExtractionService } from "@/lib/intelligence/entities/service";
import type { EmotionService } from "@/lib/intelligence/emotion/service";
import type { RecommendationService } from "@/lib/intelligence/recommendation/service";
import type { AutomationService } from "@/lib/intelligence/automation/service";

export type IntelligenceEngineInput = {
  conversation: OmnichannelConversationDetail;
  organizationId: string;
};

export interface IntelligenceEngine {
  generateSnapshot(input: IntelligenceEngineInput): Promise<IntelligenceSnapshot>;
}

export type IntelligenceEngineDependencies = {
  memory: MemoryService;
  intent: IntentService;
  entities: EntityExtractionService;
  emotion: EmotionService;
  recommendation: RecommendationService;
  automation: AutomationService;
};

export const INTELLIGENCE_ENGINE_VERSION = "0.1.0-stub";
