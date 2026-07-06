"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Bot,
  Brain,
  Lightbulb,
  Sparkles,
} from "lucide-react";

import { updateWhatsappConversationAiStateAction } from "@/app/(dashboard)/inbox/whatsapp-actions";
import {
  InspectorBadge,
  InspectorHeader,
  InspectorHero,
  InspectorRow,
  InspectorRoot,
  InspectorSection,
} from "@/components/ui/inspector";
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
import {
  buildCopilotConfidence,
  getLeadProgressKey,
} from "@/modules/inbox/lib/build-ai-copilot";
import {
  buildNextBestActions,
  getPrimaryNextBestActionTitleKey,
} from "@/modules/inbox/lib/next-best-action-engine";
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

const AI_STATE_TONES: Record<
  WhatsappAiState,
  "info" | "warning" | "violet" | "neutral"
> = {
  AI_ACTIVE: "info",
  READY_FOR_HUMAN: "warning",
  HUMAN_ASSISTED: "violet",
  HUMAN_ONLY: "neutral",
};

export function AiCopilotTab({
  conversation,
  organizationId,
  canManageAi = false,
}: AiCopilotTabProps) {
  const router = useRouter();
  const { ti, locale } = useInboxTranslation();
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  const isWhatsapp = conversation.channel === "whatsapp";

  useAiCommandCenterRealtime({
    conversationId: isWhatsapp ? conversation.id : null,
    organizationId,
    enabled: isWhatsapp,
  });

  const aiState = resolveWhatsappAiState(conversation.aiState);
  const qualification = conversation.leadQualification;

  const confidence = useMemo(
    () => buildCopilotConfidence(conversation),
    [conversation],
  );
  const nextBestActions = useMemo(
    () => buildNextBestActions({ conversation, locale }),
    [conversation, locale],
  );

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
      <InspectorHeader
        icon={Sparkles}
        title={ti("workspacePanelCopilotTitle")}
        description={ti("workspacePanelCopilotDesc")}
      />

      {!isWhatsapp ? (
        <p className="px-6 pb-6 text-[13px] text-muted-foreground">{ti("whatsappOnly")}</p>
      ) : (
        <>
          <InspectorSection icon={Activity} title={ti("conversationHealth")} collapsible>
            <div className="space-y-2">
              <InspectorRow
                label={ti("aiMode")}
                value={
                  <InspectorBadge tone={AI_STATE_TONES[aiState]}>
                    {aiState === "AI_ACTIVE" ? <Bot className="h-3 w-3" /> : null}
                    {ti(AI_STATE_KEYS[aiState])}
                  </InspectorBadge>
                }
              />
              <InspectorRow
                label={ti("leadProgress")}
                value={ti(getLeadProgressKey(qualification?.qualificationStatus))}
              />
              <InspectorRow label={ti("aiConfidence")} value={`${confidence}%`} />
              <InspectorRow
                label={ti("nextBestAction")}
                value={ti(getPrimaryNextBestActionTitleKey(nextBestActions))}
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {WHATSAPP_AI_STATES.map((state) => {
                const active = state === aiState;
                return (
                  <button
                    key={state}
                    type="button"
                    disabled={!canManageAi || isPending || active}
                    onClick={() => runAiStateUpdate(state)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
                      active
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    )}
                  >
                    {ti(AI_STATE_KEYS[state])}
                  </button>
                );
              })}
            </div>
          </InspectorSection>

          <div className="pb-6">
            <InspectorHero>
              <AiSuggestedReplyCard conversation={conversation} />
            </InspectorHero>
          </div>

          <InspectorSection icon={Brain} title={ti("aiThinking")} collapsible defaultOpen>
            <AiThinkingCard conversation={conversation} showMissingContext={false} />
          </InspectorSection>

          <MissingKnowledgeSection conversation={conversation} />

          <InspectorSection
            icon={Lightbulb}
            title={ti("nextBestAction")}
            hideDivider
            className="pb-8"
          >
            <NextBestActionCard conversation={conversation} canManageAi={canManageAi} />
          </InspectorSection>

          {notice ? (
            <p className="px-6 pb-4 text-xs text-muted-foreground">{notice}</p>
          ) : null}
        </>
      )}
    </InspectorRoot>
  );
}
