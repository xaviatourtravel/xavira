"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";

import { sendWhatsappDocumentAction, takeOverWhatsappConversationAction } from "@/app/(dashboard)/inbox/whatsapp-actions";
import { InspectorAction, InspectorEmpty } from "@/components/ui/inspector";
import type { InboxKey } from "@/lib/i18n/inbox-dictionary";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import { useInboxComposer } from "@/modules/inbox/context/inbox-composer-context";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { logInboxError } from "@/modules/inbox/lib/resolve-inbox-error";
import {
  buildNextBestActions,
  type NextBestActionRecommendation,
} from "@/modules/inbox/lib/next-best-action-engine";

type NextBestActionSecondaryListProps = {
  conversation: OmnichannelConversationDetail;
  canManageAi?: boolean;
};

export function NextBestActionSecondaryList({
  conversation,
  canManageAi = false,
}: NextBestActionSecondaryListProps) {
  const router = useRouter();
  const { ti, locale } = useInboxTranslation();
  const { insertText } = useInboxComposer();
  const [isPending, startTransition] = useTransition();

  const result = useMemo(
    () => buildNextBestActions({ conversation, locale }),
    [conversation, locale],
  );

  function handleAction(recommendation: NextBestActionRecommendation) {
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

  if (result.others.length === 0) {
    return (
      <InspectorEmpty
        title={ti("nbaSecondaryEmptyTitle")}
        description={ti("nbaSecondaryEmptyDesc")}
      />
    );
  }

  return (
    <ul className="space-y-4">
      {result.others.map((recommendation) => (
        <SecondaryRow
          key={recommendation.id}
          recommendation={recommendation}
          ti={ti}
          disabled={isPending}
          canManageAi={canManageAi}
          onAction={() => handleAction(recommendation)}
        />
      ))}
    </ul>
  );
}

function SecondaryRow({
  recommendation,
  ti,
  disabled,
  canManageAi,
  onAction,
}: {
  recommendation: NextBestActionRecommendation;
  ti: (key: InboxKey) => string;
  disabled?: boolean;
  canManageAi?: boolean;
  onAction: () => void;
}) {
  const needsPermission =
    recommendation.actionType === "take_over" || recommendation.actionType === "send_document";
  const ctaDisabled =
    disabled || !recommendation.ctaEnabled || (needsPermission && !canManageAi);

  return (
    <li className="space-y-1.5">
      <p className="text-sm text-foreground">{ti(recommendation.titleKey)}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {ti(recommendation.reasonKey)}
      </p>
      <button
        type="button"
        disabled={ctaDisabled}
        title={!recommendation.ctaEnabled ? ti("comingSoon") : undefined}
        onClick={onAction}
        className="text-xs text-primary transition-colors duration-150 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
      >
        {ti(recommendation.ctaKey)}
      </button>
    </li>
  );
}
