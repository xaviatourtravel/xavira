"use client";

import { useMemo } from "react";

import { ConversationMessageBubble } from "@/components/omnichannel-inbox/conversation-message-bubble";
import { buildMessageThreadItems } from "@/lib/communication/message-thread";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import type { MessageRow } from "@/types/omnichannel-inbox";
import { cn } from "@/lib/utils";

type ConversationMessageThreadProps = {
  messages: MessageRow[];
  customerDisplayName?: string;
  customerAvatarUrl?: string | null;
  onRetryMessage?: (messageId: string) => Promise<void>;
  className?: string;
};

export function ConversationMessageThread({
  messages,
  onRetryMessage,
  className,
}: ConversationMessageThreadProps) {
  const { ti, locale } = useInboxTranslation();

  const threadItems = useMemo(
    () =>
      buildMessageThreadItems(
        messages,
        {
          today: ti("messageDateToday"),
          yesterday: ti("messageDateYesterday"),
        },
        locale,
      ),
    [locale, messages, ti],
  );

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {threadItems.map((item) => {
        if (item.type === "date") {
          return (
            <div key={item.key} className="flex justify-center py-3">
              <span className="rounded-full bg-muted/35 px-3 py-0.5 text-[11px] font-medium text-muted-foreground">
                {item.label}
              </span>
            </div>
          );
        }

        return (
          <ConversationMessageBubble
            key={item.key}
            message={item.message}
            onRetry={
              onRetryMessage &&
              item.message.deliveryStatus === "failed" &&
              item.message.id !== "optimistic-outgoing"
                ? () => onRetryMessage(item.message.id)
                : undefined
            }
          />
        );
      })}
    </div>
  );
}
