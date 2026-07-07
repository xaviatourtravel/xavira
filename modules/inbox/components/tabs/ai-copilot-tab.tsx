"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { updateWhatsappConversationAiStateAction } from "@/app/(dashboard)/inbox/whatsapp-actions";
import { InspectorRoot, InspectorSection } from "@/components/ui/inspector";
import type { InboxKey } from "@/lib/i18n/inbox-dictionary";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import { WHATSAPP_AI_STATES } from "@/lib/whatsapp-inbox/ai/constants";
import { resolveWhatsappAiState } from "@/lib/whatsapp-inbox/ai/constants";
import { AiSuggestedReplyCard } from "@/modules/inbox/components/ai-suggested-reply-card";
import { AiThinkingCard } from "@/modules/inbox/components/ai-thinking-card";
import { MissingKnowledgeSection } from "@/modules/inbox/components/missing-knowledge-section";
import { NextBestActionCard } from "@/modules/inbox/components/next-best-action-card";
import { useAiCommandCenterRealtime } from "@/modules/inbox/hooks/use-ai-command-center-realtime";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import type { WhatsappAiState } from "@/types/whatsapp-inbox";
import { cn } from "@/lib/utils";

type AiCopilotTabProps = {
  conversation: OmnichannelConversationDetail;
  organizationId: string;
  canManageAi?: boolean;
};

const AI_STATE_KEYS: Record<WhatsappAiState, InboxKey> = {
  AI_ACTIVE: "aiStateAiActive",
  READY_FOR_HUMAN: "aiStateReadyForHuman",
  HUMAN_ASSISTED: "aiStateHumanAssisted",
  HUMAN_ONLY: "aiStateHumanOnly",
};

export function AiCopilotTab({
  conversation,
  organizationId,
  canManageAi = false,
}: AiCopilotTabProps) {
  const router = useRouter();
  const { ti } = useInboxTranslation();
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  const isWhatsapp = conversation.channel === "whatsapp";

  useAiCommandCenterRealtime({
    conversationId: isWhatsapp ? conversation.id : null,
    organizationId,
    enabled: isWhatsapp,
  });

  const aiState = resolveWhatsappAiState(conversation.aiState);

  const aiStateLabel = useMemo(() => ti(AI_STATE_KEYS[aiState]), [aiState, ti]);

  function runAiStateUpdate(nextState: WhatsappAiState) {
    if (!canManageAi || nextState === aiState) return;
    setNotice(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("conversation_id", conversation.id);
      formData.set("ai_state", nextState);

      const result = await updateWhatsappConversationAiStateAction(formData);
      if (!result.success) {
        setNotice(result.message ?? ti("failedUpdateAiState"));
        return;
      }
      router.refresh();
    });
  }

  return (
    <InspectorRoot>
      {!isWhatsapp ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">{ti("whatsappOnly")}</p>
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

          <InspectorSection title={ti("whyThisSuggestion")}>
            <AiThinkingCard conversation={conversation} showMissingContext={false} compact />
          </InspectorSection>

          <MissingKnowledgeSection conversation={conversation} />

          <InspectorSection title={ti("aiMode")} hideDivider className="pb-6">
            <p className="mb-2 text-[13px] text-foreground">{aiStateLabel}</p>
            <div className="flex flex-wrap gap-1">
              {WHATSAPP_AI_STATES.map((state) => {
                const active = state === aiState;
                return (
                  <button
                    key={state}
                    type="button"
                    disabled={!canManageAi || isPending || active}
                    onClick={() => runAiStateUpdate(state)}
                    className={cn(
                      "rounded-md px-2 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
                      active
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    )}
                  >
                    {ti(AI_STATE_KEYS[state])}
                  </button>
                );
              })}
            </div>
          </InspectorSection>

          {notice ? (
            <p className="px-4 pb-4 text-xs text-muted-foreground">{notice}</p>
          ) : null}
        </>
      )}
    </InspectorRoot>
  );
}
