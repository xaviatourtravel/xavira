import type { RetrievalSummary } from "@/modules/ai/types/context-retrieval";
import {
  isConversationMemoryKey,
  MEMORY_KEY_LABELS,
  PLAYGROUND_MEMORY_KEYS,
} from "@/modules/ai/types/memory";
import type {
  PlaygroundAvailableContext,
  PlaygroundPreviewResult,
  PlaygroundTestResult,
} from "@/modules/business-brain/types/playground";
import type {
  PlaygroundInspectorMemoryRow,
  PlaygroundInspectorView,
} from "@/modules/business-brain/types/playground-inspector";
import type { PlaygroundConfidenceBreakdown } from "@/modules/business-brain/types/playground-confidence-breakdown";
import {
  buildPlaygroundConfidenceBreakdown,
  confidenceToneFromScore,
} from "@/modules/business-brain/lib/build-playground-confidence-breakdown";

const LOW_CONFIDENCE_THRESHOLD = 70;

const INTENT_KNOWLEDGE_WARNINGS: Array<{
  intents: string[];
  check: (summary: RetrievalSummary) => boolean;
  message: string;
}> = [
  {
    intents: ["REFUND"],
    check: (summary) => summary.articleCount === 0,
    message: "No refund policy found. AI may answer inaccurately.",
  },
  {
    intents: ["PAYMENT"],
    check: (summary) => summary.articleCount === 0,
    message: "No payment guide found. AI may answer inaccurately.",
  },
  {
    intents: ["VISA"],
    check: (summary) => summary.articleCount === 0,
    message: "No visa information found. AI may answer inaccurately.",
  },
  {
    intents: ["HALAL_FOOD"],
    check: (summary) => summary.articleCount === 0,
    message: "No halal food information found. AI may answer inaccurately.",
  },
  {
    intents: ["PACKAGE_INQUIRY", "PACKAGE_RECOMMENDATION", "PRICE_INQUIRY"],
    check: (summary) => summary.productCount === 0,
    message: "No matching products found. AI may answer inaccurately.",
  },
  {
    intents: ["BROCHURE_REQUEST", "ITINERARY_REQUEST"],
    check: (summary) => summary.documentCount === 0 && summary.articleCount === 0,
    message: "No brochure or itinerary content found. AI may answer inaccurately.",
  },
];

const MEMORY_LABEL_OVERRIDES: Record<string, string> = {
  departure_month: "Departure",
  passenger_count: "Passengers",
};

export function formatPlaygroundConfidencePercent(confidence: number): number {
  if (!Number.isFinite(confidence)) {
    return 0;
  }

  const normalized = confidence <= 1 ? confidence * 100 : confidence;
  return Math.round(Math.max(0, Math.min(100, normalized)));
}

function confidenceTone(percent: number): PlaygroundInspectorView["confidenceTone"] {
  return confidenceToneFromScore(percent);
}

function formatKnowledgeSourceLabel(label: string): string | null {
  const trimmed = label.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("Rule: ")) {
    return null;
  }

  if (trimmed.startsWith("Handover: ")) {
    return null;
  }

  if (trimmed === "Identity") {
    return "Company Identity";
  }

  if (trimmed.startsWith("Product: ")) {
    return `${trimmed.slice("Product: ".length)} Product`;
  }

  if (trimmed.startsWith("Knowledge: ")) {
    return trimmed.slice("Knowledge: ".length);
  }

  if (trimmed.startsWith("Document: ")) {
    return trimmed.slice("Document: ".length);
  }

  return trimmed;
}

function buildKnowledgeUsed(
  preview: PlaygroundPreviewResult,
  contextUsed: PlaygroundAvailableContext,
): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];

  const addLabel = (label: string | null) => {
    if (!label || seen.has(label)) {
      return;
    }

    seen.add(label);
    labels.push(label);
  };

  for (const sourceLabel of preview.sourceLabels) {
    addLabel(formatKnowledgeSourceLabel(sourceLabel));
  }

  if (labels.length > 0) {
    return labels;
  }

  if (contextUsed.companyDna.items.length > 0) {
    addLabel("Company Identity");
  }

  for (const product of contextUsed.products.items) {
    addLabel(`${product.label} Product`);
  }

  for (const article of contextUsed.knowledge.items) {
    addLabel(article.label);
  }

  for (const document of contextUsed.documents.items) {
    addLabel(document.label);
  }

  return labels;
}

