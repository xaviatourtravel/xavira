import type { WorkspaceChannel } from "@/lib/communication-workspace/types";

export type ConversationContext = {
  conversationId: string;
  organizationId: string;
  channel: WorkspaceChannel;
  channelLabel: string;
  customerName: string;
  phone: string | null;
  leadId: string | null;
  messageCount: number;
  incomingMessageCount: number;
  lastIncomingText: string | null;
  hasLinkedLead: boolean;
  createdAt: string;
};
