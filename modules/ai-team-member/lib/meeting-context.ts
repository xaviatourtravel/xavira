import {
  buildRuntimeContext,
  buildRuntimePrompt,
} from "@/modules/ai/runtime/build-runtime-context";
import { retrieveRelevantContext } from "@/modules/ai/services/context-retrieval-engine";
import { buildBusinessBrainContext } from "@/modules/business-brain/services/context-builder";
import type { BusinessBrainContext } from "@/modules/business-brain/types/context";
import {
  MEETING_LIMITS,
  boundTranscript,
  type BrainId,
  type MeetingConversationTurn,
  type MeetingMode,
  type TranscriptEntry,
} from "@/modules/ai-team-member/lib/meeting-domain";
import type { ApprovedMemoryRepository } from "@/modules/ai-team-member/lib/meeting-memory-repository";
import { createEmptyApprovedMemoryRepository } from "@/modules/ai-team-member/lib/meeting-memory-repository";

export type MeetingContextBundle = {
  organizationId: string;
  brainId: BrainId;
  mode: MeetingMode;
  transcript: TranscriptEntry[];
  conversationHistory: MeetingConversationTurn[];
  approvedMemories: string[];
  runtimeContextText: string;
  businessContextText: string;
  usedBrainContext: boolean;
  contextChars: number;
};

function truncate(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, Math.max(0, max - 1)).trim()}…`;
}

function formatBusinessContext(context: BusinessBrainContext): string {
  const lines: Array<string | null> = [];

  if (context.companyDNA) {
    lines.push(
      `Company: ${truncate(context.companyDNA.companyName ?? "", 120)}`,
      context.companyDNA.about
        ? `About: ${truncate(context.companyDNA.about, 400)}`
        : null,
      context.companyDNA.industry
        ? `Industry: ${truncate(context.companyDNA.industry, 120)}`
        : null,
    );
  }

  for (const product of context.products.slice(0, 3)) {
    lines.push(
      `Product: ${truncate(product.name ?? "", 120)}`,
      product.description
        ? `Product summary: ${truncate(product.description, 240)}`
        : null,
    );
  }

  for (const article of context.knowledge.slice(0, 4)) {
    lines.push(
      `Knowledge: ${truncate(article.title ?? "", 120)}`,
      `Knowledge content: ${truncate(article.content ?? "", 320)}`,
    );
  }

  for (const document of context.documents.slice(0, 3)) {
    lines.push(
      `Document: ${truncate(document.name ?? "", 120)}`,
      document.description
        ? `Document note: ${truncate(document.description, 200)}`
        : null,
    );
  }

  for (const behavior of context.behaviors.slice(0, 6)) {
    if (!behavior.enabled) continue;
    lines.push(
      `Behavior (${behavior.type}): ${truncate(behavior.name ?? "", 120)}${
        behavior.description
          ? ` — ${truncate(behavior.description, 160)}`
          : ""
      }`,
    );
  }

  return lines.filter((line): line is string => Boolean(line)).join("\n");
}

export async function buildMeetingContextBundle(params: {
  organizationId: string;
  brainId: BrainId;
  mode: MeetingMode;
  transcript: TranscriptEntry[];
  conversationHistory?: MeetingConversationTurn[];
  question?: string;
  memoryRepository?: ApprovedMemoryRepository;
  loadBusinessBrain?: typeof buildBusinessBrainContext;
  workspaceName?: string;
  currentUser?: string;
}): Promise<MeetingContextBundle> {
  const transcript = boundTranscript(params.transcript);
  const conversationHistory = (params.conversationHistory ?? []).slice(
    -MEETING_LIMITS.conversationTurns,
  );
  const memoryRepository =
    params.memoryRepository ?? createEmptyApprovedMemoryRepository();
  const loadBusinessBrain =
    params.loadBusinessBrain ?? buildBusinessBrainContext;

  const runtime = buildRuntimeContext({
    workspaceId: params.organizationId,
    workspaceName: params.workspaceName,
    currentUser: params.currentUser,
    locale: "id",
  });
  const runtimeContextText = buildRuntimePrompt(runtime);

  const memories = await memoryRepository.listApprovedMemories({
    organizationId: params.organizationId,
    brainId: params.brainId,
  });
  const approvedMemories = memories
    .filter(
      (item) =>
        item.organizationId === params.organizationId &&
        item.brainId === params.brainId,
    )
    .map((item) => item.text.trim())
    .filter(Boolean)
    .slice(0, 20);

  let businessContextText = "";
  let usedBrainContext = false;

  if (params.mode === "ask" || params.mode === "raise_hand") {
    try {
      const brainResult = await loadBusinessBrain(params.organizationId, {
        customerMessage: params.question || transcript.at(-1)?.text || "",
      });
      const retrieved = retrieveRelevantContext({
        workspaceId: params.organizationId,
        customerMessage: params.question || transcript.at(-1)?.text || "",
        intent: "MEETING_ASK",
        businessBrainContext: brainResult,
      });
      businessContextText = formatBusinessContext({
        companyDNA: retrieved.companyDNA,
        products: retrieved.relevantProducts,
        knowledge: retrieved.relevantArticles,
        documents: retrieved.relevantDocuments,
        behaviors: retrieved.relevantBehaviors,
        handoverRules: retrieved.handoverRules,
        replyStyle: retrieved.replyStyle,
        qualificationRules: retrieved.qualificationRules,
      });
      usedBrainContext = Boolean(businessContextText.trim());
    } catch {
      businessContextText = "";
      usedBrainContext = false;
    }
  }

  businessContextText = truncate(
    businessContextText,
    MEETING_LIMITS.contextChars,
  );

  return {
    organizationId: params.organizationId,
    brainId: params.brainId,
    mode: params.mode,
    transcript,
    conversationHistory,
    approvedMemories,
    runtimeContextText,
    businessContextText,
    usedBrainContext,
    contextChars: businessContextText.length + runtimeContextText.length,
  };
}
