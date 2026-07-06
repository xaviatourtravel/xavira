import type { Json } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

import type { BrainTestSessionRecord } from "@/modules/business-brain/types/brain-test-session";
import type { PlaygroundTestResult } from "@/modules/business-brain/types/playground";
import type { SimulatorChatMessage } from "@/modules/business-brain/types/playground-simulator";

export type BrainTestSessionRow = {
  id: string;
  workspace_id: string;
  title: string;
  scenario: string | null;
  conversation: Json;
  inspector: Json;
  score: number;
  created_at: string;
};

function mapRow(row: BrainTestSessionRow): BrainTestSessionRecord {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    title: row.title,
    scenario: row.scenario,
    conversation: row.conversation as SimulatorChatMessage[],
    inspector: row.inspector as PlaygroundTestResult,
    score: Number(row.score),
    createdAt: row.created_at,
  };
}

export async function listBrainTestSessions(
  workspaceId: string,
): Promise<BrainTestSessionRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_test_sessions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as BrainTestSessionRow[]).map(mapRow);
}

export async function insertBrainTestSession(input: {
  workspaceId: string;
  title: string;
  scenario: string | null;
  conversation: SimulatorChatMessage[];
  inspector: PlaygroundTestResult;
  score: number;
}): Promise<BrainTestSessionRecord> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_test_sessions")
    .insert({
      workspace_id: input.workspaceId,
      title: input.title,
      scenario: input.scenario,
      conversation: input.conversation as unknown as Json,
      inspector: input.inspector as unknown as Json,
      score: input.score,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRow(data as BrainTestSessionRow);
}

export async function updateBrainTestSessionTitle(
  workspaceId: string,
  sessionId: string,
  title: string,
): Promise<BrainTestSessionRecord> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_test_sessions")
    .update({ title })
    .eq("workspace_id", workspaceId)
    .eq("id", sessionId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRow(data as BrainTestSessionRow);
}

export async function deleteBrainTestSession(
  workspaceId: string,
  sessionId: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("brain_test_sessions")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", sessionId);

  if (error) {
    throw new Error(error.message);
  }
}
