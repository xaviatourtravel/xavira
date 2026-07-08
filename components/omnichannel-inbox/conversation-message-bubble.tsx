"use client";

import { useTransition } from "react";
import { RotateCcw } from "lucide-react";

import {
  formatInboxMessageBubbleTime,
  formatOutgoingBubbleMetadataLine,
} from "@/components/omnichannel-inbox/inbox-display";
import { getBubbleStyle } from "@/lib/communication-workspace/conversation-lane";
import type { MessageGroupPosition } from "@/lib/communication/message-thread";
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
    return formatInboxMessageBubbleTime(message.created_at);
  }

  return formatOutgoingBubbleMetadataLine(
    message.created_at,
    message.deliveryStatus,
    { isOptimistic: message.id === "optimistic-outgoing" },
  );
}

function getBubbleShapeClasses(
  isIncoming: boolean,
  groupPosition: MessageGroupPosition,
) {
  if (groupPosition === "single") {
    return isIncoming
      ? "rounded-[24px] rounded-bl-[14px]"
      : "rounded-[24px] rounded-br-[14px]";
  }

  if (isIncoming) {
    switch (groupPosition) {
      case "first":
        return "rounded-t-[24px] rounded-tr-[24px] rounded-bl-lg rounded-br-[24px]";
      case "middle":
        return "rounded-t-lg rounded-tr-[24px] rounded-bl-lg rounded-br-[24px]";
      case "last":
        return "rounded-t-lg rounded-tr-[24px] rounded-bl-[24px] rounded-br-[24px] rounded-bl-[14px]";
      default:
        return "rounded-[24px]";
    }
  }

  switch (groupPosition) {
    case "first":
      return "rounded-t-[24px] rounded-tl-[24px] rounded-bl-[24px] rounded-br-lg";
    case "middle":
      return "rounded-t-lg rounded-tl-[24px] rounded-bl-[24px] rounded-br-lg";
    case "last":
      return "rounded-t-lg rounded-tl-[24px] rounded-bl-[24px] rounded-br-[24px] rounded-br-[14px]";
    default:
      return "rounded-[24px]";
  }
}

type ConversationMessageBubbleProps = {
  message: MessageRow;
  groupPosition?: MessageGroupPosition;
  className?: string;
  onRetry?: () => Promise<void>;
};

export function ConversationMessageBubble({
  message,
  groupPosition = "single",
  className,
  onRetry,
}: ConversationMessageBubbleProps) {
  const { ti } = useInboxTranslation();
  const [isRetrying, startRetry] = useTransition();
  const isIncoming = message.direction === "incoming";
  const attachmentLabel = getAttachmentLabel(message, ti);
  const isFailed = message.deliveryStatus === "failed";
  const metadataLine = getBubbleMetadataLine(message, isIncoming);
  const isOptimistic = message.id === "optimistic-outgoing";
  const showTimestamp =
    groupPosition === "single" ||
    groupPosition === "last" ||
    isFailed ||
    Boolean(onRetry);

  return (
    <div
      className={cn(
        "flex scroll-mt-24",
        isIncoming ? "justify-start" : "justify-end",
        className,
      )}
    >
      <div
        className={cn(
          "inline-block w-fit px-3.5 py-2.5",
          getBubbleShapeClasses(isIncoming, groupPosition),
          isIncoming
            ? "bg-muted/30 text-foreground dark:bg-muted/20"
            : "bg-primary text-primary-foreground",
          isFailed && "ring-1 ring-red-400/35",
          isOptimistic && "opacity-80",
        )}
        style={getBubbleStyle()}
      >
        {message.message_text ? (
          <p className="whitespace-pre-wrap text-sm leading-[1.55]">
            {message.message_text}
          </p>
        ) : null}

        {attachmentLabel ? (
          <p
            className={cn(
              "mt-1 text-[11px] leading-snug",
              isIncoming ? "text-muted-foreground/80" : "text-primary-foreground/70",
            )}
          >
            {attachmentLabel}
          </p>
        ) : null}

        {showTimestamp && metadataLine ? (
          <div
            className={cn(
              "mt-1 flex items-center justify-end gap-1.5 text-[9px] leading-none tabular-nums tracking-wide",
              isIncoming
                ? "text-muted-foreground/50"
                : "text-primary-foreground/50",
            )}
          >
            <span>{metadataLine}</span>
            {onRetry ? (
              <button
                type="button"
                disabled={isRetrying}
                onClick={() => startRetry(onRetry)}
                className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-medium text-inherit opacity-80 hover:opacity-100"
              >
                <RotateCcw
                  className={cn("h-2.5 w-2.5", isRetrying && "animate-spin")}
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
              className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-medium opacity-80 hover:opacity-100"
            >
              <RotateCcw
                className={cn("h-2.5 w-2.5", isRetrying && "animate-spin")}
              />
              {isRetrying ? ti("retrySending") : ti("retrySend")}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
