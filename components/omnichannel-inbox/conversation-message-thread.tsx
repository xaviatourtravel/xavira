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
    return "mt-3 first:mt-0";
  }

  return "mt-0.5";
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
    <div className={cn("flex flex-col", className)}>
      {threadItems.map((item) => {
        if (item.type === "date") {
          return (
            <div key={item.key} className="flex justify-center py-4">
              <span className="text-[10px] text-muted-foreground/55">
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
