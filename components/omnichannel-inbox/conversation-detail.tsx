"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ChevronLeft,
  MessageSquareText,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";

import { markOmnichannelConversationAsRead } from "@/app/(dashboard)/inbox/omnichannel-actions";
import { markWhatsappConversationAsRead } from "@/app/(dashboard)/inbox/whatsapp-actions";
import { CustomerAvatar } from "@/components/omnichannel-inbox/customer-avatar";
import { OmnichannelChannelBadge } from "@/components/omnichannel-inbox/channel-badge";
import { OmnichannelConversationReplyBox } from "@/components/omnichannel-inbox/conversation-reply-box";
import {
  formatInboxActiveLabel,
  formatInboxMessageTime,
  getConversationDisplayName,
} from "@/components/omnichannel-inbox/inbox-display";
import { WhatsappMessageBubble } from "@/components/omnichannel-inbox/whatsapp-message-bubble";
import { buttonVariants } from "@/components/ui/button";
import {
  isOptimisticId,
  useWhatsappConversationMessages,
} from "@/lib/communication/realtime";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import { retryWhatsappConversationReplyAction } from "@/app/(dashboard)/inbox/whatsapp-actions";
import type { OmnichannelChannel } from "@/types/omnichannel-inbox";
import type { MessageRow } from "@/types/omnichannel-inbox";
import { cn } from "@/lib/utils";

type OmnichannelConversationDetailPanelProps = {
  conversation: OmnichannelConversationDetail;
  canReply: boolean;
  canSuggestReply?: boolean;
  isUnassignedForAgent?: boolean;
  mobilePanelOpen?: boolean;
  onToggleMobilePanel?: () => void;
  readOnly?: boolean;
  channel?: OmnichannelChannel;
  backHref?: string;
  showBackButton?: boolean;
};

const NEAR_BOTTOM_THRESHOLD_PX = 140;

function getAttachmentLabel(message: MessageRow) {
  const attachments = Array.isArray(message.attachments_json)
    ? message.attachments_json
    : [];

  if (attachments.length === 0) {
    return null;
  }

  return attachments.length === 1 ? "1 lampiran" : `${attachments.length} lampiran`;
}

