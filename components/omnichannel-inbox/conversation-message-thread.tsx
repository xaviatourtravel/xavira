"use client";

import { useMemo } from "react";

import { ConversationAiThinkingIndicator } from "@/components/omnichannel-inbox/conversation-ai-thinking-indicator";
import { CustomerAvatar } from "@/components/omnichannel-inbox/customer-avatar";
import { ConversationMessageBubble } from "@/components/omnichannel-inbox/conversation-message-bubble";
import {
  ConversationDateSeparator,
  ConversationUnreadSeparator,
} from "@/components/omnichannel-inbox/conversation-thread-separator";
import { ConversationTypingIndicator } from "@/components/omnichannel-inbox/conversation-typing-indicator";
import {
  AURORA_MESSAGE_AVATAR_SIZE,
  AURORA_MESSAGE_BUBBLE_ENTER,
  AURORA_MESSAGE_GROUP_GAP,
  AURORA_MESSAGE_SENDER_GAP,
  AURORA_STATE_FADE,
} from "@/components/workspace/aurora-tokens";
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
  firstUnreadMessageId?: string | null;
  showAiThinking?: boolean;
  showCustomerTyping?: boolean;
  onRetryMessage?: (messageId: string) => Promise<void>;
  className?: string;
};

function getMessageStackSpacing(groupPosition: MessageGroupPosition) {
  if (groupPosition === "first" || groupPosition === "single") {
    return AURORA_MESSAGE_SENDER_GAP;
  }

  return AURORA_MESSAGE_GROUP_GAP;
}

function shouldShowIncomingAvatar(
  isIncoming: boolean,
  groupPosition: MessageGroupPosition,
) {
  return (
    isIncoming &&
    (groupPosition === "first" || groupPosition === "single")
  );
}

export function ConversationMessageThread({
  messages,
  customerDisplayName = "Customer",
  customerAvatarUrl,
  firstUnreadMessageId = null,
  showAiThinking = false,
  showCustomerTyping = false,
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
        { firstUnreadMessageId },
      ),
    [firstUnreadMessageId, locale, messages, ti],
  );

  return (
    <div className={cn("flex w-full flex-col", className)}>
      {threadItems.map((item) => {
        if (item.type === "date") {
          return (
            <ConversationDateSeparator key={item.key} label={item.label} />
          );
        }

        if (item.type === "unread") {
          return (
            <ConversationUnreadSeparator
              key={item.key}
              label={ti("unreadMessagesSeparator")}
            />
          );
        }

        const isIncoming = item.message.direction === "incoming";
        const showAvatar = shouldShowIncomingAvatar(isIncoming, item.groupPosition);

        return (
          <div
            key={item.key}
            className={cn(
              "flex w-full items-end gap-2 first:mt-0",
              AURORA_MESSAGE_BUBBLE_ENTER,
              isIncoming ? "justify-start" : "justify-end",
              getMessageStackSpacing(item.groupPosition),
            )}
          >
            {isIncoming ? (
              showAvatar ? (
                <CustomerAvatar
                  displayName={customerDisplayName}
                  avatarUrl={customerAvatarUrl}
                  size="sm"
                  className={cn(AURORA_MESSAGE_AVATAR_SIZE, "mb-0.5 shrink-0")}
                />
              ) : (
                <div
                  className={cn(AURORA_MESSAGE_AVATAR_SIZE, "shrink-0")}
                  aria-hidden
                />
              )
            ) : null}

            <ConversationMessageBubble
              message={item.message}
              groupPosition={item.groupPosition}
              onRetry={
                onRetryMessage &&
                item.message.deliveryStatus === "failed" &&
                item.message.id !== "optimistic-outgoing"
                  ? () => onRetryMessage(item.message.id)
                  : undefined
              }
            />
          </div>
        );
      })}

      {showCustomerTyping ? (
        <ConversationTypingIndicator
          variant="customer"
          className={cn(AURORA_MESSAGE_SENDER_GAP, AURORA_STATE_FADE)}
        />
      ) : null}

      {showAiThinking ? (
        <ConversationAiThinkingIndicator
          className={cn(AURORA_MESSAGE_SENDER_GAP, AURORA_STATE_FADE)}
        />
      ) : null}
    </div>
  );
}
