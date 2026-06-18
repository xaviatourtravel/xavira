"use client";

import Link from "next/link";

import { OmnichannelChannelBadge } from "@/components/omnichannel-inbox/channel-badge";
import { OmnichannelStatusBadge } from "@/components/omnichannel-inbox/status-badge";
import type { OmnichannelConversationListItem } from "@/lib/omnichannel-inbox/queries";
import type { OmnichannelInboxFilter } from "@/lib/omnichannel-inbox/queries";
import { formatAssignedUserLabel } from "@/lib/leads/assignment";
import { cn } from "@/lib/utils";

function formatRelativeTime(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

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
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-medium">No conversations yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Instagram DM and Facebook Messenger messages will appear here after
          webhook sync.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {conversations.map((conversation) => {
        const isSelected = conversation.id === selectedConversationId;

        return (
          <Link
            key={conversation.id}
            href={buildConversationHref(conversation.id, activeFilter)}
            className={cn(
              "block px-4 py-3 transition-colors hover:bg-muted/50",
              isSelected && "bg-muted",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold">
                    {conversation.customerName}
                  </p>
                  <OmnichannelChannelBadge channel={conversation.channel} />
                </div>
                {conversation.customerUsername ? (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    @{conversation.customerUsername}
                  </p>
                ) : null}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] text-muted-foreground">
                  {formatRelativeTime(conversation.lastMessageAt)}
                </p>
                {conversation.unreadCount > 0 ? (
                  <span className="mt-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    {conversation.unreadCount}
                  </span>
                ) : null}
              </div>
            </div>

            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
              {conversation.lastMessagePreview ?? "No messages yet"}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
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
