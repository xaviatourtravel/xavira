"use client";

import Link from "next/link";
import { Filter, Inbox, SearchX } from "lucide-react";

import { CustomerAvatar } from "@/components/omnichannel-inbox/customer-avatar";
import { InboxEmptyState } from "@/components/omnichannel-inbox/inbox-empty-state";
import { ClientOnlyRelativeTime } from "@/components/omnichannel-inbox/client-only-relative-time";
import {
  getConversationDisplayName,
  getInboxChannelShortLabel,
} from "@/components/omnichannel-inbox/inbox-display";
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
    <div className="flex flex-col gap-0.5 py-1">
      {conversations.map((conversation) => {
        const isSelected = conversation.id === selectedConversationId;
        const isUnread = conversation.unreadCount > 0;
        const displayName = getConversationDisplayName(conversation);
        const isReadyForHuman =
          conversation.channel === "whatsapp" &&
          resolveWhatsappAiState(conversation.aiState) === "READY_FOR_HUMAN";
        const channelLabel = getInboxChannelShortLabel(conversation.channel);
        const statusHint =
          !isUnread && isReadyForHuman && activeFilter === "all"
            ? ti("filterReadyForHuman")
            : null;

        return (
          <Link
            key={conversation.id}
            href={buildConversationHref(conversation.id, activeFilter)}
            className={cn(
              "group relative mx-2 block rounded-lg px-3 py-3 transition-colors duration-150",
              isSelected
                ? "border-l-2 border-l-primary/80 bg-muted/45 pl-[calc(0.75rem-2px)] dark:bg-muted/25"
                : "border-l-2 border-l-transparent hover:bg-muted/25 dark:hover:bg-muted/15",
            )}
          >
            <div className="flex items-start gap-3">
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
                <div className="flex min-w-0 items-baseline justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    {isUnread ? (
                      <span
                        aria-hidden
                        className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                      />
                    ) : null}
                    <p
                      className={cn(
                        "min-w-0 truncate text-sm leading-tight text-foreground",
                        isUnread ? "font-medium" : "font-normal",
                      )}
                      title={displayName}
                    >
                      {displayName}
                    </p>
                  </div>
                  <ClientOnlyRelativeTime
                    date={conversation.lastMessageAt}
                    className={cn(
                      "shrink-0 text-[11px] leading-none text-muted-foreground",
                      isUnread && "text-foreground/70",
                    )}
                  />
                </div>

                <p
                  className={cn(
                    "mt-1 min-w-0 truncate text-[13px] leading-snug",
                    isUnread ? "text-foreground/85" : "text-muted-foreground",
                  )}
                  title={conversation.lastMessagePreview ?? undefined}
                >
                  {conversation.lastMessagePreview ?? ti("noMessageYet")}
                </p>

                <p className="mt-1 truncate text-[11px] text-muted-foreground/80">
                  {channelLabel}
                  {statusHint ? ` · ${statusHint}` : null}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
