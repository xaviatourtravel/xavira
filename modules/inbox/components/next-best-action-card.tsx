"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Lightbulb,
} from "lucide-react";

import {
  sendWhatsappDocumentAction,
  takeOverWhatsappConversationAction,
} from "@/app/(dashboard)/inbox/whatsapp-actions";
import {
  InspectorAction,
  InspectorEmpty,
  InspectorBadge,
  InspectorRow,
} from "@/components/ui/inspector";
import { DsToast } from "@/components/design-system/toast";
import type { InboxKey } from "@/lib/i18n/inbox-dictionary";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import { useInboxComposer } from "@/modules/inbox/context/inbox-composer-context";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { logInboxError } from "@/modules/inbox/lib/resolve-inbox-error";
import {
  buildNextBestActions,
  type NextBestActionPriority,
  type NextBestActionRecommendation,
} from "@/modules/inbox/lib/next-best-action-engine";
import { cn } from "@/lib/utils";

type NextBestActionCardProps = {
  conversation: OmnichannelConversationDetail;
  canManageAi?: boolean;
  flat?: boolean;
};

const PRIORITY_TONES: Record<
  NextBestActionPriority,
  "neutral" | "warning" | "success" | "info" | "violet"
> = {
  critical: "warning",
  high: "warning",
  medium: "neutral",
  low: "neutral",
};

export function NextBestActionCard({
  conversation,
  canManageAi = false,
  flat = false,
}: NextBestActionCardProps) {
  const router = useRouter();
  const { ti, locale } = useInboxTranslation();
  const { insertText } = useInboxComposer();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ title: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

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
          setToast({ title: ti("insertSuccess") });
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
            setToast({ title: ti("failedSendDocument") });
            return;
          }
          setToast({ title: ti("documentSent") });
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
            setToast({ title: ti("failedTakeOver") });
            return;
          }
          router.refresh();
        });
        return;
      default:
        return;
    }
  }

  if (!result.hasRecommendations || !result.primary) {
    return (
      <InspectorEmpty
        icon={Lightbulb}
        title={ti("nbaEmptyTitle")}
        description={ti("nbaEmptyDesc")}
      />
    );
  }

  return (
    <div className="space-y-3">
      <RecommendationBlock
        recommendation={result.primary}
        ti={ti}
        primary
        flat={flat}
        disabled={isPending}
        canManageAi={canManageAi}
        onAction={() => handleAction(result.primary!)}
      />

      {result.others.length > 0 ? (
        <div className="space-y-1 pt-1">
          {result.others.map((recommendation) => (
            <RecommendationBlock
              key={recommendation.id}
              recommendation={recommendation}
              ti={ti}
              flat={flat}
              disabled={isPending}
              canManageAi={canManageAi}
              onAction={() => handleAction(recommendation)}
            />
          ))}
        </div>
      ) : null}

      {toast ? (
        <div className="relative">
          <div className="pointer-events-none absolute bottom-0 right-0 z-20 flex justify-end pb-1">
            <div className="pointer-events-auto">
              <DsToast variant="success" title={toast.title} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RecommendationBlock({
  recommendation,
  ti,
  primary = false,
  flat = false,
  disabled,
  canManageAi = false,
  onAction,
}: {
  recommendation: NextBestActionRecommendation;
  ti: (key: InboxKey) => string;
  primary?: boolean;
  flat?: boolean;
  disabled?: boolean;
  canManageAi?: boolean;
  onAction: () => void;
}) {
  const needsPermission =
    recommendation.actionType === "take_over" || recommendation.actionType === "send_document";
  const ctaDisabled =
    disabled || !recommendation.ctaEnabled || (needsPermission && !canManageAi);
  const ctaTitle = !recommendation.ctaEnabled ? ti("comingSoon") : undefined;

  return (
    <div className={cn("py-1.5", primary && !flat && "rounded-md bg-muted/20 px-2 dark:bg-muted/10")}>
      {primary && !flat ? (
        <p className="mb-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
          {ti("nbaPrimaryRecommendation")}
        </p>
      ) : null}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-foreground">
            {ti(recommendation.titleKey)}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {ti(recommendation.descriptionKey)}
          </p>
        </div>
        {!flat ? (
          <InspectorBadge tone={PRIORITY_TONES[recommendation.priority]} size="xs">
            {ti(recommendation.priorityLabelKey)}
          </InspectorBadge>
        ) : null}
      </div>

      {!flat ? (
        <div className="mt-2 space-y-0.5">
          <InspectorRow label={ti("nbaReasonLabel")} value={ti(recommendation.reasonKey)} />
        </div>
      ) : null}

      <InspectorAction
        variant={primary ? "primary" : "ghost"}
        disabled={ctaDisabled}
        title={ctaTitle}
        onClick={onAction}
        className={cn("mt-2", primary ? "w-full" : "px-0")}
      >
        {ti(recommendation.ctaKey)}
      </InspectorAction>
    </div>
  );
}
