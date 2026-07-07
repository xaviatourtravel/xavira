"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb } from "lucide-react";

import { takeOverWhatsappConversationAction, sendWhatsappDocumentAction } from "@/app/(dashboard)/inbox/whatsapp-actions";
import { InspectorAction, InspectorEmpty } from "@/components/ui/inspector";
import {
  isQualificationHandoffReason,
  QUALIFICATION_HANDOFF_REASON,
} from "@/modules/ai/types/lead-qualification";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import { resolveWhatsappAiState } from "@/lib/whatsapp-inbox/ai/constants";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { logInboxError } from "@/modules/inbox/lib/resolve-inbox-error";
import {
  buildNextBestActions,
  type NextBestActionRecommendation,
} from "@/modules/inbox/lib/next-best-action-engine";
import { useInboxComposer } from "@/modules/inbox/context/inbox-composer-context";

type CopilotHeroRecommendationProps = {
  conversation: OmnichannelConversationDetail;
  canManageAi?: boolean;
};

export function CopilotHeroRecommendation({
  conversation,
  canManageAi = false,
}: CopilotHeroRecommendationProps) {
  const router = useRouter();
  const { ti, locale } = useInboxTranslation();
  const { insertText } = useInboxComposer();
  const [isPending, startTransition] = useTransition();

  const isWhatsapp = conversation.channel === "whatsapp";
  const state = isWhatsapp ? resolveWhatsappAiState(conversation.aiState) : null;
  const isQualificationHandoff =
    isWhatsapp &&
    state === "READY_FOR_HUMAN" &&
    isQualificationHandoffReason(conversation.aiHandoffReason);

  const qualification = conversation.leadQualification;
  const capturedFields =
    isQualificationHandoff && qualification
      ? qualification.fieldProgress
          .filter((field) => field.value?.trim())
          .map((field) => `${field.label}: ${field.value?.trim()}`)
          .join(" · ")
      : null;

  const nbaResult = useMemo(
    () => buildNextBestActions({ conversation, locale }),
    [conversation, locale],
  );

  function runRecommendation(recommendation: NextBestActionRecommendation) {
    if (!recommendation.ctaEnabled) return;

    switch (recommendation.actionType) {
      case "insert_question":
      case "insert_reply":
        if (recommendation.insertText) {
          insertText(recommendation.insertText);
        }
        return;
      case "open_product":
        router.push(recommendation.href ?? "/business-brain/products");
        return;
      case "open_knowledge":
        router.push(recommendation.href ?? "/business-brain/knowledge");
        return;
      case "send_document":
        if (!canManageAi || !recommendation.documentId) return;
        startTransition(async () => {
          const formData = new FormData();
          formData.set("conversation_id", conversation.id);
          formData.set("document_id", recommendation.documentId!);
          const sendResult = await sendWhatsappDocumentAction(formData);
          if (!sendResult.success) {
            logInboxError("nbaSendDocument", sendResult.message);
            return;
          }
          router.refresh();
        });
        return;
      case "take_over":
        if (!canManageAi) return;
        startTransition(async () => {
          const formData = new FormData();
          formData.set("conversation_id", conversation.id);
          const takeOverResult = await takeOverWhatsappConversationAction(formData);
          if (!takeOverResult.success) {
            logInboxError("nbaTakeOver", takeOverResult.message);
            return;
          }
          router.refresh();
        });
        return;
      default:
        return;
    }
  }

  function handleHandoffTakeOver() {
    if (!canManageAi) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("conversation_id", conversation.id);
      const result = await takeOverWhatsappConversationAction(formData);
      if (!result.success) {
        logInboxError("handoffTakeOver", result.message);
        return;
      }
      router.refresh();
    });
  }

  if (isQualificationHandoff) {
    return (
      <div className="space-y-2">
        <p className="text-[13px] font-medium text-foreground">
          {ti("filterReadyForHuman")} · {QUALIFICATION_HANDOFF_REASON}
        </p>
        {capturedFields ? (
          <p className="text-xs leading-relaxed text-muted-foreground">{capturedFields}</p>
        ) : (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {ti("copilotHandoffHeroDesc")}
          </p>
        )}
        {canManageAi ? (
          <InspectorAction
            variant="primary"
            disabled={isPending}
            onClick={handleHandoffTakeOver}
            className="mt-1 w-full"
          >
            {isPending ? ti("working") : ti("nbaCtaTakeOver")}
          </InspectorAction>
        ) : null}
      </div>
    );
  }

  if (!nbaResult.hasRecommendations || !nbaResult.primary) {
    return (
      <InspectorEmpty
        icon={Lightbulb}
        title={ti("nbaEmptyTitle")}
        description={ti("nbaEmptyDesc")}
      />
    );
  }

  const primary = nbaResult.primary;
  const needsPermission =
    primary.actionType === "take_over" || primary.actionType === "send_document";
  const ctaDisabled =
    isPending || !primary.ctaEnabled || (needsPermission && !canManageAi);

  return (
    <div className="space-y-2">
      <p className="text-[13px] font-medium text-foreground">{ti(primary.titleKey)}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {ti(primary.descriptionKey)}
      </p>
      <InspectorAction
        variant="primary"
        disabled={ctaDisabled}
        title={!primary.ctaEnabled ? ti("comingSoon") : undefined}
        onClick={() => runRecommendation(primary)}
        className="mt-1 w-full"
      >
        {ti(primary.ctaKey)}
      </InspectorAction>
    </div>
  );
}
