import type { CollectedInformationMap, QuestionSemanticKey } from "@/modules/ai/conversation-state/types";
import type { CatalogContext, SelectedEntity } from "@/modules/ai/response-planner/types";
import type { ConversationMemoryMap } from "@/modules/ai/types/memory";

export const MAX_PLAYGROUND_CONVERSATION_TURNS = 40;

export type PlaygroundSimulatedAttachment = {
  documentId: string;
  documentName: string;
  documentType: string;
  simulated: true;
  deliveredAt: string;
};

export type PlaygroundPersistedConversationState = {
  greetingSent: boolean;
  collectedInformation: CollectedInformationMap;
  questionsAsked: QuestionSemanticKey[];
  selectedEntity: SelectedEntity | null;
  catalogContext: CatalogContext | null;
  currentIntent: string | null;
  handoffRequested: boolean;
  customerMemory: ConversationMemoryMap;
  simulatedAttachments: PlaygroundSimulatedAttachment[];
};

export const EMPTY_PLAYGROUND_CONVERSATION_STATE: PlaygroundPersistedConversationState = {
  greetingSent: false,
  collectedInformation: {},
  questionsAsked: [],
  selectedEntity: null,
  catalogContext: null,
  currentIntent: null,
  handoffRequested: false,
  customerMemory: {},
  simulatedAttachments: [],
};

export type PlaygroundActiveSessionRecord = {
  id: string;
  workspaceId: string;
  userId: string | null;
  title: string;
  scenario: string | null;
  conversation: import("@/modules/business-brain/types/playground-simulator").SimulatorChatMessage[];
  conversationState: PlaygroundPersistedConversationState;
  inspector: Record<string, unknown>;
  score: number;
  status: "active" | "saved";
  createdAt: string;
  updatedAt: string;
};
