"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import {
  Clock3,
  MessageSquare,
  StickyNote,
  Tag,
  UserRound,
  X,
} from "lucide-react";

import { CustomerAvatar } from "@/components/omnichannel-inbox/customer-avatar";
import { OmnichannelChannelBadge } from "@/components/omnichannel-inbox/channel-badge";
import { ClientOnlyRelativeTime } from "@/components/omnichannel-inbox/client-only-relative-time";
import {
  formatInboxMessageTime,
  getConversationDisplayName,
} from "@/components/omnichannel-inbox/inbox-display";
import { OmnichannelStatusBadge } from "@/components/omnichannel-inbox/status-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  OMNICHANNEL_CONVERSATION_STATUSES,
  formatOmnichannelConversationStatusLabel,
} from "@/lib/omnichannel-inbox/constants";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import { formatAssignedUserLabel } from "@/lib/leads/assignment";
import { cn } from "@/lib/utils";

type OrgProfile = {
  id: string;
  full_name: string;
};

export type ConversationDetailsSidebarHandle = {
  focusNoteTextarea: () => void;
};

type CustomerProfileDrawerProps = {
  conversation: OmnichannelConversationDetail;
  orgProfiles: OrgProfile[];
  canReassign: boolean;
  canUpdateStatus: boolean;
  canAddNote: boolean;
  isPending: boolean;
  feedback: string | null;
  error: string | null;
  onClose: () => void;
  onAssign: (formData: FormData) => void;
  onStatusChange: (status: string) => void;
  onAddNote: (formData: FormData) => void;
};

type ActivityItem = {
  id: string;
  label: string;
  detail?: string;
  timestamp: string;
  tone: "message" | "note" | "system";
};

function buildActivityTimeline(
  conversation: OmnichannelConversationDetail,
): ActivityItem[] {
  const messageItems: ActivityItem[] = conversation.messages.map((message) => ({
    id: `message-${message.id}`,
    label:
      message.direction === "incoming"
        ? "Customer sent a message"
        : "Team sent a reply",
    detail: message.message_text?.trim() || undefined,
    timestamp: message.created_at,
    tone: "message",
  }));

  const noteItems: ActivityItem[] = conversation.notes.map((note) => ({
    id: `note-${note.id}`,
    label: `Internal note added${note.authorName ? ` by ${note.authorName}` : ""}`,
    detail: note.note.trim(),
    timestamp: note.created_at,
    tone: "note",
  }));

  return [...messageItems, ...noteItems]
    .sort(
      (left, right) =>
        new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
    )
    .slice(0, 12);
}

export const ConversationDetailsSidebar = forwardRef<
  ConversationDetailsSidebarHandle,
  CustomerProfileDrawerProps
>(function ConversationDetailsSidebar(
  {
    conversation,
    orgProfiles,
    canReassign,
    canUpdateStatus,
    canAddNote,
    isPending,
    feedback,
    error,
    onClose,
    onAssign,
    onStatusChange,
    onAddNote,
  },
  ref,
) {
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);
  const displayName = getConversationDisplayName(conversation);
  const activityTimeline = useMemo(
    () => buildActivityTimeline(conversation),
    [conversation],
  );

  useImperativeHandle(ref, () => ({
    focusNoteTextarea() {
      noteTextareaRef.current?.focus();
      noteTextareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
  }));

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
        aria-label="Close customer profile"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-[min(100%,380px)] flex-col border-l bg-background shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <CustomerAvatar
              displayName={displayName}
              avatarUrl={conversation.customerAvatar}
              size="lg"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">
                  Customer profile
                </h3>
              </div>
              <p className="mt-1 truncate text-base font-semibold">{displayName}</p>
              {conversation.customerUsername ? (
                <p className="truncate text-xs text-muted-foreground">
                  @{conversation.customerUsername.replace(/^@/, "")}
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-8 w-8 rounded-full p-0",
            )}
            aria-label="Close customer profile"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <section className="space-y-3 rounded-xl border bg-muted/20 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Channel
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <OmnichannelChannelBadge channel={conversation.channel} />
              <OmnichannelStatusBadge status={conversation.status} />
            </div>
            <p className="text-xs text-muted-foreground">
              Last active{" "}
              <ClientOnlyRelativeTime
                date={conversation.lastMessageAt}
                className="min-w-[72px] text-xs"
              />
            </p>
          </section>

          {canReassign ? (
            <section className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Assignment
              </p>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  onAssign(new FormData(event.currentTarget));
                }}
                className="space-y-2"
              >
                <select
                  name="assigned_user_id"
                  defaultValue={conversation.assignedUserId ?? ""}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
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
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
                >
                  Save assignment
                </button>
              </form>
            </section>
          ) : (
            <section className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Assignment
              </p>
              <p className="text-sm text-foreground">
                {formatAssignedUserLabel(conversation.assignedUserName)}
              </p>
            </section>
          )}

          {canUpdateStatus ? (
            <section className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Lead status
              </p>
              <select
                value={conversation.status}
                onChange={(event) => onStatusChange(event.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                disabled={isPending}
              >
                {OMNICHANNEL_CONVERSATION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {formatOmnichannelConversationStatusLabel(status)}
                  </option>
                ))}
              </select>
            </section>
          ) : (
            <section className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Lead status
              </p>
              <OmnichannelStatusBadge status={conversation.status} />
            </section>
          )}

          <section id="omnichannel-internal-notes" className="space-y-3">
            <div className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-amber-600" />
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Internal notes
              </p>
              {conversation.notes.length > 0 ? (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {conversation.notes.length}
                </span>
              ) : null}
            </div>

            {conversation.notes.length === 0 ? (
              <p className="text-xs text-muted-foreground">No internal notes yet.</p>
            ) : (
              <div className="max-h-40 space-y-2 overflow-y-auto">
                {conversation.notes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-lg border border-amber-100 bg-amber-50/70 p-2.5"
                  >
                    <p className="whitespace-pre-wrap text-sm text-foreground">
                      {note.note}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {note.authorName} · {formatInboxMessageTime(note.created_at)}
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
                  onAddNote(new FormData(event.currentTarget));
                }}
                className="space-y-2"
              >
                <textarea
                  ref={noteTextareaRef}
                  name="note"
                  rows={3}
                  placeholder="Add a private note for your team…"
                  className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm"
                  disabled={isPending}
                  required
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
                >
                  Add note
                </button>
              </form>
            ) : null}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Activity timeline
              </p>
            </div>

            {activityTimeline.length > 0 ? (
              <div className="space-y-3">
                {activityTimeline.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <span
                      className={cn(
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                        item.tone === "note"
                          ? "bg-amber-100 text-amber-700"
                          : item.tone === "message"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {item.tone === "note" ? (
                        <StickyNote className="h-3.5 w-3.5" />
                      ) : (
                        <MessageSquare className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      {item.detail ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {item.detail}
                        </p>
                      ) : null}
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {formatInboxMessageTime(item.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Activity will appear here as messages and notes are added.
              </p>
            )}
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tags
              </p>
            </div>
            <p className="text-xs text-muted-foreground">No tags yet.</p>
            <input
              type="text"
              disabled
              placeholder="Add tags (coming soon)"
              className="w-full cursor-not-allowed rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground"
            />
          </section>

          {feedback ? <p className="text-xs text-green-700">{feedback}</p> : null}
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
        </div>
      </aside>
    </>
  );
});
