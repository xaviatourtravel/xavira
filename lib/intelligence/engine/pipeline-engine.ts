import {
  buildConversationContext,
  hasConversationSignal,
} from "@/lib/intelligence/context/build-context";
import { StubAutomationService } from "@/lib/intelligence/automation/stub-service";
import { StubEmotionService } from "@/lib/intelligence/emotion/stub-service";
import { StubEntityExtractionService } from "@/lib/intelligence/entities/stub-service";
import type {
  IntelligenceEngine,
  IntelligenceEngineDependencies,
  IntelligenceEngineInput,
} from "@/lib/intelligence/engine/types";
import { StubIntentService } from "@/lib/intelligence/intent/stub-service";
import { StubMemoryService } from "@/lib/intelligence/memory/stub-service";
import { StubRecommendationService } from "@/lib/intelligence/recommendation/stub-service";
import {
  buildSummary,
  detectTravelHints,
  hashString,
  resolveScoreLabel,
} from "@/lib/intelligence/stub/travel-heuristics";
import type { IntelligenceSnapshot } from "@/lib/intelligence/types/snapshot";
import type { ExtractedEntities } from "@/lib/intelligence/entities/types";
import { ENTITY_FIELD_LABELS } from "@/lib/intelligence/entities/types";

const EMPTY_ENTITIES: ExtractedEntities = {
  fields: (
    Object.entries(ENTITY_FIELD_LABELS) as Array<
      [ExtractedEntities["fields"][number]["field"], string]
    >
  ).map(([field, label]) => ({
    field,
    label,
    value: null,
    confidence: "low" as const,
  })),
};

function buildPendingSnapshot(
  input: IntelligenceEngineInput,
): IntelligenceSnapshot {
  const context = buildConversationContext(
    input.conversation,
    input.organizationId,
  );

  return {
    id: `intel-${context.conversationId}-pending`,
    conversationId: context.conversationId,
    generatedAt: new Date().toISOString(),
    state: "pending",
    source: "stub",
    context,
    memory: { slices: [], updatedAt: new Date().toISOString() },
    intent: null,
    entities: EMPTY_ENTITIES,
    emotion: null,
    recommendation: { primary: null, items: [] },
    automation: { decisions: [] },
    summary: null,
    scores: {
      leadScore: null,
      leadScoreLabel: null,
      revenuePotentialIdr: null,
    },
  };
}

function runPipeline(
  input: IntelligenceEngineInput,
  deps: IntelligenceEngineDependencies,
): IntelligenceSnapshot {
  const context = buildConversationContext(
    input.conversation,
    input.organizationId,
  );

  if (!hasConversationSignal(context)) {
    return buildPendingSnapshot(input);
  }

  const memory = deps.memory.analyze(context);
  const intent = deps.intent.analyze(context, memory);
  const entities = deps.entities.extract(context, memory, intent);
  const emotion = deps.emotion.analyze(context, memory, intent);
  const recommendation = deps.recommendation.generate(
    context,
    memory,
    intent,
    entities,
    emotion,
  );
  const automation = deps.automation.evaluate(
    context,
    intent,
    emotion,
    recommendation,
  );

  const seed = hashString(context.conversationId);
  const hints = detectTravelHints(context.lastIncomingText ?? "", seed);
  const leadScore = 58 + (seed % 35);
  const budgetField = entities.fields.find((field) => field.field === "budget");
  const revenuePotentialIdr =
    budgetField?.value != null
      ? Number(budgetField.value) + (seed % 5) * 1_500_000
      : Number(hints.budget);

  return {
    id: `intel-${context.conversationId}-${Date.now()}`,
    conversationId: context.conversationId,
    generatedAt: new Date().toISOString(),
    state: "ready",
    source: "stub",
    context,
    memory,
    intent,
    entities,
    emotion,
    recommendation,
    automation,
    summary: buildSummary(context, hints),
    scores: {
      leadScore,
      leadScoreLabel: resolveScoreLabel(leadScore),
      revenuePotentialIdr,
    },
  };
}

export class PipelineIntelligenceEngine implements IntelligenceEngine {
  constructor(private readonly deps: IntelligenceEngineDependencies) {}

  async generateSnapshot(
    input: IntelligenceEngineInput,
  ): Promise<IntelligenceSnapshot> {
    return runPipeline(input, this.deps);
  }

  generateSnapshotSync(input: IntelligenceEngineInput): IntelligenceSnapshot {
    return runPipeline(input, this.deps);
  }
}

const DEFAULT_DEPS: IntelligenceEngineDependencies = {
  memory: new StubMemoryService(),
  intent: new StubIntentService(),
  entities: new StubEntityExtractionService(),
  emotion: new StubEmotionService(),
  recommendation: new StubRecommendationService(),
  automation: new StubAutomationService(),
};

export function createDefaultIntelligenceEngine(): PipelineIntelligenceEngine {
  return new PipelineIntelligenceEngine(DEFAULT_DEPS);
}

let defaultEngine: PipelineIntelligenceEngine | null = null;

export function getIntelligenceEngine(): PipelineIntelligenceEngine {
  if (!defaultEngine) {
    defaultEngine = createDefaultIntelligenceEngine();
  }
  return defaultEngine;
}

export function generateIntelligenceSnapshotSync(
  input: IntelligenceEngineInput,
): IntelligenceSnapshot {
  return getIntelligenceEngine().generateSnapshotSync(input);
}

export async function generateIntelligenceSnapshot(
  input: IntelligenceEngineInput,
): Promise<IntelligenceSnapshot> {
  return getIntelligenceEngine().generateSnapshot(input);
}