export function OmnichannelConversationDetailPanel({
  conversation,
  canReply,
  canSuggestReply = false,
  isUnassignedForAgent = false,
  mobilePanelOpen = false,
  onToggleMobilePanel,
  readOnly = false,
  channel,
  backHref = "/inbox",
  showBackButton = false,
}: OmnichannelConversationDetailPanelProps) {
  const isWhatsapp = (channel ?? conversation.channel) === "whatsapp";
  const showComposer = !readOnly || isWhatsapp;

  // Pesan WhatsApp dikelola realtime (lihat hook). Kanal lain memakai pesan dari
  // server + satu pesan optimistik sederhana.
  const {
    messages: liveMessages,
    addOptimisticMessage,
    removeOptimisticMessage,
  } = useWhatsappConversationMessages({
    conversationId: conversation.id,
    enabled: isWhatsapp,
    initialMessages: conversation.messages,
  });

  const [optimisticMessageText, setOptimisticMessageText] = useState<
    string | null
  >(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const markedReadRef = useRef<string | null>(null);
  const prevCountRef = useRef(0);
  const [newMessageCount, setNewMessageCount] = useState(0);

  const displayName = getConversationDisplayName(conversation);

  const displayMessages: MessageRow[] = useMemo(() => {
    if (isWhatsapp) {
      return liveMessages;
    }

    if (optimisticMessageText) {
      return [
        ...conversation.messages,
        {
          id: "optimistic-outgoing",
          conversation_id: conversation.id,
          direction: "outgoing" as const,
          external_message_id: null,
          message_text: optimisticMessageText,
          attachments_json: [],
          sent_by_user_id: null,
          created_at: new Date().toISOString(),
          deliveryStatus: "pending" as const,
        },
      ];
    }

    return conversation.messages;
  }, [
    isWhatsapp,
    liveMessages,
    optimisticMessageText,
    conversation.messages,
    conversation.id,
  ]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    requestAnimationFrame(() => {
      container.scrollTo({ top: container.scrollHeight, behavior });
    });
    setNewMessageCount(0);
  }, []);

  // Saat berganti percakapan, lompat ke bawah tanpa animasi.
  useEffect(() => {
    prevCountRef.current = displayMessages.length;
    setNewMessageCount(0);
    const container = scrollContainerRef.current;
    if (container) {
      requestAnimationFrame(() => {
        container.scrollTo({ top: container.scrollHeight });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  // Auto scroll cerdas: ikuti jika sudah di dekat bawah atau pesan kita sendiri,
  // selain itu tampilkan lencana "pesan baru".
  useEffect(() => {
    const previous = prevCountRef.current;
    prevCountRef.current = displayMessages.length;

    if (displayMessages.length <= previous) {
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const nearBottom = distanceFromBottom < NEAR_BOTTOM_THRESHOLD_PX;
    const last = displayMessages[displayMessages.length - 1];
    const isOwnOutgoing = Boolean(last && last.direction === "outgoing");

    if (nearBottom || isOwnOutgoing) {
      scrollToBottom("smooth");
    } else {
      setNewMessageCount((count) => count + (displayMessages.length - previous));
    }
  }, [displayMessages, scrollToBottom]);

  function handleScroll() {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom < NEAR_BOTTOM_THRESHOLD_PX && newMessageCount > 0) {
      setNewMessageCount(0);
    }
  }

  useEffect(() => {
    if (conversation.unreadCount <= 0) {
      return;
    }

    if (markedReadRef.current === conversation.id) {
      return;
    }

    markedReadRef.current = conversation.id;
    if (readOnly || conversation.channel === "whatsapp") {
      void markWhatsappConversationAsRead(conversation.id);
      return;
    }

    void markOmnichannelConversationAsRead(conversation.id);
  }, [conversation.channel, conversation.id, conversation.unreadCount, readOnly]);

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-background">
      <header className="sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b bg-background/95 px-3 py-1.5 backdrop-blur sm:px-4">
        {showBackButton ? (
          <Link
            href={backHref}
            aria-label="Kembali ke percakapan"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-11 w-11 shrink-0 rounded-full p-0 lg:hidden",
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        ) : null}

        <CustomerAvatar
          displayName={displayName}
          avatarUrl={conversation.customerAvatar}
          size="sm"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2
              className="truncate text-sm font-semibold text-foreground"
              title={displayName}
            >
              {displayName}
            </h2>
            <OmnichannelChannelBadge channel={conversation.channel} />
          </div>
          <p
            className="truncate text-[11px] text-muted-foreground"
            title={formatInboxActiveLabel(conversation.lastMessageAt)}
          >
            {formatInboxActiveLabel(conversation.lastMessageAt)}
          </p>
        </div>

        {onToggleMobilePanel ? (
          <button
            type="button"
            onClick={onToggleMobilePanel}
            className={cn(
              buttonVariants({
                variant: mobilePanelOpen ? "default" : "outline",
                size: "sm",
              }),
              "h-7 shrink-0 gap-1.5 rounded-lg px-2.5 text-xs lg:hidden",
            )}
            aria-expanded={mobilePanelOpen}
          >
            {mobilePanelOpen ? (
              <>
                <PanelRightClose className="h-3.5 w-3.5" />
                Intelligence
              </>
            ) : (
              <>
                <PanelRightOpen className="h-3.5 w-3.5" />
                Intelligence
              </>
            )}
          </button>
        ) : null}
      </header>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto bg-slate-50/80 dark:bg-muted/15"
      >
        <div
          className={cn(
            "flex w-full flex-col px-3 py-3 sm:px-4",
            isWhatsapp ? "gap-3" : "gap-1 py-2",
          )}
        >
          {displayMessages.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <MessageSquareText className="h-6 w-6 text-muted-foreground/50" />
              <p className="mt-2 text-sm font-medium text-foreground">
                {isWhatsapp ? "Belum ada pesan" : "No messages yet"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isWhatsapp
                  ? "Pesan WhatsApp akan muncul di sini."
                  : "Customer messages will appear here."}
              </p>
            </div>
          ) : isWhatsapp ? (
            displayMessages.map((message) => (
              <WhatsappMessageBubble
                key={message.id}
                message={message}
                onRetry={
                  message.deliveryStatus === "failed" &&
                  !isOptimisticId(message.id)
                    ? async () => {
                        const formData = new FormData();
                        formData.set("message_id", message.id);
                        await retryWhatsappConversationReplyAction(formData);
                      }
                    : undefined
                }
              />
            ))
          ) : (
            displayMessages.map((message) => {
              const isIncoming = message.direction === "incoming";
              const isOptimistic = message.id === "optimistic-outgoing";
              const attachmentLabel = getAttachmentLabel(message);

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex w-full",
                    isIncoming ? "justify-start pr-4 sm:pr-6" : "justify-end pl-4 sm:pl-6",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                      isIncoming
                        ? "rounded-tl-md bg-white text-foreground ring-1 ring-black/5 dark:bg-card"
                        : "rounded-tr-md bg-[#005c4b] text-white dark:bg-primary",
                      isOptimistic && "opacity-75",
                    )}
                  >
                    {message.message_text ? (
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {message.message_text}
                      </p>
                    ) : null}
                    {attachmentLabel ? (
                      <p
                        className={cn(
                          "mt-1 text-xs",
                          isIncoming ? "text-muted-foreground" : "text-white/80",
                        )}
                      >
                        {attachmentLabel}
                      </p>
                    ) : null}
                    <p
                      className={cn(
                        "mt-1 text-right text-[10px]",
                        isIncoming ? "text-muted-foreground" : "text-white/70",
                      )}
                    >
                      {isOptimistic
                        ? "Mengirim..."
                        : formatInboxMessageTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {newMessageCount > 0 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex justify-center">
          <button
            type="button"
            onClick={() => scrollToBottom("smooth")}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg animate-in fade-in slide-in-from-bottom-2"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            {newMessageCount === 1
              ? "1 pesan baru"
              : `${newMessageCount} pesan baru`}
          </button>
        </div>
      ) : null}

      {showComposer ? (
        <div className="sticky bottom-0 z-10 shrink-0 border-t bg-background">
          <OmnichannelConversationReplyBox
            conversationId={conversation.id}
            channel={conversation.channel}
            canReply={canReply}
            canSuggestReply={canSuggestReply && !isWhatsapp}
            isUnassignedForAgent={isUnassignedForAgent}
            onOptimisticMessage={setOptimisticMessageText}
            onAddOptimistic={addOptimisticMessage}
            onRemoveOptimistic={removeOptimisticMessage}
          />
        </div>
      ) : null}
    </div>
  );
}

export function OmnichannelConversationEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-[#f4f6f8] px-8 text-center dark:bg-muted/10">
      <MessageSquareText className="h-10 w-10 text-muted-foreground/40" />
      <p className="mt-4 text-base font-semibold text-foreground">
        Select a conversation
      </p>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Choose a thread to start messaging.
      </p>
    </div>
  );
}
