"use client";

import Link from "next/link";

import { CustomerAvatar } from "@/components/omnichannel-inbox/customer-avatar";
import { OmnichannelChannelBadge } from "@/components/omnichannel-inbox/channel-badge";
import { OmnichannelStatusBadge } from "@/components/omnichannel-inbox/status-badge";
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

function formatUnreadCount(count: number) {
  if (count > 99) {
    return "99+";
  }

  return String(count);
}

function ConversationListEmptyState({
  searchQuery,
}: {
  searchQuery: string;
}) {
  if (searchQuery.trim()) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
        <p className="text-sm font-medium text-foreground">
          Tidak ada percakapan yang cocok
        </p>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
          Coba kata kunci lain, nomor telepon, atau isi pesan.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
      <p className="text-sm font-medium text-foreground">Belum ada percakapan</p>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
        Pesan baru dari WhatsApp akan muncul di sini.
      </p>
    </div>
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
  if (conversations.length === 0) {
    return <ConversationListEmptyState searchQuery={searchQuery} />;
  }

  return (
    <div className="flex flex-col gap-0.5 px-2 py-2">
      {conversations.map((conversation) => {
        const isSelected = conversation.id === selectedConversationId;
        const isUnread = conversation.unreadCount > 0;
        const displayName = getConversationDisplayName(conversation);
        // Reserved for future group-chat rows (sender prefix in preview, etc.).
        const isGroupChat = false;

        const showChannelBadge = activeFilter === "all";
        const showStatusBadge =
          conversation.status !== "new" && conversation.status !== "closed_won";
        const showLeadChip = Boolean(conversation.leadId);
        const visibleLabels = conversation.labels.slice(0, 1);
        const showMetaChips =
          showChannelBadge ||
          showStatusBadge ||
          showLeadChip ||
          visibleLabels.length > 0;

        return (
          <Link
            key={conversation.id}
            href={buildConversationHref(conversation.id, activeFilter)}
            className={cn(
              "block min-h-[72px] rounded-[14px] px-3.5 py-3 transition-colors",
              isSelected
                ? "bg-blue-50/90 hover:bg-blue-50"
                : "hover:bg-[#F8FAFC]",
            )}
          >
            <div className="flex items-start gap-3">
              <CustomerAvatar
                displayName={displayName}
                avatarUrl={conversation.customerAvatar}
                size="md"
                isGroupChat={isGroupChat}
                channel={
                  conversation.channel === "whatsapp"
                    ? "whatsapp"
                    : conversation.channel === "instagram"
                      ? "instagram"
                      : conversation.channel === "facebook"
                        ? "facebook"
                        : "default"
                }
                className="shrink-0"
              />

              <div className="flex min-w-0 flex-1 gap-2">
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                  <p
                    className={cn(
                      "truncate text-[15px] leading-tight text-foreground",
                      isUnread ? "font-semibold" : "font-medium",
                    )}
                    title={displayName}
                  >
                    {displayName}
                  </p>

                  <p
                    className={cn(
                      "truncate text-[13px] leading-snug",
                      isUnread
                        ? "text-foreground/75"
                        : "text-muted-foreground",
                    )}
                    title={conversation.lastMessagePreview ?? undefined}
                  >
                    {conversation.lastMessagePreview ?? "Belum ada pesan"}
                  </p>

                  {showMetaChips ? (
                    <div className="flex min-w-0 items-center gap-1 overflow-hidden">
                      {showChannelBadge ? (
                        <OmnichannelChannelBadge
                          channel={conversation.channel}
                          className="shrink-0 px-1.5 py-0 text-[9px] leading-4"
                        />
                      ) : null}
                      {showStatusBadge ? (
                        <OmnichannelStatusBadge
                          status={conversation.status}
                          className="shrink-0 px-1.5 py-0 text-[9px] leading-4"
                        />
                      ) : null}
                      {showLeadChip ? (
                        <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0 text-[9px] font-medium leading-4 text-emerald-700">
                          Lead
                        </span>
                      ) : null}
                      {visibleLabels.map((label) => (
                        <span
                          key={label.tag}
                          className="shrink-0 truncate rounded-full px-1.5 py-0 text-[9px] font-medium leading-4 text-white"
                          style={{ backgroundColor: label.color }}
                        >
                          {label.tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
                  <span
                    className={cn(
                      "text-[11px] leading-none tabular-nums",
                      isUnread
                        ? "font-medium text-blue-600"
                        : "text-muted-foreground",
                    )}
                  >
                    {formatInboxRelativeTime(conversation.lastMessageAt)}
                  </span>

                  {isUnread ? (
                    <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#2563EB] px-1.5 text-[10px] font-semibold leading-none text-white">
                      {formatUnreadCount(conversation.unreadCount)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
