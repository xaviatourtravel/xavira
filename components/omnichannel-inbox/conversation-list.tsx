"use client";

import Link from "next/link";
import { Filter, Inbox, SearchX } from "lucide-react";

import { CustomerAvatar } from "@/components/omnichannel-inbox/customer-avatar";
import { InboxEmptyState } from "@/components/omnichannel-inbox/inbox-empty-state";
import { OmnichannelChannelBadge } from "@/components/omnichannel-inbox/channel-badge";
import { ClientOnlyRelativeTime } from "@/components/omnichannel-inbox/client-only-relative-time";
import { getConversationDisplayName } from "@/components/omnichannel-inbox/inbox-display";
import type { InboxKey } from "@/lib/i18n/inbox-dictionary";
import type { OmnichannelConversationListItem } from "@/lib/omnichannel-inbox/queries";
import type { OmnichannelInboxFilter } from "@/lib/omnichannel-inbox/queries";
import { resolveWhatsappAiState } from "@/lib/whatsapp-inbox/ai/constants";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { cn } from "@/lib/utils";

const EMPTY_STATE_KEYS: Partial<
  Record<
    OmnichannelInboxFilter,
    { titleKey: InboxKey; descriptionKey?: InboxKey }
  >
> = {
  unread: {
    titleKey: "emptyFilterUnread",
    descriptionKey: "emptyFilterUnreadDesc",
  },
  ready_for_human: { titleKey: "emptyFilterReadyForHuman" },
  ai_active: {
    titleKey: "emptyFilterAiActive",
    descriptionKey: "emptyFilterAiActiveDesc",
  },
  human_assisted: { titleKey: "emptyFilterHumanAssisted" },
  human_only: { titleKey: "emptyFilterHumanOnly" },
};

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

function formatUnreadCount(count: number) {
  if (count > 99) {
    return "99+";
  }

  return String(count);
}

function ConversationListEmptyState({
  searchQuery,
  activeFilter,
}: {
  searchQuery: string;
  activeFilter: OmnichannelInboxFilter;
}) {
  const { ti } = useInboxTranslation();

  if (searchQuery.trim()) {
    return (
      <InboxEmptyState
        icon={SearchX}
        title={ti("emptySearchNoMatch")}
        description={ti("emptySearchNoMatchDesc")}
      />
    );
  }

  const filterCopy = EMPTY_STATE_KEYS[activeFilter];

  if (filterCopy) {
    return (
      <InboxEmptyState
        icon={Filter}
        title={ti(filterCopy.titleKey)}
        description={
          filterCopy.descriptionKey ? ti(filterCopy.descriptionKey) : ti("emptySearchNoMatchDesc")
        }
      />
    );
  }

  return (
    <InboxEmptyState
      icon={Inbox}
      title={ti("emptyNoConversations")}
      description={ti("emptyNoConversationsDesc")}
    />
  );
}

export function OmnichannelConversationList({
  conversations,
  selectedConversationId,
  activeFilter,
  searchQuery = "",
}: {
  conversations: OmnichannelConversationListItem[];
  selectedConversationId: string | null;
  activeFilter: OmnichannelInboxFilter;
  searchQuery?: string;
}) {
  const { ti } = useInboxTranslation();

  if (conversations.length === 0) {
    return (
      <ConversationListEmptyState
        searchQuery={searchQuery}
        activeFilter={activeFilter}
      />
    );
  }

  return (
    <div className="flex flex-col py-1">
      {conversations.map((conversation) => {
        const isSelected = conversation.id === selectedConversationId;
        const isUnread = conversation.unreadCount > 0;
        const displayName = getConversationDisplayName(conversation);
        const showChannelBadge = activeFilter === "all";
        const isReadyForHuman =
          conversation.channel === "whatsapp" &&
          resolveWhatsappAiState(conversation.aiState) === "READY_FOR_HUMAN";

        return (
          <Link
            key={conversation.id}
            href={buildConversationHref(conversation.id, activeFilter)}
            className={cn(
              "relative mx-1.5 block rounded-lg px-3 py-3 transition-colors",
              isSelected
                ? "bg-muted/70 dark:bg-muted/40"
                : "hover:bg-muted/35 dark:hover:bg-muted/20",
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

              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex min-w-0 items-baseline justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <p
                      className={cn(
                        "min-w-0 truncate text-[13px] leading-tight text-foreground",
                        isUnread ? "font-medium" : "font-normal",
                      )}
                      title={displayName}
                    >
                      {displayName}
                    </p>
                    {showChannelBadge ? (
                      <OmnichannelChannelBadge
                        channel={conversation.channel}
                        className="shrink-0 px-1 py-0 text-[9px] leading-4 opacity-80"
                      />
                    ) : null}
                  </div>
                  <ClientOnlyRelativeTime
                    date={conversation.lastMessageAt}
                    className={cn(
                      "shrink-0 text-[10px] tabular-nums leading-none",
                      isUnread ? "font-medium text-foreground" : "text-muted-foreground",
                    )}
                  />
                </div>

                <div className="flex min-w-0 items-center justify-between gap-2">
                  <p
                    className={cn(
                      "min-w-0 truncate text-xs leading-snug",
                      isUnread ? "text-foreground/85" : "text-muted-foreground",
                    )}
                    title={conversation.lastMessagePreview ?? undefined}
                  >
                    {conversation.lastMessagePreview ?? ti("noMessageYet")}
                  </p>
                  <span
                    className={cn(
                      "inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full px-1 text-[9px] font-medium leading-none",
                      isUnread
                        ? "bg-primary text-primary-foreground"
                        : "invisible",
                    )}
                    aria-hidden={!isUnread}
                  >
                    {isUnread ? formatUnreadCount(conversation.unreadCount) : "0"}
                  </span>
                </div>

                {isReadyForHuman && activeFilter === "all" ? (
                  <p className="truncate text-[10px] text-amber-700/90 dark:text-amber-300/90">
                    {ti("filterReadyForHuman")}
                  </p>
                ) : null}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
