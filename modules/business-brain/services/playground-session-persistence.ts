import type { Json } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

import type { SimulatorChatMessage } from "@/modules/business-brain/types/playground-simulator";
import {
  EMPTY_PLAYGROUND_CONVERSATION_STATE,
  MAX_PLAYGROUND_CONVERSATION_TURNS,
  type PlaygroundActiveSessionRecord,
  type PlaygroundPersistedConversationState,
} from "@/modules/business-brain/types/playground-session-state";

type BrainTestSessionRow = {
  id: string;
  workspace_id: string;
  user_id: string | null;
  title: string;
  scenario: string | null;
  conversation: Json;
  inspector: Json;
  score: number;
  status: string;
  conversation_state: Json;
  created_at: string;
  updated_at: string;
};

function parseConversationState(value: unknown): PlaygroundPersistedConversationState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...EMPTY_PLAYGROUND_CONVERSATION_STATE };
  }

  const record = value as Partial<PlaygroundPersistedConversationState>;
  return {
    greetingSent: Boolean(record.greetingSent),
    collectedInformation: record.collectedInformation ?? {},
    questionsAsked: Array.isArray(record.questionsAsked) ? record.questionsAsked : [],
    selectedEntity: record.selectedEntity ?? null,
    catalogContext: record.catalogContext ?? null,
    currentIntent: record.currentIntent ?? null,
    handoffRequested: Boolean(record.handoffRequested),
    customerMemory: record.customerMemory ?? {},
    simulatedAttachments: Array.isArray(record.simulatedAttachments)
      ? record.simulatedAttachments
      : [],
  };
}

function mapRow(row: BrainTestSessionRow): PlaygroundActiveSessionRecord {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    title: row.title,
    scenario: row.scenario,
    conversation: row.conversation as SimulatorChatMessage[],
    conversationState: parseConversationState(row.conversation_state),
    inspector: (row.inspector as Record<string, unknown>) ?? {},
    score: Number(row.score),
    status: row.status === "active" ? "active" : "saved",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function boundConversation(messages: SimulatorChatMessage[]): SimulatorChatMessage[] {
  return messages.slice(-MAX_PLAYGROUND_CONVERSATION_TURNS);
}

export async function findActivePlaygroundSession(
  workspaceId: string,
  userId: string,
): Promise<PlaygroundActiveSessionRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_test_sessions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapRow(data as BrainTestSessionRow) : null;
}

export async function getPlaygroundSessionById(
  workspaceId: string,
  sessionId: string,
  userId: string,
): Promise<PlaygroundActiveSessionRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_test_sessions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapRow(data as BrainTestSessionRow) : null;
}

export async function createActivePlaygroundSession(input: {
  workspaceId: string;
  userId: string;
  title?: string;
}): Promise<PlaygroundActiveSessionRecord> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_test_sessions")
    .insert({
      workspace_id: input.workspaceId,
      user_id: input.userId,
      title: input.title?.trim() || "Playground Session",
      scenario: null,
      conversation: [] as unknown as Json,
      inspector: {} as unknown as Json,
      score: 0,
      status: "active",
      conversation_state: EMPTY_PLAYGROUND_CONVERSATION_STATE as unknown as Json,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRow(data as BrainTestSessionRow);
}

export async function updateActivePlaygroundSession(input: {
  workspaceId: string;
  sessionId: string;
  userId: string;
  conversation: SimulatorChatMessage[];
  conversationState: PlaygroundPersistedConversationState;
  inspector?: Record<string, unknown>;
  score?: number;
  scenario?: string | null;
}): Promise<PlaygroundActiveSessionRecord> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_test_sessions")
    .update({
      conversation: boundConversation(input.conversation) as unknown as Json,
      conversation_state: input.conversationState as unknown as Json,
      inspector: (input.inspector ?? {}) as unknown as Json,
      score: input.score ?? 0,
      scenario: input.scenario ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.sessionId)
    .eq("user_id", input.userId)
    .eq("status", "active")
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRow(data as BrainTestSessionRow);
}

export async function resetActivePlaygroundSession(
  workspaceId: string,
  userId: string,
  sessionId?: string,
): Promise<void> {
  const supabase = await createClient();
  let query = supabase
    .from("brain_test_sessions")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active");

  if (sessionId) {
    query = query.eq("id", sessionId);
  }

  const { error } = await query;
  if (error) {
    throw new Error(error.message);
  }
}

export async function getOrCreateActivePlaygroundSession(input: {
  workspaceId: string;
  userId: string;
  sessionId?: string | null;
}): Promise<PlaygroundActiveSessionRecord> {
  if (input.sessionId) {
    const existing = await getPlaygroundSessionById(
      input.workspaceId,
      input.sessionId,
      input.userId,
    );
    if (existing) {
      return existing;
    }
  }

  const active = await findActivePlaygroundSession(input.workspaceId, input.userId);
  if (active) {
    return active;
  }

  return createActivePlaygroundSession({
    workspaceId: input.workspaceId,
    userId: input.userId,
  });
}
