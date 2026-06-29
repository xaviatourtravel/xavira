import type { OmnichannelChannel } from "@/types/omnichannel-inbox";

/** Channels supported by the unified workspace (current + planned). */
export type WorkspaceChannel =
  | OmnichannelChannel
  | "email"
  | "telegram"
  | "website_chat";

export type WorkspaceLeadBadge = "prospect" | "lead" | "customer";

export type WorkspaceExtractedFields = {
  name: string;
  destination: string;
  departure: string;
  pax: string;
  budget: string;
  city: string;
};

export type WorkspaceTimelineEntry = {
  id: string;
  label: string;
  detail?: string;
  timestamp: string;
  channel?: WorkspaceChannel | null;
  tone: "message" | "note" | "system" | "activity";
};

export type WorkspaceNote = {
  id: string;
  note: string;
  authorName: string | null;
  createdAt: string;
};

export type WorkspaceConversationViewModel = {
  id: string;
  channel: WorkspaceChannel;
  channelLabel: string;
  displayName: string;
  phone: string | null;
  username: string | null;
  avatarUrl: string | null;
  leadBadge: WorkspaceLeadBadge;
  leadId: string | null;
  status: string;
  statusLabel: string;
  assignedUserId: string | null;
  assignedUserName: string | null;
  leadScore: number | null;
  leadScoreLabel: string | null;
  revenuePotentialIdr: number | null;
  extractedFields: WorkspaceExtractedFields;
  notes: WorkspaceNote[];
  timeline: WorkspaceTimelineEntry[];
  createdAt: string;
  isWhatsapp: boolean;
};

/** Placeholder AI output — swap for real LLM results later. */
export type WorkspaceIntelligenceState = "pending" | "preview";

export type WorkspaceIntelligencePlaceholder = {
  state: WorkspaceIntelligenceState;
  summary: string | null;
  extractedFields: WorkspaceExtractedFields;
  leadScore: number | null;
  leadScoreLabel: string | null;
  revenuePotentialIdr: number | null;
  nextBestAction: string | null;
  suggestedReply: string | null;
};

export const WORKSPACE_SIDEBAR_WIDTH = "360px";

export const WORKSPACE_LIST_WIDTH = "300px";
