import type {
  BrainId,
  MeetingConversationTurn,
  MeetingMode,
} from "@/modules/ai-team-member/lib/meeting-domain";
import {
  MEETING_LIMITS,
  boundConversationHistory,
} from "@/modules/ai-team-member/lib/meeting-domain";

export type BrainConversationState = {
  turns: MeetingConversationTurn[];
};

export type ConversationByBrain = Record<BrainId, BrainConversationState>;

export function createEmptyConversationByBrain(): ConversationByBrain {
  return {
    desklabs: { turns: [] },
    kreatifpedia: { turns: [] },
    piatur: { turns: [] },
    founder: { turns: [] },
  };
}

export function appendConversationTurn(params: {
  state: ConversationByBrain;
  brainId: BrainId;
  turn: Omit<MeetingConversationTurn, "id" | "createdAt"> & {
    id?: string;
    createdAt?: string;
  };
  now?: Date;
}): ConversationByBrain {
  const next = { ...params.state };
  const current = next[params.brainId] ?? { turns: [] };
  const turn: MeetingConversationTurn = {
    id: params.turn.id ?? crypto.randomUUID(),
    role: params.turn.role,
    text: params.turn.text.slice(0, MEETING_LIMITS.conversationTurnChars),
    createdAt: params.turn.createdAt ?? (params.now ?? new Date()).toISOString(),
    mode: params.turn.mode,
  };
  next[params.brainId] = {
    turns: boundConversationHistory([...current.turns, turn]),
  };
  return next;
}

export function clearConversationForBrain(
  state: ConversationByBrain,
  brainId: BrainId,
): ConversationByBrain {
  return {
    ...state,
    [brainId]: { turns: [] },
  };
}

export function getConversationForBrain(
  state: ConversationByBrain,
  brainId: BrainId,
): MeetingConversationTurn[] {
  return boundConversationHistory(state[brainId]?.turns ?? []);
}

export function buildFollowUpTurns(params: {
  previous: MeetingConversationTurn[];
  question: string;
  responseText: string;
  mode: MeetingMode;
  now?: Date;
}): MeetingConversationTurn[] {
  const stamp = (params.now ?? new Date()).toISOString();
  return boundConversationHistory([
    ...params.previous,
    {
      id: crypto.randomUUID(),
      role: "user",
      text: params.question,
      createdAt: stamp,
      mode: params.mode,
    },
    {
      id: crypto.randomUUID(),
      role: "assistant",
      text: params.responseText,
      createdAt: stamp,
      mode: params.mode,
    },
  ]);
}
