"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowRightLeft,
  Bell,
  StickyNote,
  Tag,
  UserRound,
  UserRoundPlus,
} from "lucide-react";

import {
  addOmnichannelConversationNote,
  assignOmnichannelConversation,
  convertOmnichannelConversationToLead,
  createInboxFollowUpTask,
  updateOmnichannelConversationStatus,
} from "@/app/(dashboard)/inbox/omnichannel-actions";
import {
  addWhatsappConversationNoteAction,
  assignWhatsappConversationAction,
  convertWhatsappConversationToLead,
  createWhatsappInboxFollowUpTask,
  updateWhatsappConversationStatusAction,
} from "@/app/(dashboard)/inbox/whatsapp-actions";
import {
  addWorkspaceConversationLabel,
  removeWorkspaceConversationLabel,
} from "@/app/(dashboard)/inbox/workspace-label-actions";
import { OmnichannelStatusBadge } from "@/components/omnichannel-inbox/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { getConversationDisplayName } from "@/components/omnichannel-inbox/inbox-display";
import {
  OMNICHANNEL_CONVERSATION_STATUSES,
  formatOmnichannelConversationStatusLabel,
} from "@/lib/omnichannel-inbox/constants";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import { cn } from "@/lib/utils";

type OrgProfile = {
  id: string;
  full_name: string;
};

type WorkspaceOperationsPanelProps = {
  conversation: OmnichannelConversationDetail;
  orgProfiles: OrgProfile[];
  canReassign: boolean;
  canUpdateStatus: boolean;
  canAddNote: boolean;
  canConvert: boolean;
  canCreateFollowUp: boolean;
};

function LabelChip({
  tag,
  color,
  onRemove,
  disabled,
}: {
  tag: string;
  color: string;
  onRemove?: () => void;
  disabled?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
      style={{ backgroundColor: color }}
    >
      {tag}
      {onRemove ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          className="rounded-full px-0.5 opacity-80 hover:opacity-100 disabled:opacity-50"
          aria-label={`Remove ${tag}`}
        >
          ×
        </button>
      ) : null}
    </span>
  );
}

