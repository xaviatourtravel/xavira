"use client";

import Link from "next/link";

import { OmnichannelChannelBadge } from "@/components/omnichannel-inbox/channel-badge";
import {
  formatInboxRelativeTime,
  getConversationDisplayName,
} from "@/components/omnichannel-inbox/inbox-display";
import { OmnichannelStatusBadge } from "@/components/omnichannel-inbox/status-badge";
import type { OmnichannelConversationListItem } from "@/lib/omnichannel-inbox/queries";
import type { OmnichannelInboxFilter } from "@/lib/omnichannel-inbox/queries";
import { formatAssignedUserLabel } from "@/lib/leads/assignment";
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
}: {
  conversations: OmnichannelConversationListItem[];
  selectedConversationId: string | null;
  activeFilter: OmnichannelInboxFilter;
}) {
  if (conversations.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <p className="text-sm font-semibold text-foreground">No conversations yet</p>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
          New Instagram and Facebook customer messages will appear here as your team
          receives them.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/60">
      {conversations.map((conversation) => {
        const isSelected = conversation.id === selectedConversationId;
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
              "block border-l-2 px-4 py-3.5 transition-colors hover:bg-muted/40",
              isSelected
                ? "border-l-primary bg-primary/5"
                : "border-l-transparent",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {displayName}
                  </p>
                  <OmnichannelChannelBadge channel={conversation.channel} />
                </div>
                {showUsername ? (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    @
                    {conversation.customerUsername?.replace(/^@/, "")}
                  </p>
                ) : null}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] font-medium text-muted-foreground">
                  {formatInboxRelativeTime(conversation.lastMessageAt)}
                </p>
                {conversation.unreadCount > 0 ? (
                  <span className="mt-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                    {conversation.unreadCount}
                  </span>
                ) : null}
              </div>
            </div>

            <p className="mt-2 line-clamp-2 text-sm leading-snug text-muted-foreground">
              {conversation.lastMessagePreview ?? "No messages yet"}
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <OmnichannelStatusBadge status={conversation.status} />
              <span className="text-[11px] text-muted-foreground">
                {formatAssignedUserLabel(conversation.assignedUserName)}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
