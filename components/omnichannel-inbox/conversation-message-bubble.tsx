"use client";

import { useTransition } from "react";
import { RotateCcw } from "lucide-react";

import {
  formatInboxMessageTime,
  formatOutgoingBubbleMetadataLine,
} from "@/components/omnichannel-inbox/inbox-display";
import { getBubbleStyle } from "@/lib/communication-workspace/conversation-lane";
import { formatTranslation } from "@/lib/i18n/dictionary";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import type { MessageRow } from "@/types/omnichannel-inbox";
import { cn } from "@/lib/utils";

function getAttachmentLabel(
  message: MessageRow,
  ti: (key: "attachmentCountOne" | "attachmentCountMany") => string,
) {
  const attachments = Array.isArray(message.attachments_json)
    ? message.attachments_json
    : [];

  if (attachments.length === 0) {
    return null;
  }

  return attachments.length === 1
    ? ti("attachmentCountOne")
    : formatTranslation(ti("attachmentCountMany"), {
        count: String(attachments.length),
      });
}

function getBubbleMetadataLine(message: MessageRow, isIncoming: boolean) {
  if (isIncoming) {
    return formatInboxMessageTime(message.created_at);
  }

  return formatOutgoingBubbleMetadataLine(
    message.created_at,
    message.deliveryStatus,
    { isOptimistic: message.id === "optimistic-outgoing" },
  );
}

type ConversationMessageBubbleProps = {
  message: MessageRow;
  onRetry?: () => Promise<void>;
};

export function ConversationMessageBubble({
  message,
  onRetry,
}: ConversationMessageBubbleProps) {
  const { ti } = useInboxTranslation();
  const [isRetrying, startRetry] = useTransition();
  const isIncoming = message.direction === "incoming";
  const attachmentLabel = getAttachmentLabel(message, ti);
  const isFailed = message.deliveryStatus === "failed";
  const metadataLine = getBubbleMetadataLine(message, isIncoming);
  const isOptimistic = message.id === "optimistic-outgoing";

  return (
    <div
      className={cn(
        "flex scroll-mt-24",
        isIncoming ? "justify-start" : "justify-end",
      )}
    >
      <div
        className={cn(
          "inline-block w-fit px-4 py-3",
          isIncoming
            ? "rounded-2xl rounded-tl-md bg-muted/35 text-foreground shadow-sm dark:bg-muted/25"
            : "rounded-2xl rounded-tr-md bg-primary text-primary-foreground shadow-sm",
          isFailed && "ring-1 ring-red-400/40",
          isOptimistic && "opacity-75",
        )}
        style={getBubbleStyle()}
      >
        {message.message_text ? (
          <p className="whitespace-pre-wrap text-[13px] leading-[1.45] tracking-[0.01em]">
            {message.message_text}
          </p>
        ) : null}

        {attachmentLabel ? (
          <p
            className={cn(
              "mt-1 text-[11px]",
              isIncoming ? "text-muted-foreground" : "text-primary-foreground/75",
            )}
          >
            {attachmentLabel}
          </p>
        ) : null}

        {metadataLine ? (
          <div
            className={cn(
              "mt-1 flex items-center justify-end gap-2 text-[10px] tabular-nums",
              isIncoming
                ? "text-muted-foreground/80"
                : "text-primary-foreground/65",
            )}
          >
            <span>{metadataLine}</span>
            {onRetry ? (
              <button
                type="button"
                disabled={isRetrying}
                onClick={() => startRetry(onRetry)}
                className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium hover:bg-background/10"
              >
                <RotateCcw
                  className={cn("h-3 w-3", isRetrying && "animate-spin")}
                />
                {isRetrying ? ti("retrySending") : ti("retrySend")}
              </button>
            ) : null}
          </div>
        ) : onRetry ? (
          <div className="mt-1 flex justify-end">
            <button
              type="button"
              disabled={isRetrying}
              onClick={() => startRetry(onRetry)}
              className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium hover:bg-background/10"
            >
              <RotateCcw
                className={cn("h-3 w-3", isRetrying && "animate-spin")}
              />
              {isRetrying ? ti("retrySending") : ti("retrySend")}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
