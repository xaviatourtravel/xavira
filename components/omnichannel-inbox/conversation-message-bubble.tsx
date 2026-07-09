"use client";

import { useTransition } from "react";

import { formatInboxMessageBubbleTime } from "@/components/omnichannel-inbox/inbox-display";
import { ConversationMessageStatus } from "@/components/omnichannel-inbox/conversation-message-status";
import {
  AURORA_MESSAGE_BUBBLE_ATTACHMENT,
  AURORA_MESSAGE_BUBBLE_INCOMING,
  AURORA_MESSAGE_BUBBLE_OUTGOING,
  AURORA_MESSAGE_BUBBLE_PADDING,
  AURORA_MESSAGE_BUBBLE_RADIUS,
  AURORA_MESSAGE_BUBBLE_SELECTION,
  AURORA_MESSAGE_BUBBLE_TEXT,
  AURORA_MESSAGE_BUBBLE_TEXT_LINK_INCOMING,
  AURORA_MESSAGE_BUBBLE_TEXT_LINK_OUTGOING,
} from "@/components/workspace/aurora-tokens";
import { MESSAGE_BUBBLE_WIDTH_CLASS } from "@/lib/communication-workspace/conversation-lane";
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
  const isOptimistic = message.id === "optimistic-outgoing";
  const timestamp = formatInboxMessageBubbleTime(message.created_at);
  const showTimestamp =
    groupPosition === "single" ||
    groupPosition === "last" ||
    isFailed ||
    Boolean(onRetry) ||
    isOptimistic ||
    message.deliveryStatus === "pending";

  return (
    <div className={cn(MESSAGE_BUBBLE_WIDTH_CLASS, className)}>
      <div
        className={cn(
          AURORA_MESSAGE_BUBBLE_RADIUS,
          AURORA_MESSAGE_BUBBLE_PADDING,
          AURORA_MESSAGE_BUBBLE_SELECTION,
          isIncoming ? AURORA_MESSAGE_BUBBLE_INCOMING : AURORA_MESSAGE_BUBBLE_OUTGOING,
          isFailed && "ring-1 ring-red-400/35",
          isOptimistic && "opacity-80",
        )}
      >
        {message.message_text ? (
          <p
            className={cn(
              AURORA_MESSAGE_BUBBLE_TEXT,
              isIncoming
                ? AURORA_MESSAGE_BUBBLE_TEXT_LINK_INCOMING
                : AURORA_MESSAGE_BUBBLE_TEXT_LINK_OUTGOING,
            )}
          >
            {message.message_text}
          </p>
        ) : null}

        {attachmentLabel ? (
          <div className={AURORA_MESSAGE_BUBBLE_ATTACHMENT}>
            <p
              className={cn(
                "text-[11px] leading-snug",
                isIncoming ? "text-muted-foreground/75" : "text-primary-foreground/70",
              )}
            >
              {attachmentLabel}
            </p>
          </div>
        ) : null}

        {showTimestamp ? (
          <ConversationMessageStatus
            isIncoming={isIncoming}
            timestamp={timestamp}
            deliveryStatus={message.deliveryStatus}
            isOptimistic={isOptimistic}
            isFailed={isFailed}
            onRetry={onRetry ? () => startRetry(onRetry) : undefined}
            isRetrying={isRetrying}
          />
        ) : onRetry ? (
          <div
            className={cn(
              "mt-1 flex",
              isIncoming ? "justify-start" : "justify-end",
            )}
          >
            <ConversationMessageStatus
              isIncoming={isIncoming}
              timestamp={null}
              isFailed
              onRetry={() => startRetry(onRetry)}
              isRetrying={isRetrying}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
