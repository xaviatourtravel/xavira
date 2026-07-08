"use client";

import Link from "next/link";

import { CustomerAvatar } from "@/components/omnichannel-inbox/customer-avatar";
import { ClientOnlyRelativeTime } from "@/components/omnichannel-inbox/client-only-relative-time";
import {
  getConversationDisplayName,
  getInboxChannelShortLabel,
} from "@/components/omnichannel-inbox/inbox-display";
import {
  AURORA_MOTION,
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
        AURORA_MOTION.hover,
        isSelected && AURORA_QUEUE_ITEM_SELECTED,
        isSelected &&
          "before:absolute before:bottom-2 before:left-0 before:top-2 before:w-0.5 before:rounded-full before:bg-primary",
      )}
    >
      <div className="flex items-start gap-2.5">
        <CustomerAvatar
          displayName={displayName}
          avatarUrl={conversation.customerAvatar}
          size="sm"
          channel={
            conversation.channel === "whatsapp"
              ? "whatsapp"
              : conversation.channel === "instagram"
                ? "instagram"
                : conversation.channel === "facebook"
                  ? "facebook"
                  : "default"
          }
          className="mt-0.5 shrink-0"
        />

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              {isUnread && conversation.unreadCount <= 1 ? (
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                />
              ) : null}
              <p
                className={cn(
                  "min-w-0 truncate text-[13px] leading-tight",
                  isUnread
                    ? "font-semibold text-foreground"
                    : "font-medium text-foreground/90",
                )}
                title={displayName}
              >
                {displayName}
              </p>
              {/* TODO(Aurora): AI queue priority badge */}
            </div>

            <ClientOnlyRelativeTime
              date={conversation.lastMessageAt}
              className={cn(
                "shrink-0 text-[10px] leading-none tabular-nums",
                isUnread
                  ? "font-medium text-foreground/70"
                  : "text-muted-foreground/60",
              )}
            />
          </div>

          <div className="mt-0.5 flex min-w-0 items-center justify-between gap-2">
            <p
              className={cn(
                "min-w-0 flex-1 truncate text-xs leading-snug",
                isUnread ? "text-foreground/80" : "text-muted-foreground/75",
              )}
              title={conversation.lastMessagePreview ?? undefined}
            >
              {conversation.lastMessagePreview ?? ti("noMessageYet")}
            </p>
            {conversation.unreadCount > 1 ? (
              <span
                className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground"
                aria-label={String(conversation.unreadCount)}
              >
                {conversation.unreadCount > 99
                  ? "99+"
                  : conversation.unreadCount}
              </span>
            ) : null}
          </div>

          <p
            className={cn(
              "mt-0.5 truncate text-[10px] leading-snug",
              hasPriority && isReadyForHuman
                ? "font-medium text-amber-700/90 dark:text-amber-400/90"
                : "text-muted-foreground/55",
            )}
          >
            {topicLine}
          </p>
        </div>
      </div>
    </Link>
  );
}
