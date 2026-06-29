"use client";

import { useState } from "react";

import { OmnichannelConversationDetailPanel } from "@/components/omnichannel-inbox/conversation-detail";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";

type CustomerConversationPanelProps = {
  conversation: OmnichannelConversationDetail;
  customerId: string;
  canReply: boolean;
  canSuggestReply: boolean;
  isUnassignedForAgent: boolean;
};

export function CustomerConversationPanel({
  conversation,
  customerId,
  canReply,
  canSuggestReply,
  isUnassignedForAgent,
}: CustomerConversationPanelProps) {
  const [leadPanelOpen, setLeadPanelOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <OmnichannelConversationDetailPanel
        conversation={conversation}
        canReply={canReply}
        canSuggestReply={canSuggestReply}
        isUnassignedForAgent={isUnassignedForAgent}
        leadPanelOpen={leadPanelOpen}
        onToggleLeadPanel={() => setLeadPanelOpen((value) => !value)}
        showDetailsToggle={false}
        showBackButton={false}
        backHref={`/customers/${customerId}`}
      />
    </div>
  );
}
