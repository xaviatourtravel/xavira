import type { AIActionType } from "@/modules/ai/action-engine/types";

export type ActionDefinition = {
  type: AIActionType;
  description: string;
  /** Minimum confidence required for approval (0–1). */
  minConfidence: number;
  /** Whether execution performs external side effects. */
  hasSideEffects: boolean;
};

export const ACTION_REGISTRY: Record<AIActionType, ActionDefinition> = {
  SEND_DOCUMENT: {
    type: "SEND_DOCUMENT",
    description: "Send a published Business Brain document via WhatsApp.",
    minConfidence: 0.85,
    hasSideEffects: true,
  },
  HANDOVER: {
    type: "HANDOVER",
    description: "Hand the conversation to a human teammate.",
    minConfidence: 0.5,
    hasSideEffects: true,
  },
  CREATE_LEAD_NOTE: {
    type: "CREATE_LEAD_NOTE",
    description: "Create an internal conversation note for sales.",
    minConfidence: 0.6,
    hasSideEffects: true,
  },
  UPDATE_MEMORY: {
    type: "UPDATE_MEMORY",
    description: "Persist a customer memory field.",
    minConfidence: 0.7,
    hasSideEffects: true,
  },
  UPDATE_LEAD_PROGRESS: {
    type: "UPDATE_LEAD_PROGRESS",
    description: "Update lead qualification progress from collected fields.",
    minConfidence: 0.7,
    hasSideEffects: true,
  },
  SUGGEST_PACKAGE: {
    type: "SUGGEST_PACKAGE",
    description: "Record a package recommendation for sales follow-up.",
    minConfidence: 0.5,
    hasSideEffects: false,
  },
  ASK_QUALIFICATION: {
    type: "ASK_QUALIFICATION",
    description: "Record the next qualification question to ask.",
    minConfidence: 0.5,
    hasSideEffects: false,
  },
  NO_ACTION: {
    type: "NO_ACTION",
    description: "Explicit no-op recommendation.",
    minConfidence: 0,
    hasSideEffects: false,
  },
};

export function getActionDefinition(type: AIActionType): ActionDefinition {
  return ACTION_REGISTRY[type];
}
