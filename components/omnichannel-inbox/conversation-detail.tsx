"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Info, MessageSquareText } from "lucide-react";

import {
  addOmnichannelConversationNote,
  assignOmnichannelConversation,
  markOmnichannelConversationAsRead,
  updateOmnichannelConversationStatus,
} from "@/app/(dashboard)/inbox/omnichannel-actions";
import { OmnichannelChannelBadge } from "@/components/omnichannel-inbox/channel-badge";
import {
  ConversationDetailsSidebar,
  type ConversationDetailsSidebarHandle,
} from "@/components/omnichannel-inbox/conversation-details-sidebar";
import { OmnichannelConversationReplyBox } from "@/components/omnichannel-inbox/conversation-reply-box";
import {
  formatInboxMessageTime,
  formatInboxRelativeTime,
  getConversationDisplayName,
} from "@/components/omnichannel-inbox/inbox-display";
import { OmnichannelStatusBadge } from "@/components/omnichannel-inbox/status-badge";
import { buttonVariants } from "@/components/ui/button";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import { formatAssignedUserLabel } from "@/lib/leads/assignment";
import type { MessageRow } from "@/types/omnichannel-inbox";
import { cn } from "@/lib/utils";

type OrgProfile = {
  id: string;
  full_name: string;
};

type OmnichannelConversationDetailPanelProps = {
  conversation: OmnichannelConversationDetail;
  orgProfiles: OrgProfile[];
  canReassign: boolean;
  canUpdateStatus: boolean;
  canAddNote: boolean;
  canReply: boolean;
  isUnassignedForAgent?: boolean;
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
  orgProfiles,
  canReassign,
  canUpdateStatus,
  canAddNote,
  canReply,
  isUnassignedForAgent = false,
}: OmnichannelConversationDetailPanelProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [optimisticMessageText, setOptimisticMessageText] = useState<string | null>(
    null,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const markedReadRef = useRef<string | null>(null);
  const detailsSidebarRef = useRef<ConversationDetailsSidebarHandle>(null);

  const displayName = getConversationDisplayName(conversation);

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
    void markOmnichannelConversationAsRead(conversation.id);
  }, [conversation.id, conversation.unreadCount]);

  function runAction(action: () => Promise<{ success: boolean; message?: string }>) {
    setFeedback(null);
    setError(null);

    startTransition(async () => {
      const result = await action();
      if (result.success) {
        setFeedback(result.message ?? "Saved.");
        return;
      }

      setError(result.message ?? "Unable to save changes.");
    });
  }

  function handleAssign(formData: FormData) {
    formData.set("conversation_id", conversation.id);
    runAction(() => assignOmnichannelConversation(formData));
  }

  function handleStatusChange(status: string) {
    const formData = new FormData();
    formData.set("conversation_id", conversation.id);
    formData.set("status", status);
    runAction(() => updateOmnichannelConversationStatus(formData));
  }

  function handleAddNote(formData: FormData) {
    formData.set("conversation_id", conversation.id);
    runAction(async () => {
      const result = await addOmnichannelConversationNote(formData);
      if (result.success) {
        const form = document.getElementById(
          "omnichannel-note-form",
        ) as HTMLFormElement | null;
        form?.reset();
      }
      return result;
    });
  }

  function openDetails(focusNote = false) {
    setDetailsOpen(true);
    if (focusNote) {
      window.setTimeout(() => {
        detailsSidebarRef.current?.focusNoteTextarea();
      }, 150);
    }
  }

  return (
    <div className="flex h-full min-h-0 bg-background">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/95 px-6 py-2.5 backdrop-blur sm:px-8">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2 className="truncate text-sm font-semibold text-foreground">
                {displayName}
              </h2>
              <OmnichannelChannelBadge channel={conversation.channel} />
              <OmnichannelStatusBadge status={conversation.status} />
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
              <span>{formatAssignedUserLabel(conversation.assignedUserName)}</span>
              <span aria-hidden>·</span>
              <span>Active {formatInboxRelativeTime(conversation.lastMessageAt)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDetailsOpen((open) => !open)}
            className={cn(
              buttonVariants({ variant: detailsOpen ? "default" : "outline", size: "sm" }),
              "h-8 shrink-0 gap-1.5 rounded-full px-3 text-xs",
            )}
            aria-expanded={detailsOpen}
          >
            <Info className="h-3.5 w-3.5" />
            Details
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#efeae2]/30 dark:bg-muted/20">
          <div className="flex w-full flex-col gap-1.5 px-6 py-3 sm:px-8">
            {displayMessages.length === 0 ? (
              <div className="flex flex-col py-10">
                <MessageSquareText className="h-6 w-6 text-muted-foreground/50" />
                <p className="mt-2 text-sm font-medium text-foreground">
                  No messages yet
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Customer messages will appear here.
                </p>
              </div>
            ) : (
              displayMessages.map((message) => {
                const isIncoming = message.direction === "incoming";
                const isOptimistic = message.id === "optimistic-outgoing";
                const attachmentLabel = getAttachmentLabel(message);

                return (
                  <div
                    key={message.id}
                    className={cn("flex w-full", isIncoming ? "justify-start" : "justify-end")}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] rounded-2xl px-3 py-1.5 text-sm shadow-sm",
                        isIncoming
                          ? "rounded-tl-sm bg-white text-foreground ring-1 ring-black/5 dark:bg-card"
                          : "rounded-tr-sm bg-primary text-primary-foreground",
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
                            isIncoming ? "text-muted-foreground" : "opacity-80",
                          )}
                        >
                          {attachmentLabel}
                        </p>
                      ) : null}
                      <p
                        className={cn(
                          "mt-1 text-right text-[10px]",
                          isIncoming ? "text-muted-foreground" : "opacity-70",
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

        <div className="sticky bottom-0 z-10">
          <OmnichannelConversationReplyBox
            conversationId={conversation.id}
            canReply={canReply}
            isUnassignedForAgent={isUnassignedForAgent}
            onOptimisticMessage={setOptimisticMessageText}
            onOpenDetails={openDetails}
          />
        </div>
      </div>

      {detailsOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/20 lg:hidden"
            aria-label="Close details"
            onClick={() => setDetailsOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-40 flex w-[min(100%,320px)] lg:static lg:z-auto lg:w-72 lg:shrink-0">
            <ConversationDetailsSidebar
              ref={detailsSidebarRef}
              conversation={conversation}
              orgProfiles={orgProfiles}
              canReassign={canReassign}
              canUpdateStatus={canUpdateStatus}
              canAddNote={canAddNote}
              isPending={isPending}
              feedback={feedback}
              error={error}
              onClose={() => setDetailsOpen(false)}
              onAssign={handleAssign}
              onStatusChange={handleStatusChange}
              onAddNote={handleAddNote}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

export function OmnichannelConversationEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-muted/10 px-8 text-center">
      <MessageSquareText className="h-10 w-10 text-muted-foreground/50" />
      <p className="mt-4 text-base font-semibold text-foreground">
        Select a conversation
      </p>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Choose a customer thread to view messages and send a reply.
      </p>
    </div>
  );
}
