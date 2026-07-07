"use client";

import { useTransition } from "react";
import { RotateCcw } from "lucide-react";

import {
  formatInboxMessageTime,
  formatOutgoingBubbleMetadataLine,
} from "@/components/omnichannel-inbox/inbox-display";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { formatTranslation } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";
import type { MessageRow } from "@/types/omnichannel-inbox";

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
    : formatTranslation(ti("attachmentCountMany"), { count: String(attachments.length) });
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

type WhatsappMessageBubbleProps = {
  message: MessageRow;
  onRetry?: () => Promise<void>;
  isGroupChat?: boolean;
};

export function WhatsappMessageBubble({
  message,
  onRetry,
}: WhatsappMessageBubbleProps) {
  const { ti } = useInboxTranslation();
  const [isRetrying, startRetry] = useTransition();
  const isIncoming = message.direction === "incoming";
  const attachmentLabel = getAttachmentLabel(message, ti);
  const isFailed = message.deliveryStatus === "failed";
  const metadataLine = getBubbleMetadataLine(message, isIncoming);

  return (
    <div
      className={cn(
        "flex w-full",
        isIncoming ? "justify-start" : "justify-end",
      )}
    >
      <div
        className={cn(
          "max-w-[68%] px-3 py-2",
          isIncoming
            ? "rounded-2xl rounded-tl-sm bg-muted/35 text-foreground dark:bg-muted/25"
            : "rounded-2xl rounded-tr-sm bg-foreground/90 text-background dark:bg-foreground/85",
          isFailed && "ring-1 ring-red-400/40",
        )}
      >
        {message.message_text ? (
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed">
            {message.message_text}
          </p>
        ) : null}
        {attachmentLabel ? (
          <p
            className={cn(
              "mt-1 text-[11px]",
              isIncoming ? "text-muted-foreground" : "text-background/70",
            )}
          >
            {attachmentLabel}
          </p>
        ) : null}
        {metadataLine ? (
          <div
            className={cn(
              "mt-1 flex items-center justify-end gap-2 text-[10px] tabular-nums",
              isIncoming ? "text-muted-foreground/80" : "text-background/60",
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
