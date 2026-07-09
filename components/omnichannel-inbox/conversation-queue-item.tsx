"use client";

import Link from "next/link";

import { CustomerAvatar } from "@/components/omnichannel-inbox/customer-avatar";
import { ClientOnlyRelativeTime } from "@/components/omnichannel-inbox/client-only-relative-time";
import {
  getConversationDisplayName,
  getInboxChannelShortLabel,
} from "@/components/omnichannel-inbox/inbox-display";
import {
  AURORA_QUEUE_ITEM_BASE,
  AURORA_QUEUE_ITEM_HOVER,
  AURORA_QUEUE_ITEM_SELECTED,
} from "@/components/workspace/aurora-tokens";
import type { OmnichannelConversationListItem } from "@/lib/omnichannel-inbox/queries";
import type { OmnichannelInboxFilter } from "@/lib/omnichannel-inbox/queries";
import { resolveWhatsappAiState } from "@/lib/whatsapp-inbox/ai/constants";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { cn } from "@/lib/utils";

function buildConversationHref(
  conversationId: string,
  filter: OmnichannelInboxFilter,
) {
  const params = new URLSearchParams();
  if (filter !== "all") {
    params.set("filter", filter);
  }
  params.set("c", conversationId);
  return `/inbox?${params.toString()}`;
}

function getQueueTopicLine(
  conversation: OmnichannelConversationListItem,
  activeFilter: OmnichannelInboxFilter,
  readyForHumanLabel: string,
) {
  const channelLabel = getInboxChannelShortLabel(conversation.channel);
  const isReadyForHuman =
    conversation.channel === "whatsapp" &&
    resolveWhatsappAiState(conversation.aiState) === "READY_FOR_HUMAN";

  const parts = [channelLabel];

  if (isReadyForHuman && activeFilter !== "ready_for_human") {
    parts.push(readyForHumanLabel);
  } else if (conversation.status === "following_up") {
    parts.push(conversation.statusLabel);
  }

  return parts.join(" · ");
}

export type ConversationQueueItemProps = {
  conversation: OmnichannelConversationListItem;
  isSelected: boolean;
  activeFilter: OmnichannelInboxFilter;
};

/**
 * Aurora Conversation Queue row — who, priority, topic, preview, time at a glance.
 */
export function ConversationQueueItem({
  conversation,
  isSelected,
  activeFilter,
}: ConversationQueueItemProps) {
  const { ti } = useInboxTranslation();
  const isUnread = conversation.unreadCount > 0;
  const displayName = getConversationDisplayName(conversation);
  const topicLine = getQueueTopicLine(
    conversation,
    activeFilter,
    ti("filterReadyForHuman"),
  );
  const isReadyForHuman =
    conversation.channel === "whatsapp" &&
    resolveWhatsappAiState(conversation.aiState) === "READY_FOR_HUMAN";
  const hasPriority = isUnread || isReadyForHuman;

  return (
    <Link
      href={buildConversationHref(conversation.id, activeFilter)}
      aria-current={isSelected ? "true" : undefined}
      className={cn(
        AURORA_QUEUE_ITEM_BASE,
        AURORA_QUEUE_ITEM_HOVER,
        isSelected && AURORA_QUEUE_ITEM_SELECTED,
        isSelected &&
          "before:absolute before:bottom-2 before:left-0 before:top-2 before:w-px before:rounded-full before:bg-primary/70",
      )}
    >
      <div className="flex items-center gap-2.5">
        <CustomerAvatar
          displayName={displayName}
          avatarUrl={conversation.customerAvatar}
          size="md"
          className="h-10 w-10 shrink-0"
          channel={
            conversation.channel === "whatsapp"
              ? "whatsapp"
              : conversation.channel === "instagram"
                ? "instagram"
                : conversation.channel === "facebook"
                  ? "facebook"
                  : "default"
          }
        />

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-baseline justify-between gap-2">
            <p
              className={cn(
                "min-w-0 truncate text-[13px] leading-tight",
                isUnread ? "font-semibold text-foreground" : "font-semibold text-foreground/90",
              )}
              title={displayName}
            >
              {displayName}
            </p>

            <ClientOnlyRelativeTime
              date={conversation.lastMessageAt}
              className="shrink-0 text-[10px] leading-none tabular-nums text-muted-foreground/50"
            />
          </div>

          <div className="mt-0.5 flex min-w-0 items-center justify-between gap-2">
            <p
              className={cn(
                "min-w-0 flex-1 truncate text-xs leading-snug",
                isUnread ? "text-muted-foreground/75" : "text-muted-foreground/60",
              )}
              title={conversation.lastMessagePreview ?? undefined}
            >
              {conversation.lastMessagePreview ?? ti("noMessageYet")}
            </p>
            {isUnread ? (
              <span
                className={cn(
                  "inline-flex shrink-0 items-center justify-center rounded-full bg-primary/90 font-medium leading-none text-primary-foreground",
                  conversation.unreadCount > 1
                    ? "h-4 min-w-4 px-1 text-[9px]"
                    : "h-1.5 w-1.5",
                )}
                aria-label={
                  conversation.unreadCount > 1
                    ? String(conversation.unreadCount)
                    : ti("filterUnread")
                }
              >
                {conversation.unreadCount > 1
                  ? conversation.unreadCount > 99
                    ? "99+"
                    : conversation.unreadCount
                  : null}
              </span>
            ) : null}
          </div>

          <p
            className={cn(
              "mt-0.5 truncate text-[10px] leading-snug",
              hasPriority && isReadyForHuman
                ? "font-medium text-amber-700/80 dark:text-amber-400/80"
                : "text-muted-foreground/45",
            )}
          >
            {topicLine}
          </p>
        </div>
      </div>
    </Link>
  );
}
