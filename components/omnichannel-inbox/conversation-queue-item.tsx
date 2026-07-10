"use client";

import Link from "next/link";

import { CustomerAvatar } from "@/components/omnichannel-inbox/customer-avatar";
import { ClientOnlyRelativeTime } from "@/components/omnichannel-inbox/client-only-relative-time";
import { getConversationDisplayName } from "@/components/omnichannel-inbox/inbox-display";
import {
  AURORA_QUEUE_ITEM_BASE,
  AURORA_QUEUE_ITEM_HOVER,
  AURORA_QUEUE_ITEM_SELECTED,
} from "@/components/workspace/aurora-tokens";
import type { OmnichannelConversationListItem } from "@/lib/omnichannel-inbox/queries";
import type { OmnichannelInboxFilter } from "@/lib/omnichannel-inbox/queries";
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

export type ConversationQueueItemProps = {
  conversation: OmnichannelConversationListItem;
  isSelected: boolean;
  activeFilter: OmnichannelInboxFilter;
};

/**
 * Aurora Conversation Queue row — avatar, name, preview, time, unread at a glance.
 */
export function ConversationQueueItem({
  conversation,
  isSelected,
  activeFilter,
}: ConversationQueueItemProps) {
  const { ti } = useInboxTranslation();
  const isUnread = conversation.unreadCount > 0;
  const displayName = getConversationDisplayName(conversation);

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
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <CustomerAvatar
          displayName={displayName}
          avatarUrl={conversation.customerAvatar}
          size="md"
          className="h-9 w-9 shrink-0"
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
              className="min-w-0 truncate text-[13px] font-semibold leading-tight text-foreground"
              title={displayName}
            >
              {displayName}
            </p>

            <ClientOnlyRelativeTime
              date={conversation.lastMessageAt}
              className="shrink-0 text-[10px] leading-none tabular-nums text-muted-foreground/55"
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
        </div>
      </div>
    </Link>
  );
}
