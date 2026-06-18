"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import {
  addOmnichannelConversationNote,
  assignOmnichannelConversation,
  markOmnichannelConversationAsRead,
  updateOmnichannelConversationStatus,
} from "@/app/(dashboard)/inbox/omnichannel-actions";
import { OmnichannelChannelBadge } from "@/components/omnichannel-inbox/channel-badge";
import { OmnichannelConversationReplyBox } from "@/components/omnichannel-inbox/conversation-reply-box";
import { OmnichannelStatusBadge } from "@/components/omnichannel-inbox/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { OMNICHANNEL_CONVERSATION_STATUSES, formatOmnichannelConversationStatusLabel } from "@/lib/omnichannel-inbox/constants";
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

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

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
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [optimisticMessageText, setOptimisticMessageText] = useState<string | null>(
    null,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const markedReadRef = useRef<string | null>(null);

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

      setError(result.message ?? "Action failed.");
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

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{conversation.customerName}</h2>
            {conversation.customerUsername ? (
              <p className="text-sm text-muted-foreground">
                @{conversation.customerUsername}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <OmnichannelChannelBadge channel={conversation.channel} />
              <OmnichannelStatusBadge status={conversation.status} />
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="text-muted-foreground">Assigned</p>
            <p className="font-medium">
              {formatAssignedUserLabel(conversation.assignedUserName)}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {canReassign ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleAssign(new FormData(event.currentTarget));
              }}
              className="space-y-1"
            >
              <label className="text-xs font-medium text-muted-foreground">
                Assign to
              </label>
              <div className="flex gap-2">
                <select
                  name="assigned_user_id"
                  defaultValue={conversation.assignedUserId ?? ""}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  disabled={isPending}
                >
                  <option value="">Unassigned</option>
                  {orgProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.full_name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={isPending}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Save
                </button>
              </div>
            </form>
          ) : null}

          {canUpdateStatus ? (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Status
              </label>
              <select
                value={conversation.status}
                onChange={(event) => handleStatusChange(event.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                disabled={isPending}
              >
                {OMNICHANNEL_CONVERSATION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {formatOmnichannelConversationStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        {feedback ? (
          <p className="mt-3 text-sm text-green-700">{feedback}</p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="space-y-3">
          {displayMessages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No messages yet.</p>
          ) : (
            displayMessages.map((message) => {
              const isIncoming = message.direction === "incoming";
              const isOptimistic = message.id === "optimistic-outgoing";
              const attachmentLabel = getAttachmentLabel(message);

              return (
                <div
                  key={message.id}
                  className={cn("flex", isIncoming ? "justify-start" : "justify-end")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                      isIncoming
                        ? "bg-muted text-foreground"
                        : "bg-primary text-primary-foreground",
                      isOptimistic && "opacity-80",
                    )}
                  >
                    {message.message_text ? (
                      <p className="whitespace-pre-wrap">{message.message_text}</p>
                    ) : null}
                    {attachmentLabel ? (
                      <p className="mt-1 text-xs opacity-80">{attachmentLabel}</p>
                    ) : null}
                    <p className="mt-1 text-[10px] opacity-70">
                      {isOptimistic
                        ? "Sending…"
                        : formatMessageTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t px-5 py-4">
        <div className="mb-4 space-y-3">
          <h3 className="text-sm font-semibold">Internal Notes</h3>
          {conversation.notes.length === 0 ? (
            <p className="text-xs text-muted-foreground">No internal notes yet.</p>
          ) : (
            <div className="max-h-36 space-y-2 overflow-y-auto">
              {conversation.notes.map((note) => (
                <div key={note.id} className="rounded-lg border bg-amber-50/60 p-3">
                  <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {note.authorName} · {formatMessageTime(note.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {canAddNote ? (
            <form
              id="omnichannel-note-form"
              onSubmit={(event) => {
                event.preventDefault();
                handleAddNote(new FormData(event.currentTarget));
              }}
              className="space-y-2"
            >
              <textarea
                name="note"
                rows={2}
                placeholder="Add internal note for your team…"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                disabled={isPending}
                required
              />
              <button
                type="submit"
                disabled={isPending}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Add Note
              </button>
            </form>
          ) : null}
        </div>

        <OmnichannelConversationReplyBox
          conversationId={conversation.id}
          canReply={canReply}
          isUnassignedForAgent={isUnassignedForAgent}
          onOptimisticMessage={setOptimisticMessageText}
        />
      </div>
    </div>
  );
}

export function OmnichannelConversationEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <p className="text-base font-medium">Select a conversation</p>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Choose a thread from the list to view message history, update status, and
        add internal notes.
      </p>
    </div>
  );
}
