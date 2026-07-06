import type { PlaygroundTestResult } from "@/modules/business-brain/types/playground";
import type { SimulatorChatMessage } from "@/modules/business-brain/types/playground-simulator";

export type BrainTestSessionRecord = {
  id: string;
  workspaceId: string;
  title: string;
  scenario: string | null;
  conversation: SimulatorChatMessage[];
  inspector: PlaygroundTestResult;
  score: number;
  createdAt: string;
};

export type BrainTestSessionSummary = {
  id: string;
  title: string;
  scenario: string | null;
  score: number;
  createdAt: string;
  turnCount: number;
};