export function WorkspaceOperationsPanel({
  conversation,
  orgProfiles,
  canReassign,
  canUpdateStatus,
  canAddNote,
  canConvert,
  canCreateFollowUp,
}: WorkspaceOperationsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [noteText, setNoteText] = useState("");
  const [followUpTitle, setFollowUpTitle] = useState("");
  const [followUpDueDate, setFollowUpDueDate] = useState("");

  const isWhatsapp = conversation.channel === "whatsapp";
  const displayName = getConversationDisplayName(conversation);

  function runAction(action: () => Promise<{ success: boolean; message?: string; leadId?: string }>) {
    setFeedback(null);
    setError(null);

    startTransition(async () => {
      const result = await action();

      if (result.success) {
        setFeedback(result.message ?? "Saved.");
        if ("leadId" in result && result.leadId) {
          router.push(`/leads/${result.leadId}`);
          return;
        }
        router.refresh();
        return;
      }

      setError(result.message ?? "Action failed.");
    });
  }

  function buildFormData(fields: Record<string, string>) {
    const formData = new FormData();
    formData.set("conversation_id", conversation.id);
    for (const [key, value] of Object.entries(fields)) {
      formData.set(key, value);
    }
    return formData;
  }

  function handleAssign(formData: FormData) {
    runAction(async () =>
      isWhatsapp
        ? assignWhatsappConversationAction(formData)
        : assignOmnichannelConversation(formData),
    );
  }

  function handleStatusChange(status: string) {
    runAction(async () =>
      isWhatsapp
        ? updateWhatsappConversationStatusAction(
            buildFormData({ status }),
          )
        : updateOmnichannelConversationStatus(buildFormData({ status })),
    );
  }

  function handleAddNote() {
    const trimmed = noteText.trim();
    if (!trimmed) return;

    runAction(async () => {
      const result = isWhatsapp
        ? await addWhatsappConversationNoteAction(
            buildFormData({ note: trimmed }),
          )
        : await addOmnichannelConversationNote(buildFormData({ note: trimmed }));

      if (result.success) {
        setNoteText("");
      }

      return result;
    });
  }

  function handleAddLabel() {
    const trimmed = newLabel.trim();
    if (!trimmed) return;

    runAction(async () => {
      const result = await addWorkspaceConversationLabel(
        buildFormData({ tag: trimmed }),
      );

      if (result.success) {
        setNewLabel("");
      }

      return result;
    });
  }

  function handleRemoveLabel(tag: string) {
    runAction(async () =>
      removeWorkspaceConversationLabel(buildFormData({ tag })),
    );
  }

  function handleConvert() {
    runAction(async () =>
      isWhatsapp
        ? convertWhatsappConversationToLead(
            buildFormData({
              full_name: displayName,
              whatsapp_number: conversation.externalUserId ?? "",
            }),
          )
        : convertOmnichannelConversationToLead(buildFormData({})),
    );
  }

  function handleFollowUp() {
    if (!conversation.leadId) return;

    runAction(async () => {
      const formData = buildFormData({
        lead_id: conversation.leadId ?? "",
        title: followUpTitle.trim(),
        due_date: followUpDueDate,
        due_time: "09:00",
        priority: "medium",
      });

      const result = isWhatsapp
        ? await createWhatsappInboxFollowUpTask(formData)
        : await createInboxFollowUpTask(formData);

      if (result.success) {
        setFollowUpTitle("");
        setFollowUpDueDate("");
      }

      return result;
    });
  }

  return (
    <div className="space-y-4">
      {feedback ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {feedback}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      ) : null}

      <section className="space-y-2 rounded-xl border bg-muted/15 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Status
          </p>
          <OmnichannelStatusBadge status={conversation.status} />
        </div>
        {canUpdateStatus ? (
          <select
            value={conversation.status}
            disabled={isPending}
            onChange={(event) => handleStatusChange(event.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            {OMNICHANNEL_CONVERSATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {formatOmnichannelConversationStatusLabel(status)}
              </option>
            ))}
          </select>
        ) : null}
      </section>

      <section className="space-y-2 rounded-xl border bg-muted/15 p-3">
        <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <UserRound className="h-3.5 w-3.5" />
          Assigned to
        </p>
        <p className="text-sm font-medium text-foreground">
          {conversation.assignedUserName ?? "Unassigned"}
        </p>
        {canReassign ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleAssign(new FormData(event.currentTarget));
            }}
            className="space-y-2"
          >
            <select
              name="assigned_user_id"
              defaultValue={conversation.assignedUserId ?? ""}
              disabled={isPending}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
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
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-full",
              )}
            >
              Update assignment
            </button>
          </form>
        ) : null}
        {conversation.assignmentHistory.length > 0 ? (
          <div className="space-y-1.5 border-t pt-2">
            <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              <ArrowRightLeft className="h-3 w-3" />
              Assignment history
            </p>
            {conversation.assignmentHistory.slice(0, 4).map((entry) => (
              <p key={entry.id} className="text-[11px] text-muted-foreground">
                {entry.assignedFromName ?? "Unassigned"} →{" "}
                {entry.assignedToName ?? "Unassigned"}
                <span className="ml-1 opacity-70">· {entry.assignedByName}</span>
              </p>
            ))}
          </div>
        ) : null}
      </section>

      <section className="space-y-2 rounded-xl border bg-muted/15 p-3">
        <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <Tag className="h-3.5 w-3.5" />
          Labels
        </p>
        <div className="flex flex-wrap gap-1.5">
          {conversation.labels.length === 0 ? (
            <p className="text-xs text-muted-foreground">No labels yet.</p>
          ) : (
            conversation.labels.map((label) => (
              <LabelChip
                key={label.tag}
                tag={label.tag}
                color={label.color}
                disabled={isPending}
                onRemove={() => handleRemoveLabel(label.tag)}
              />
            ))
          )}
        </div>
        <div className="flex gap-2">
          <input
            value={newLabel}
            onChange={(event) => setNewLabel(event.target.value)}
            placeholder="Add label…"
            disabled={isPending}
            className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleAddLabel();
              }
            }}
          />
          <button
            type="button"
            disabled={isPending || !newLabel.trim()}
            onClick={handleAddLabel}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Add
          </button>
        </div>
      </section>

      {canAddNote ? (
        <section className="space-y-2 rounded-xl border bg-muted/15 p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <StickyNote className="h-3.5 w-3.5" />
            Internal notes
          </p>
          <textarea
            value={noteText}
            onChange={(event) => setNoteText(event.target.value)}
            rows={3}
            placeholder="Private note — visible to team only…"
            disabled={isPending}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={isPending || !noteText.trim()}
            onClick={handleAddNote}
            className={cn(buttonVariants({ size: "sm" }), "w-full")}
          >
            Save note
          </button>
          {conversation.notes.length > 0 ? (
            <div className="max-h-32 space-y-2 overflow-y-auto border-t pt-2">
              {conversation.notes.slice(0, 5).map((note) => (
                <div key={note.id} className="rounded-lg bg-background px-2.5 py-2">
                  <p className="text-xs leading-relaxed text-foreground">{note.note}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {note.authorName ?? "Team"} ·{" "}
                    {new Date(note.created_at).toLocaleString("id-ID")}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {canCreateFollowUp ? (
        <section className="space-y-2 rounded-xl border bg-muted/15 p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <Bell className="h-3.5 w-3.5" />
            Follow-up reminder
          </p>
          {conversation.leadId ? (
            <>
              <input
                value={followUpTitle}
                onChange={(event) => setFollowUpTitle(event.target.value)}
                placeholder="Reminder title…"
                disabled={isPending}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={followUpDueDate}
                onChange={(event) => setFollowUpDueDate(event.target.value)}
                disabled={isPending}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={
                  isPending || !followUpTitle.trim() || !followUpDueDate
                }
                onClick={handleFollowUp}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
              >
                Schedule follow-up
              </button>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Convert to lead first to schedule follow-ups in Today Workspace.
            </p>
          )}
        </section>
      ) : null}

      {canConvert && !conversation.leadId ? (
        <section className="rounded-xl border border-dashed bg-muted/10 p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <UserRoundPlus className="h-3.5 w-3.5" />
            Convert to lead
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Transfer name, phone, source, conversation, labels, and notes in one click.
          </p>
          <button
            type="button"
            disabled={isPending}
            onClick={handleConvert}
            className={cn(buttonVariants({ size: "sm" }), "mt-3 w-full")}
          >
            Convert to lead
          </button>
        </section>
      ) : null}
    </div>
  );
}
