"use client";

import { RotateCcw } from "lucide-react";

import {
  AURORA_MESSAGE_BUBBLE_DELIVERY,
  AURORA_MESSAGE_BUBBLE_TIMESTAMP,
  AURORA_STATE_STATUS_FAILED,
  AURORA_STATE_STATUS_SENDING,
} from "@/components/workspace/aurora-tokens";
import { getOutgoingBubbleDeliveryVisual } from "@/lib/communication/messaging/delivery";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import type { MessageDeliveryStatus } from "@/types/omnichannel-inbox";
import { cn } from "@/lib/utils";

type ConversationMessageStatusProps = {
  isIncoming: boolean;
  timestamp: string | null;
  deliveryStatus?: MessageDeliveryStatus | null;
  isOptimistic?: boolean;
  isFailed?: boolean;
  onRetry?: () => void;
  isRetrying?: boolean;
};

export function ConversationMessageStatus({
  isIncoming,
  timestamp,
  deliveryStatus,
  isOptimistic = false,
  isFailed = false,
  onRetry,
  isRetrying = false,
}: ConversationMessageStatusProps) {
  const { ti } = useInboxTranslation();
  const deliveryVisual = !isIncoming
    ? getOutgoingBubbleDeliveryVisual(deliveryStatus, { isOptimistic })
    : null;

  if (isFailed) {
    return (
      <div
        className={cn(
          "mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1",
          isIncoming ? "justify-start" : "justify-end",
        )}
      >
        {timestamp ? (
          <span className={cn(AURORA_MESSAGE_BUBBLE_TIMESTAMP, "text-primary-foreground")}>
            {timestamp}
          </span>
        ) : null}
        <span className={AURORA_STATE_STATUS_FAILED}>
          ! {ti("messageFailedToSend")}
        </span>
        {onRetry ? (
          <button
            type="button"
            disabled={isRetrying}
            onClick={onRetry}
            className={cn(
              AURORA_STATE_STATUS_FAILED,
              "inline-flex items-center gap-0.5 hover:opacity-100",
            )}
          >
            <RotateCcw
              className={cn("h-2.5 w-2.5", isRetrying && "animate-spin")}
            />
            {isRetrying ? ti("retrySending") : ti("retrySend")}
          </button>
        ) : null}
      </div>
    );
  }

  if (!timestamp && !deliveryVisual) {
    return null;
  }

  return (
    <div
      className={cn(
        "mt-1 flex items-center gap-1",
        isIncoming ? "justify-start" : "justify-end",
      )}
    >
      {timestamp ? (
        <span
          className={cn(
            AURORA_MESSAGE_BUBBLE_TIMESTAMP,
            !isIncoming && "text-primary-foreground",
          )}
        >
          {timestamp}
        </span>
      ) : null}
      {deliveryVisual === "sending" ? (
        <span className={AURORA_STATE_STATUS_SENDING}>{ti("messageStatusSending")}</span>
      ) : null}
      {deliveryVisual === "sent" ? (
        <span
          className={cn(AURORA_MESSAGE_BUBBLE_DELIVERY, "text-primary-foreground")}
          aria-label={ti("messageStatusSent")}
        >
          ✓
        </span>
      ) : null}
      {deliveryVisual === "delivered" ? (
        <span
          className={cn(AURORA_MESSAGE_BUBBLE_DELIVERY, "text-primary-foreground")}
          aria-label={ti("messageStatusDelivered")}
        >
          ✓✓
        </span>
      ) : null}
    </div>
  );
}
