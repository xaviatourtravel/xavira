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
import { InspectorSectionLabel } from "@/components/customer-passport/inspector/primitives";
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

type WorkspaceOperationsContext = {
  conversation: OmnichannelConversationDetail;
  orgProfiles: OrgProfile[];
  canReassign: boolean;
  canUpdateStatus: boolean;
  canAddNote: boolean;
  canConvert: boolean;
  canCreateFollowUp: boolean;
  variant?: "default" | "inspector";
};

export function useWorkspaceOperations({
  conversation,
  canConvert,
}: Pick<WorkspaceOperationsContext, "conversation" | "canConvert">) {
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

  function runAction(
    action: () => Promise<{ success: boolean; message?: string; leadId?: string }>,
  ) {
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

  return {
    isPending,
    feedback,
    error,
    newLabel,
    setNewLabel,
    noteText,
    setNoteText,
    followUpTitle,
    setFollowUpTitle,
    followUpDueDate,
    setFollowUpDueDate,
    isWhatsapp,
    displayName,
    runAction,
    buildFormData,
    handleAssign: (formData: FormData) =>
      runAction(async () =>
        isWhatsapp
          ? assignWhatsappConversationAction(formData)
          : assignOmnichannelConversation(formData),
      ),
    handleStatusChange: (status: string) =>
      runAction(async () =>
        isWhatsapp
          ? updateWhatsappConversationStatusAction(buildFormData({ status }))
          : updateOmnichannelConversationStatus(buildFormData({ status })),
      ),
    handleAddNote: () => {
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
    },
    handleAddLabel: () => {
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
    },
    handleRemoveLabel: (tag: string) =>
      runAction(async () => removeWorkspaceConversationLabel(buildFormData({ tag }))),
    handleConvert: () =>
      runAction(async () =>
        isWhatsapp
          ? convertWhatsappConversationToLead(
              buildFormData({
                full_name: displayName,
                whatsapp_number: conversation.externalUserId ?? "",
              }),
            )
          : convertOmnichannelConversationToLead(buildFormData({})),
      ),
    handleFollowUp: () => {
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
    },
    canConvert,
  };
}

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

export function FeedbackMessages({
  feedback,
  error,
  compact,
}: {
  feedback: string | null;
  error: string | null;
  compact?: boolean;
}) {
  if (!feedback && !error) {
    return null;
  }

  return (
    <>
      {feedback ? (
        <p
          className={cn(
            "text-xs text-emerald-700",
            !compact && "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2",
          )}
        >
          {feedback}
        </p>
      ) : null}
      {error ? (
        <p
          className={cn(
            "text-xs text-red-600",
            !compact && "rounded-lg border border-red-200 bg-red-50 px-3 py-2",
          )}
        >
          {error}
        </p>
      ) : null}
    </>
  );
}

function sectionClass(compact?: boolean) {
  return compact ? "space-y-2" : "space-y-2 rounded-xl border bg-muted/15 p-3";
}

function fieldClass(compact?: boolean) {
  return compact
    ? "w-full rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
    : "w-full rounded-lg border bg-background px-3 py-2 text-sm";
}

type WorkspaceOperationsPanelProps = WorkspaceOperationsContext & {
  hideStatus?: boolean;
};

export function WorkspaceAssignmentSection({
  conversation,
  orgProfiles,
  canReassign,
  variant = "default",
  ops,
}: WorkspaceOperationsContext & {
  ops: ReturnType<typeof useWorkspaceOperations>;
}) {
  const compact = variant === "inspector";

  return (
    <section className={sectionClass(compact)}>
      {compact ? (
        <InspectorSectionLabel>Assigned To</InspectorSectionLabel>
      ) : (
        <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <UserRound className="h-3.5 w-3.5" />
          Ditugaskan ke
        </p>
      )}
      {!compact ? (
        <p className="text-sm font-medium text-foreground">
          {conversation.assignedUserName ?? "Belum ditugaskan"}
        </p>
      ) : null}
      {canReassign ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            ops.handleAssign(new FormData(event.currentTarget));
          }}
          className="space-y-2"
        >
          <select
            name="assigned_user_id"
            defaultValue={conversation.assignedUserId ?? ""}
            disabled={ops.isPending}
            className={fieldClass(compact)}
          >
            <option value="">Belum ditugaskan</option>
            {orgProfiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.full_name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={ops.isPending}
            className={cn(
              buttonVariants({ variant: compact ? "ghost" : "outline", size: "sm" }),
              compact ? "h-7 px-0 text-xs text-muted-foreground" : "w-full",
            )}
          >
            Perbarui penugasan
          </button>
        </form>
      ) : (
        <p className="text-xs text-muted-foreground">
          {conversation.assignedUserName ?? "Belum ditugaskan"}
        </p>
      )}
      {!compact && conversation.assignmentHistory.length > 0 ? (
        <div className="space-y-1.5 border-t pt-2">
          <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <ArrowRightLeft className="h-3 w-3" />
            Riwayat penugasan
          </p>
          {conversation.assignmentHistory.slice(0, 4).map((entry) => (
            <p key={entry.id} className="text-[11px] text-muted-foreground">
              {entry.assignedFromName ?? "Belum ditugaskan"} →{" "}
              {entry.assignedToName ?? "Belum ditugaskan"}
              <span className="ml-1 opacity-70">· {entry.assignedByName}</span>
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function WorkspaceLabelsSection({
  conversation,
  variant = "default",
  ops,
}: Pick<WorkspaceOperationsContext, "conversation" | "variant"> & {
  ops: ReturnType<typeof useWorkspaceOperations>;
}) {
  const compact = variant === "inspector";

  return (
    <section className={sectionClass(compact)}>
      <p
        className={cn(
          "flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground",
        )}
      >
        <Tag className="h-3 w-3" />
        Label
      </p>
      <div className="flex flex-wrap gap-1.5">
        {conversation.labels.length === 0 ? (
          <p className="text-xs text-muted-foreground">Belum ada label</p>
        ) : (
          conversation.labels.map((label) => (
            <LabelChip
              key={label.tag}
              tag={label.tag}
              color={label.color}
              disabled={ops.isPending}
              onRemove={() => ops.handleRemoveLabel(label.tag)}
            />
          ))
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={ops.newLabel}
          onChange={(event) => ops.setNewLabel(event.target.value)}
          placeholder="Tambah label…"
          disabled={ops.isPending}
          className={cn(fieldClass(compact), "min-w-0 flex-1")}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              ops.handleAddLabel();
            }
          }}
        />
        <button
          type="button"
          disabled={ops.isPending || !ops.newLabel.trim()}
          onClick={ops.handleAddLabel}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            compact && "h-7 px-2.5 text-xs",
          )}
        >
          Tambah
        </button>
      </div>
    </section>
  );
}

export function WorkspaceNotesSection({
  conversation,
  canAddNote,
  variant = "default",
  ops,
}: Pick<WorkspaceOperationsContext, "conversation" | "canAddNote" | "variant"> & {
  ops: ReturnType<typeof useWorkspaceOperations>;
}) {
  if (!canAddNote) {
    return null;
  }

  const compact = variant === "inspector";

  return (
    <section className={sectionClass(compact)}>
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <StickyNote className="h-3 w-3" />
        {compact ? "Internal Note" : "Catatan internal"}
      </p>
      <textarea
        value={ops.noteText}
        onChange={(event) => ops.setNoteText(event.target.value)}
        rows={3}
        placeholder="Catatan privat, hanya tim yang bisa melihat…"
        disabled={ops.isPending}
        className={fieldClass(compact)}
      />
      <button
        type="button"
        disabled={ops.isPending || !ops.noteText.trim()}
        onClick={ops.handleAddNote}
        className={cn(
          buttonVariants({ size: "sm" }),
          compact ? "h-7 w-fit px-3 text-xs" : "w-full",
        )}
      >
        Simpan catatan
      </button>
      {conversation.notes.length > 0 ? (
        <div
          className={cn(
            "max-h-32 space-y-2 overflow-y-auto",
            !compact && "border-t pt-2",
          )}
        >
          {conversation.notes.slice(0, 5).map((note) => (
            <div
              key={note.id}
              className={cn(
                compact ? "text-xs" : "rounded-lg bg-background px-2.5 py-2",
              )}
            >
              <p className="leading-relaxed text-foreground">{note.note}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {note.authorName ?? "Tim"} ·{" "}
                {new Date(note.created_at).toLocaleString("id-ID")}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function WorkspaceReminderSection({
  conversation,
  canCreateFollowUp,
  variant = "default",
  ops,
}: Pick<
  WorkspaceOperationsContext,
  "conversation" | "canCreateFollowUp" | "variant"
> & {
  ops: ReturnType<typeof useWorkspaceOperations>;
}) {
  if (!canCreateFollowUp) {
    return null;
  }

  const compact = variant === "inspector";

  return (
    <section className={sectionClass(compact)}>
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <Bell className="h-3 w-3" />
        {compact ? "Reminder" : "Pengingat tindak lanjut"}
      </p>
      {conversation.leadId ? (
        <>
          <input
            value={ops.followUpTitle}
            onChange={(event) => ops.setFollowUpTitle(event.target.value)}
            placeholder="Judul pengingat…"
            disabled={ops.isPending}
            className={fieldClass(compact)}
          />
          <input
            type="date"
            value={ops.followUpDueDate}
            onChange={(event) => ops.setFollowUpDueDate(event.target.value)}
            disabled={ops.isPending}
            className={fieldClass(compact)}
          />
          <button
            type="button"
            disabled={
              ops.isPending || !ops.followUpTitle.trim() || !ops.followUpDueDate
            }
            onClick={ops.handleFollowUp}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              compact ? "h-7 w-fit px-3 text-xs" : "w-full",
            )}
          >
            Jadwalkan tindak lanjut
          </button>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          Konversi jadi lead dulu untuk menjadwalkan tindak lanjut di Workspace
          Hari Ini.
        </p>
      )}
    </section>
  );
}

export function WorkspaceConvertSection({
  conversation,
  variant = "default",
  ops,
}: Pick<WorkspaceOperationsContext, "conversation" | "variant"> & {
  ops: ReturnType<typeof useWorkspaceOperations>;
}) {
  if (!ops.canConvert || conversation.leadId) {
    return null;
  }

  const compact = variant === "inspector";

  return (
    <section
      className={
        compact
          ? "space-y-2"
          : "rounded-xl border border-dashed bg-muted/10 p-3"
      }
    >
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <UserRoundPlus className="h-3.5 w-3.5" />
        Konversi jadi lead
      </p>
      {!compact ? (
        <p className="text-xs text-muted-foreground">
          Pindahkan nama, telepon, sumber, percakapan, label, dan catatan dalam
          satu klik.
        </p>
      ) : null}
      <button
        type="button"
        disabled={ops.isPending}
        onClick={ops.handleConvert}
        className={cn(
          buttonVariants({ size: "sm" }),
          compact ? "h-7 w-fit px-3 text-xs" : "mt-3 w-full",
        )}
      >
        Konversi jadi lead
      </button>
    </section>
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
  variant = "default",
  hideStatus = false,
}: WorkspaceOperationsPanelProps) {
  const ops = useWorkspaceOperations({ conversation, canConvert });
  const compact = variant === "inspector";

  return (
    <div className={compact ? "space-y-6" : "space-y-4"}>
      <FeedbackMessages
        feedback={ops.feedback}
        error={ops.error}
        compact={compact}
      />

      {!hideStatus ? (
        <section className={sectionClass(compact)}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Status
            </p>
            <OmnichannelStatusBadge status={conversation.status} />
          </div>
          {canUpdateStatus ? (
            <select
              value={conversation.status}
              disabled={ops.isPending}
              onChange={(event) => ops.handleStatusChange(event.target.value)}
              className={fieldClass(compact)}
            >
              {OMNICHANNEL_CONVERSATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatOmnichannelConversationStatusLabel(status)}
                </option>
              ))}
            </select>
          ) : null}
        </section>
      ) : null}

      <WorkspaceAssignmentSection
        conversation={conversation}
        orgProfiles={orgProfiles}
        canReassign={canReassign}
        canUpdateStatus={canUpdateStatus}
        canAddNote={canAddNote}
        canConvert={canConvert}
        canCreateFollowUp={canCreateFollowUp}
        variant={variant}
        ops={ops}
      />

      <WorkspaceLabelsSection
        conversation={conversation}
        variant={variant}
        ops={ops}
      />

      <WorkspaceNotesSection
        conversation={conversation}
        canAddNote={canAddNote}
        variant={variant}
        ops={ops}
      />

      <WorkspaceReminderSection
        conversation={conversation}
        canCreateFollowUp={canCreateFollowUp}
        variant={variant}
        ops={ops}
      />

      <WorkspaceConvertSection
        conversation={conversation}
        variant={variant}
        ops={ops}
      />
    </div>
  );
}
