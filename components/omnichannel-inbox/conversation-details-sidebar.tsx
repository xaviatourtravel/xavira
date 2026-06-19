"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { PanelRightClose, StickyNote, Tag, X } from "lucide-react";

import { OmnichannelChannelBadge } from "@/components/omnichannel-inbox/channel-badge";
import {
  formatInboxMessageTime,
  formatInboxRelativeTime,
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

type ConversationDetailsSidebarProps = {
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

export const ConversationDetailsSidebar = forwardRef<
  ConversationDetailsSidebarHandle,
  ConversationDetailsSidebarProps
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

  useImperativeHandle(ref, () => ({
    focusNoteTextarea() {
      noteTextareaRef.current?.focus();
      noteTextareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
  }));

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-l bg-background shadow-xl lg:shadow-none">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <PanelRightClose className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Details</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "h-8 w-8 rounded-full p-0",
          )}
          aria-label="Close details"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <section className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Customer
          </p>
          <p className="text-sm font-semibold text-foreground">{displayName}</p>
          {conversation.customerUsername ? (
            <p className="text-xs text-muted-foreground">
              @{conversation.customerUsername.replace(/^@/, "")}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <OmnichannelChannelBadge channel={conversation.channel} />
            <OmnichannelStatusBadge status={conversation.status} />
          </div>
          <p className="text-xs text-muted-foreground">
            Last active {formatInboxRelativeTime(conversation.lastMessageAt)}
          </p>
        </section>

        {canReassign ? (
          <section className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Assigned user
            </p>
            <p className="text-xs text-muted-foreground">
              Currently: {formatAssignedUserLabel(conversation.assignedUserName)}
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
              Assigned user
            </p>
            <p className="text-sm text-foreground">
              {formatAssignedUserLabel(conversation.assignedUserName)}
            </p>
          </section>
        )}

        {canUpdateStatus ? (
          <section className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Pipeline status
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
              Pipeline status
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
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {conversation.notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-lg border border-amber-100 bg-amber-50/70 p-2.5"
                >
                  <p className="whitespace-pre-wrap text-sm text-foreground">{note.note}</p>
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
  );
});
