"use client";

import { MessageCircleWarning } from "lucide-react";

import { InspectorRoot, InspectorSection } from "@/components/ui/inspector";
import { InboxEmptyState } from "@/components/omnichannel-inbox/inbox-empty-state";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import { AiSuggestedReplyCard } from "@/modules/inbox/components/ai-suggested-reply-card";
import { MissingKnowledgeSection } from "@/modules/inbox/components/missing-knowledge-section";
import { NextBestActionCard } from "@/modules/inbox/components/next-best-action-card";
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

  return (
    <InspectorRoot>
      {!isWhatsapp ? (
        <InboxEmptyState
          icon={MessageCircleWarning}
          title={ti("whatsappOnlyTitle")}
          description={ti("whatsappOnlyDesc")}
          className="px-4"
          size="compact"
        />
      ) : (
        <>
          <InspectorSection title={ti("nextBestAction")}>
            <NextBestActionCard
              conversation={conversation}
              canManageAi={canManageAi}
              flat
            />
          </InspectorSection>

          <InspectorSection title={ti("suggestedReply")}>
            <AiSuggestedReplyCard conversation={conversation} hideHeader />
          </InspectorSection>

          <MissingKnowledgeSection conversation={conversation} hideDivider />
        </>
      )}
    </InspectorRoot>
  );
}
