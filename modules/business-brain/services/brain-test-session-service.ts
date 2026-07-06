import { getPlaygroundConversationScenario } from "@/modules/business-brain/lib/playground-conversation-scenarios";
import {
  deleteBrainTestSession,
  insertBrainTestSession,
  listBrainTestSessions,
  updateBrainTestSessionTitle,
} from "@/modules/business-brain/repositories/brain-test-session-repository";
import type { SaveBrainTestSessionInput } from "@/modules/business-brain/schemas/brain-test-session";
import type {
  BrainTestSessionRecord,
  BrainTestSessionSummary,
} from "@/modules/business-brain/types/brain-test-session";
import type { PlaygroundTestResult } from "@/modules/business-brain/types/playground";
import type { SimulatorChatMessage } from "@/modules/business-brain/types/playground-simulator";

function toSummary(record: BrainTestSessionRecord): BrainTestSessionSummary {
  return {
    id: record.id,
    title: record.title,
    scenario: record.scenario,
    score: record.score,
    createdAt: record.createdAt,
    turnCount: record.conversation.length,
  };
}

function defaultTitle(
  conversation: SimulatorChatMessage[],
  scenario: string | null | undefined,
): string {
  if (scenario) {
    const match = getPlaygroundConversationScenario(scenario);
    if (match) {
      return match.label;
    }
  }

  const firstCustomer = conversation.find((message) => message.role === "customer");
  if (firstCustomer?.text.trim()) {
    const trimmed = firstCustomer.text.trim();
    return trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed;
  }

  return "Saved Test";
}

export async function getBrainTestSessions(
  workspaceId: string,
): Promise<BrainTestSessionRecord[]> {
  return listBrainTestSessions(workspaceId);
}

export async function getBrainTestSessionSummaries(
  workspaceId: string,
): Promise<BrainTestSessionSummary[]> {
  const sessions = await listBrainTestSessions(workspaceId);
  return sessions.map(toSummary);
}

export async function saveBrainTestSession(
  workspaceId: string,
  input: SaveBrainTestSessionInput,
): Promise<BrainTestSessionRecord> {
  if (input.conversation.length === 0) {
    throw new Error("Save a conversation with at least one message before saving.");
  }

  if (!input.conversation.some((message) => message.role === "ai")) {
    throw new Error("Save a conversation that includes at least one AI reply.");
  }

  const title = input.title?.trim() || defaultTitle(input.conversation, input.scenario ?? null);

  return insertBrainTestSession({
    workspaceId,
    title,
    scenario: input.scenario?.trim() || null,
    conversation: input.conversation as SimulatorChatMessage[],
    inspector: input.inspector as PlaygroundTestResult,
    score: input.score,
  });
}

export async function renameBrainTestSession(
  workspaceId: string,
  sessionId: string,
  title: string,
): Promise<BrainTestSessionRecord> {
  return updateBrainTestSessionTitle(workspaceId, sessionId, title.trim());
}

export async function removeBrainTestSession(
  workspaceId: string,
  sessionId: string,
): Promise<void> {
  await deleteBrainTestSession(workspaceId, sessionId);
}