function formatMemoryValue(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "Unknown";
}

function buildMemoryRows(result: Omit<PlaygroundTestResult, "aiScore">): PlaygroundInspectorMemoryRow[] {
  const rows: PlaygroundInspectorMemoryRow[] = [];
  const seen = new Set<string>();

  for (const key of PLAYGROUND_MEMORY_KEYS) {
    const label = MEMORY_LABEL_OVERRIDES[key] ?? MEMORY_KEY_LABELS[key];
    rows.push({
      label,
      value: formatMemoryValue(result.customerMemory[key]),
    });
    seen.add(key);
  }

  for (const item of result.customerMemoryUsed) {
    if (!isConversationMemoryKey(item.memory_key) || seen.has(item.memory_key)) {
      continue;
    }

    rows.push({
      label: MEMORY_LABEL_OVERRIDES[item.memory_key] ?? MEMORY_KEY_LABELS[item.memory_key],
      value: formatMemoryValue(item.memory_value),
    });
    seen.add(item.memory_key);
  }

  return rows;
}

function buildRulesApplied(contextUsed: PlaygroundAvailableContext): string[] {
  return contextUsed.behaviors.items.map((item) => item.label);
}

function buildSuggestedActions(preview: PlaygroundPreviewResult): string[] {
  const seen = new Set<string>();
  const actions: string[] = [];

  const addAction = (action: string | null | undefined) => {
    const trimmed = action?.trim();
    if (!trimmed || seen.has(trimmed)) {
      return;
    }

    seen.add(trimmed);
    actions.push(trimmed);
  };

  for (const action of preview.suggestedActions) {
    addAction(action);
  }

  for (const documentAction of preview.documentActions) {
    addAction(`Send ${documentAction.documentName}`);
  }

  return actions;
}

function buildWarnings(
  preview: PlaygroundPreviewResult,
  retrievalSummary: RetrievalSummary | undefined,
  contextUsed: PlaygroundAvailableContext,
  confidencePercent: number,
): string[] {
  const warnings: string[] = [];
  const seen = new Set<string>();

  const addWarning = (message: string) => {
    if (seen.has(message)) {
      return;
    }

    seen.add(message);
    warnings.push(message);
  };

  if (confidencePercent < LOW_CONFIDENCE_THRESHOLD) {
    addWarning("AI confidence is low. The response may be inaccurate.");
  }

  if (preview.handoffRequired) {
    addWarning(
      preview.handoffReason
        ? `Human handoff recommended: ${preview.handoffReason}`
        : "Human handoff is recommended for this conversation.",
    );
  }

  if (retrievalSummary) {
    const intent = retrievalSummary.intent.trim().toUpperCase();

    for (const rule of INTENT_KNOWLEDGE_WARNINGS) {
      if (rule.intents.includes(intent) && rule.check(retrievalSummary)) {
        addWarning(rule.message);
      }
    }
  }

  if (contextUsed.companyDna.items.length === 0) {
    addWarning("Company identity is incomplete. AI responses may lack brand context.");
  }

  if (
    retrievalSummary &&
    retrievalSummary.productCount === 0 &&
    retrievalSummary.articleCount === 0 &&
    retrievalSummary.documentCount === 0
  ) {
    addWarning("No relevant Business Brain content was retrieved for this question.");
  }

  return warnings;
}

export function buildPlaygroundInspectorView(
  result: Omit<PlaygroundTestResult, "aiScore">,
): PlaygroundInspectorView {
  const confidenceBreakdown = buildPlaygroundConfidenceBreakdown(result);
  const confidencePercent = confidenceBreakdown.overall;

  return {
    confidencePercent,
    confidenceBreakdown,
    confidenceTone: confidenceTone(confidencePercent),
    knowledgeUsed: buildKnowledgeUsed(result.preview, result.contextUsed),
    memoryRows: buildMemoryRows(result),
    rulesApplied: buildRulesApplied(result.contextUsed),
    suggestedActions: buildSuggestedActions(result.preview),
    warnings: buildWarnings(
      result.preview,
      result.retrievalSummary,
      result.contextUsed,
      confidencePercent,
    ),
    intent: result.retrievalSummary?.intent ?? null,
  };
}
