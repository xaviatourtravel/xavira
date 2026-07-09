"use client";

import { useMemo } from "react";

import { ConversationMessageBubble } from "@/components/omnichannel-inbox/conversation-message-bubble";
import {
  buildMessageThreadItems,
  type MessageGroupPosition,
} from "@/lib/communication/message-thread";
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

function getMessageStackSpacing(groupPosition: MessageGroupPosition) {
  if (groupPosition === "first" || groupPosition === "single") {
    return "mt-5 first:mt-0";
  }

  return "mt-1";
}

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
    <div className={cn("flex w-full flex-col", className)}>
      {threadItems.map((item) => {
        if (item.type === "date") {
          return (
            <div
              key={item.key}
              className="flex w-full justify-center py-4 first:pt-0"
              role="separator"
              aria-label={item.label}
            >
              <span className="text-[10px] font-medium tracking-wide text-muted-foreground/50">
                {item.label}
              </span>
            </div>
          );
        }

        return (
          <ConversationMessageBubble
            key={item.key}
            message={item.message}
            groupPosition={item.groupPosition}
            className={getMessageStackSpacing(item.groupPosition)}
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
