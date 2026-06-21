"use client";

import Link from "next/link";

import { CustomerAvatar } from "@/components/omnichannel-inbox/customer-avatar";
import { OmnichannelChannelBadge } from "@/components/omnichannel-inbox/channel-badge";
import {
  formatInboxRelativeTime,
  getConversationDisplayName,
} from "@/components/omnichannel-inbox/inbox-display";
import type { OmnichannelConversationListItem } from "@/lib/omnichannel-inbox/queries";
import type { OmnichannelInboxFilter } from "@/lib/omnichannel-inbox/queries";
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
  if (conversations.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 py-8 text-center">
        <p className="text-sm font-semibold text-foreground">
          {searchQuery.trim() ? "No matching conversations" : "No conversations yet"}
        </p>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
          {searchQuery.trim()
            ? "Try a different name, phone number, or message keyword."
            : "New Instagram and Facebook customer messages will appear here."}
        </p>
      </div>
    );
  }

  return (
    <div>
      {conversations.map((conversation) => {
        const isSelected = conversation.id === selectedConversationId;
        const isUnread = conversation.unreadCount > 0;
        const displayName = getConversationDisplayName(conversation);
        const showUsername =
          conversation.customerUsername &&
          displayName !==
            (conversation.customerUsername.startsWith("@")
              ? conversation.customerUsername
              : `@${conversation.customerUsername}`);

        return (
          <Link
            key={conversation.id}
            href={buildConversationHref(conversation.id, activeFilter)}
            className={cn(
              "block border-b border-border/40 px-4 py-3.5 transition-colors hover:bg-muted/40",
              isSelected && "bg-primary/5 hover:bg-primary/5",
              isUnread && !isSelected && "bg-sky-50/70 hover:bg-sky-50",
            )}
          >
            <div className="flex items-start gap-3">
              <div className="relative shrink-0">
                <CustomerAvatar
                  displayName={displayName}
                  avatarUrl={conversation.customerAvatar}
                  size="sm"
                />
                {isUnread ? (
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "truncate text-sm text-foreground",
                          isUnread ? "font-bold" : "font-semibold",
                        )}
                      >
                        {displayName}
                      </p>
                      {conversation.leadId ? (
                        <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                          Lead
                        </span>
                      ) : null}
                      <OmnichannelChannelBadge channel={conversation.channel} />
                    </div>
                    {showUsername ? (
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        @{conversation.customerUsername?.replace(/^@/, "")}
                      </p>
                    ) : null}
                  </div>

                  <div className="shrink-0 text-right">
                    <p
                      className={cn(
                        "text-[11px] tabular-nums",
                        isUnread
                          ? "font-semibold text-primary"
                          : "font-medium text-muted-foreground",
                      )}
                    >
                      {formatInboxRelativeTime(conversation.lastMessageAt)}
                    </p>
                    {isUnread ? (
                      <span className="mt-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                        {conversation.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>

                <p
                  className={cn(
                    "mt-1.5 line-clamp-2 text-[13px] leading-snug",
                    isUnread
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {conversation.lastMessagePreview ?? "No messages yet"}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
