"use client";

import { MessageCircleWarning } from "lucide-react";

import { InboxEmptyState } from "@/components/omnichannel-inbox/inbox-empty-state";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import { AiSuggestedReplyCard } from "@/modules/inbox/components/ai-suggested-reply-card";
import { CopilotHeroRecommendation } from "@/modules/inbox/components/copilot-hero-recommendation";
import { CopilotPanelSection } from "@/modules/inbox/components/copilot-panel-section";
import { MissingKnowledgeSection } from "@/modules/inbox/components/missing-knowledge-section";
import { NextBestActionSecondaryList } from "@/modules/inbox/components/next-best-action-secondary-list";
import { useAiCommandCenterRealtime } from "@/modules/inbox/hooks/use-ai-command-center-realtime";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";

type AiCopilotTabProps = {
  conversation: OmnichannelConversationDetail;
  organizationId: string;
  canManageAi?: boolean;
};

export function AiCopilotTab({
  conversation,
  organizationId,
  canManageAi = false,
}: AiCopilotTabProps) {
  const { ti } = useInboxTranslation();
  const isWhatsapp = conversation.channel === "whatsapp";

  useAiCommandCenterRealtime({
    conversationId: isWhatsapp ? conversation.id : null,
    organizationId,
    enabled: isWhatsapp,
  });

  if (!isWhatsapp) {
    return (
      <InboxEmptyState
        icon={MessageCircleWarning}
        title={ti("whatsappOnlyTitle")}
        description={ti("whatsappOnlyDesc")}
        className="px-4 py-6"
        size="compact"
      />
    );
  }

  return (
    <div className="pb-2">
      <CopilotPanelSection>
        <CopilotHeroRecommendation
          conversation={conversation}
          canManageAi={canManageAi}
        />
      </CopilotPanelSection>

      <CopilotPanelSection label={ti("suggestedReply")}>
        <AiSuggestedReplyCard conversation={conversation} hideHeader />
      </CopilotPanelSection>

      <CopilotPanelSection label={ti("nextBestAction")}>
        <NextBestActionSecondaryList
          conversation={conversation}
          canManageAi={canManageAi}
        />
      </CopilotPanelSection>

      <CopilotPanelSection label={ti("missingKnowledge")} hideDivider>
        <MissingKnowledgeSection conversation={conversation} hideDivider hideTitle />
      </CopilotPanelSection>
    </div>
  );
}
