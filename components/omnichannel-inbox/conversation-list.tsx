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
    const isWhatsappFilter = activeFilter === "whatsapp";

    return (
      <div className="flex h-full flex-col items-center justify-center px-6 py-8 text-center">
        <p className="text-sm font-semibold text-foreground">
          {searchQuery.trim()
            ? "Tidak ada percakapan yang cocok"
            : isWhatsappFilter
              ? "Belum ada percakapan WhatsApp."
              : "No conversations yet"}
        </p>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
          {searchQuery.trim()
            ? "Coba kata kunci lain, nomor telepon, atau isi pesan."
            : isWhatsappFilter
              ? "Pesan masuk dari WhatsApp akan muncul di sini setelah webhook aktif."
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

        const secondaryLabel = conversation.customerUsername?.trim()
          ? conversation.channel === "whatsapp"
            ? conversation.customerUsername.trim()
            : `@${conversation.customerUsername.trim().replace(/^@/, "")}`
          : null;
        const showSecondary = Boolean(
          secondaryLabel && secondaryLabel !== displayName,
        );

        // Sembunyikan lencana kanal yang berlebihan saat filter sudah aktif.
        const showChannelBadge = !(
          activeFilter === "whatsapp" && conversation.channel === "whatsapp"
        );
        // "Baru" hanya bila belum dibaca; status lain tetap tampil (kecil).
        const showStatusBadge = conversation.status !== "new" || isUnread;

        return (
          <Link
            key={conversation.id}
            href={buildConversationHref(conversation.id, activeFilter)}
            className={cn(
              "block border-b border-border/40 px-4 py-2 transition-colors hover:bg-muted/40",
              isSelected && "bg-selected hover:bg-selected",
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
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-600 ring-2 ring-background" />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                {/* Baris 1: nama (utama) + waktu */}
                <div className="flex items-baseline gap-2">
                  <p
                    className={cn(
                      "min-w-0 flex-1 truncate text-[15px] text-foreground",
                      isUnread ? "font-bold" : "font-semibold",
                    )}
                    title={displayName}
                  >
                    {displayName}
                  </p>
                  <span
                    className={cn(
                      "shrink-0 text-[11px] tabular-nums",
                      isUnread
                        ? "font-semibold text-emerald-700"
                        : "font-medium text-muted-foreground",
                    )}
                  >
                    {formatInboxRelativeTime(conversation.lastMessageAt)}
                  </span>
                </div>

                {/* Baris 2: nomor telepon / username (sekunder) */}
                {showSecondary ? (
                  <p
                    className="truncate text-xs text-muted-foreground"
                    title={secondaryLabel ?? undefined}
                  >
                    {secondaryLabel}
                  </p>
                ) : null}

                {/* Baris 3: pratinjau pesan (satu baris) */}
                <p
                  className={cn(
                    "mt-0.5 truncate text-[13px] leading-snug",
                    isUnread
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {conversation.lastMessagePreview ?? "Belum ada pesan"}
                </p>

                {/* Baris 4: lencana kecil + jumlah belum dibaca */}
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  {showChannelBadge ? (
                    <OmnichannelChannelBadge
                      channel={conversation.channel}
                      className="px-1.5 py-0 text-[9px]"
                    />
                  ) : null}
                  {showStatusBadge ? (
                    <OmnichannelStatusBadge
                      status={conversation.status}
                      className="px-1.5 py-0 text-[9px]"
                    />
                  ) : null}
                  {conversation.leadId ? (
                    <span className="rounded-full bg-emerald-50 px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100">
                      Lead
                    </span>
                  ) : null}
                  {conversation.labels.slice(0, 2).map((label) => (
                    <span
                      key={label.tag}
                      className="rounded-full px-1.5 py-0 text-[9px] font-semibold text-white"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.tag}
                    </span>
                  ))}
                  {isUnread ? (
                    <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {conversation.unreadCount}
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
