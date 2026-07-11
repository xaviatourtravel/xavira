import type { LucideIcon } from "lucide-react";

export type AICopilotIconId =
  | "sparkles"
  | "brain"
  | "target"
  | "lightbulb"
  | "clipboard"
  | "message-square"
  | "check-circle";

export type AICopilotInsight = {
  intent: string;
  confidence: number;
  leadTemperature: string;
  leadTemperatureEmoji?: string;
  estimatedClosing: string;
  summary?: string;
};

export type AICopilotNextAction = {
  id: string;
  icon: AICopilotIconId;
  title: string;
  description: string;
  recommended?: boolean;
};

export type AICopilotSignal = {
  id: string;
  label: string;
  icon?: AICopilotIconId;
};

export type AICopilotMemoryItem = {
  id: string;
  label: string;
};

/** Future-ready AI Copilot payload — mirrors upcoming assistant API. */
export type AICopilotData = {
  intent: string;
  confidence: number;
  summary?: string;
  leadTemperature: string;
  leadTemperatureEmoji?: string;
  estimatedClosing: string;
  nextActions: AICopilotNextAction[];
  suggestedReply: string;
  signals: AICopilotSignal[];
  memory: AICopilotMemoryItem[];
};

export type AICopilotLabels = {
  title: string;
  helper: string;
  insightTitle: string;
  customerIntent: string;
  confidence: string;
  leadTemperature: string;
  estimatedClosing: string;
  nextActionTitle: string;
  suggestedReplyTitle: string;
  copy: string;
  edit: string;
  regenerate: string;
  signalsTitle: string;
  memoryTitle: string;
  recommended: string;
};

export type CopilotIconResolver = (iconId: AICopilotIconId) => LucideIcon;
