"use client";

import { Filter, Inbox, SearchX } from "lucide-react";

import { ConversationQueueItem } from "@/components/omnichannel-inbox/conversation-queue-item";
import { InboxEmptyState } from "@/components/omnichannel-inbox/inbox-empty-state";
import type { InboxKey } from "@/lib/i18n/inbox-dictionary";
import type { OmnichannelConversationListItem } from "@/lib/omnichannel-inbox/queries";
import type { OmnichannelInboxFilter } from "@/lib/omnichannel-inbox/queries";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";

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

function ConversationQueueEmptyState({
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
        variant="compact"
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
          filterCopy.descriptionKey
            ? ti(filterCopy.descriptionKey)
            : ti("emptySearchNoMatchDesc")
        }
        variant="compact"
      />
    );
  }

  return (
    <InboxEmptyState
      icon={Inbox}
      title={ti("emptyNoConversations")}
      description={ti("emptyNoConversationsDesc")}
      variant="compact"
    />
  );
}

/**
 * Aurora Conversation Queue — scanning-optimized inbox list.
 */
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
      <ConversationQueueEmptyState
        searchQuery={searchQuery}
        activeFilter={activeFilter}
      />
    );
  }

  return (
    <div
      className="flex flex-col gap-0.5 px-2 py-1.5"
      role="list"
      aria-label={ti("conversationQueueAriaLabel")}
    >
      {conversations.map((conversation) => (
        <div key={conversation.id} role="listitem">
          <ConversationQueueItem
            conversation={conversation}
            isSelected={conversation.id === selectedConversationId}
            activeFilter={activeFilter}
          />
        </div>
      ))}
    </div>
  );
}
