import type { RetrievalSummary } from "@/modules/ai/types/context-retrieval";
import type {
  ConversationMemoryPromptItem,
  PlaygroundMemoryDisplay,
  PlaygroundMemoryTestInput,
} from "@/modules/ai/types/memory";
import type { LeadQualificationSnapshot } from "@/modules/ai/types/lead-qualification";

export type { PlaygroundMemoryTestInput };
export { DEFAULT_PLAYGROUND_MEMORY_TEST } from "@/modules/ai/types/memory";

export type PlaygroundCustomerContext = {
  customerName: string;
  destinationInterest: string;
  budget: string;
  departureMonth: string;
  passengerCount: string;
};

export type PlaygroundTestInput = {
  customerMessage: string;
  context: PlaygroundCustomerContext;
  memoryTest: PlaygroundMemoryTestInput;
};

export const DEFAULT_PLAYGROUND_CONTEXT: PlaygroundCustomerContext = {
  customerName: "",
  destinationInterest: "",
  budget: "",
  departureMonth: "",
  passengerCount: "",
};

export type PlaygroundPreviewResult = {
  aiReply: string;
  confidence: number;
  handoffRequired: boolean;
  handoffReason: string | null;
  suggestedActions: string[];
  /** Raw tokens from the LLM JSON response. */
  usedSources: string[];
  /** Human-readable Business Brain source labels for internal transparency. */
  sourceLabels: string[];
  /** Recommended document sends (not executed automatically). */
  documentActions: PlaygroundDocumentActionDisplay[];
};

export type PlaygroundDocumentActionDisplay = {
  documentId: string;
  documentName: string;
  action: "SEND_DOCUMENT";
  reason: string;
  /** Confidence score between 0 and 1 for display. */
  confidence: number;
};

export type PlaygroundContextItem = {
  id: string;
  label: string;
  detail?: string;
};

export type PlaygroundContextSection = {
  id: string;
  title: string;
  items: PlaygroundContextItem[];
  emptyLabel: string;
};

export type PlaygroundAvailableContext = {
  companyDna: PlaygroundContextSection;
  products: PlaygroundContextSection;
  knowledge: PlaygroundContextSection;
  documents: PlaygroundContextSection;
  behaviors: PlaygroundContextSection;
  handoverRules: PlaygroundContextSection;
};

export type PlaygroundTestResult = {
  preview: PlaygroundPreviewResult;
  contextUsed: PlaygroundAvailableContext;
  retrievalSummary?: RetrievalSummary;
  customerMemory: PlaygroundMemoryDisplay;
  customerMemoryUsed: ConversationMemoryPromptItem[];
  leadQualification: LeadQualificationSnapshot;
};

export type PlaygroundSavedExample = {
  id: string;
  customerMessage: string;
  aiReply: string;
  savedAt: string;
};

export type PlaygroundFeedbackStatus = "idle" | "approved" | "rejected" | "edited";
