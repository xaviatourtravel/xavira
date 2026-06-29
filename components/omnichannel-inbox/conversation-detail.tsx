"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, MessageSquareText, PanelRightClose, PanelRightOpen } from "lucide-react";

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

function getAttachmentLabel(message: MessageRow) {
  const attachments = Array.isArray(message.attachments_json)
    ? message.attachments_json
    : [];

  if (attachments.length === 0) {
    return null;
  }

  return attachments.length === 1 ? "1 attachment" : `${attachments.length} attachments`;
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
  const [optimisticMessageText, setOptimisticMessageText] = useState<string | null>(
    null,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const markedReadRef = useRef<string | null>(null);

  const displayName = getConversationDisplayName(conversation);
  const isWhatsapp = (channel ?? conversation.channel) === "whatsapp";
  const showComposer = !readOnly || isWhatsapp;

  const displayMessages: MessageRow[] = optimisticMessageText
    ? [
        ...conversation.messages,
        {
          id: "optimistic-outgoing",
          conversation_id: conversation.id,
          direction: "outgoing",
          external_message_id: null,
          message_text: optimisticMessageText,
          attachments_json: [],
          sent_by_user_id: null,
          created_at: new Date().toISOString(),
          deliveryStatus: "pending",
        },
      ]
    : conversation.messages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages.length, optimisticMessageText]);

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

      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/80 dark:bg-muted/15">
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
                  message.deliveryStatus === "failed" && message.id !== "optimistic-outgoing"
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
                        ? "Sending…"
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

      {showComposer ? (
        <div className="sticky bottom-0 z-10 shrink-0 border-t bg-background">
          <OmnichannelConversationReplyBox
            conversationId={conversation.id}
            channel={conversation.channel}
            canReply={canReply}
            canSuggestReply={canSuggestReply && !isWhatsapp}
            isUnassignedForAgent={isUnassignedForAgent}
            onOptimisticMessage={setOptimisticMessageText}
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
