"use client";

import { useTransition } from "react";
import { RotateCcw } from "lucide-react";

import { formatInboxMessageTime } from "@/components/omnichannel-inbox/inbox-display";
import { cn } from "@/lib/utils";
import { designSystemPanelClass } from "@/lib/design-system/tokens";
import type { MessageRow } from "@/types/omnichannel-inbox";

function getAttachmentLabel(message: MessageRow) {
  const attachments = Array.isArray(message.attachments_json)
    ? message.attachments_json
    : [];

  if (attachments.length === 0) {
    return null;
  }

  return attachments.length === 1 ? "1 lampiran" : `${attachments.length} lampiran`;
}

function getDeliveryLabel(message: MessageRow) {
  if (message.id === "optimistic-outgoing" || message.deliveryStatus === "pending") {
    return "Mengirim...";
  }

  if (message.deliveryStatus === "failed") {
    return "Gagal dikirim";
  }

  if (message.deliveryStatus === "sent" || message.deliveryStatus === "delivered") {
    return "Terkirim";
  }

  return formatInboxMessageTime(message.created_at);
}

type WhatsappMessageBubbleProps = {
  message: MessageRow;
  onRetry?: () => Promise<void>;
};

export function WhatsappMessageBubble({
  message,
  onRetry,
}: WhatsappMessageBubbleProps) {
  const [isRetrying, startRetry] = useTransition();
  const isIncoming = message.direction === "incoming";
  const attachmentLabel = getAttachmentLabel(message);
  const isFailed = message.deliveryStatus === "failed";

  return (
    <div
      className={cn(
        "flex w-full animate-in fade-in slide-in-from-bottom-1 duration-200",
        isIncoming ? "justify-start pr-6 sm:pr-10" : "justify-end pl-6 sm:pl-10",
      )}
    >
      <div
        className={cn(
          "max-w-[min(100%,28rem)] px-4 py-3",
          isIncoming
            ? cn(
                designSystemPanelClass,
                "rounded-2xl rounded-tl-md text-card-foreground",
              )
            : "rounded-2xl rounded-tr-md bg-slate-900 text-white shadow-sm dark:bg-emerald-800 dark:text-emerald-50",
          isFailed && "ring-2 ring-red-400/60",
        )}
      >
        {message.message_text ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.message_text}
          </p>
        ) : null}
        {attachmentLabel ? (
          <p
            className={cn(
              "mt-1.5 text-xs",
              isIncoming ? "text-muted-foreground" : "text-white/80",
            )}
          >
            {attachmentLabel}
          </p>
        ) : null}
        <div
          className={cn(
            "mt-2 flex items-center justify-end gap-2 text-[11px] tabular-nums",
            isIncoming ? "text-muted-foreground" : "text-white/70",
          )}
        >
          <span>{getDeliveryLabel(message)}</span>
          {onRetry ? (
            <button
              type="button"
              disabled={isRetrying}
              onClick={() => startRetry(onRetry)}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-red-100 hover:bg-white/10"
            >
              <RotateCcw className={cn("h-3 w-3", isRetrying && "animate-spin")} />
              {isRetrying ? "Mengirim..." : "Coba Lagi"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
