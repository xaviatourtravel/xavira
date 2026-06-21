"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  StickyNote,
  Tag,
  UserRound,
} from "lucide-react";

import {
  addOmnichannelConversationNote,
  assignOmnichannelConversation,
  convertOmnichannelConversationToLead,
  createInboxFollowUpTask,
  updateOmnichannelConversationStatus,
} from "@/app/(dashboard)/inbox/omnichannel-actions";
import { FollowUpAssistantPanel } from "@/components/ai/follow-up-assistant-panel";
import { InboxLeadExtractionCard } from "@/components/omnichannel-inbox/inbox-lead-extraction-card";
import { OmnichannelChannelBadge } from "@/components/omnichannel-inbox/channel-badge";
import { OmnichannelStatusBadge } from "@/components/omnichannel-inbox/status-badge";
import {
  formatInboxMessageTime,
  formatInboxRelativeTime,
  buildInboxConvertNotesDefault,
  getConversationDisplayName,
} from "@/components/omnichannel-inbox/inbox-display";
import { buttonVariants } from "@/components/ui/button";
import {
  OMNICHANNEL_CONVERSATION_STATUSES,
  formatOmnichannelConversationStatusLabel,
} from "@/lib/omnichannel-inbox/constants";
import {
  formatInboxLeadTimelineTime,
} from "@/lib/omnichannel-inbox/lead-context";
import {
  INBOX_FOLLOW_UP_PRIORITIES,
  buildInboxFollowUpDefaultNotes,
  buildInboxFollowUpDefaultTitle,
  getDefaultInboxFollowUpDueTime,
  getTomorrowDateValue,
} from "@/lib/omnichannel-inbox/inbox-follow-up";
import type { ConvertLeadFormPrefill } from "@/lib/omnichannel-inbox/ai-lead-extraction";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import { formatAssignedUserLabel } from "@/lib/leads/assignment";
import { cn } from "@/lib/utils";

type OrgProfile = {
  id: string;
  full_name: string;
};

type InboxLeadPanelProps = {
  conversation: OmnichannelConversationDetail | null;
  orgProfiles: OrgProfile[];
  canConvert: boolean;
  canCreateFollowUp: boolean;
  canReassign: boolean;
  canUpdateStatus: boolean;
  canAddNote: boolean;
};

type TimelineItem = {
  id: string;
  label: string;
  detail?: string;
  timestamp: string;
};

function SectionLabel({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

function buildConversationTimeline(
  conversation: OmnichannelConversationDetail,
): TimelineItem[] {
  const items: TimelineItem[] = [
    {
      id: `created-${conversation.id}`,
      label: "Conversation created",
      detail: conversation.channelLabel,
      timestamp: conversation.createdAt,
    },
  ];

  for (const message of conversation.messages) {
    items.push({
      id: `message-${message.id}`,
      label:
        message.direction === "incoming"
          ? "Customer sent a message"
          : "Team sent a reply",
      detail: message.message_text?.trim() || undefined,
      timestamp: message.created_at,
    });
  }

  for (const note of conversation.notes) {
    items.push({
      id: `note-${note.id}`,
      label: `Note added${note.authorName ? ` by ${note.authorName}` : ""}`,
      detail: note.note.trim(),
      timestamp: note.created_at,
    });
  }

  return items
    .sort(
      (left, right) =>
        new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
    )
    .slice(0, 16);
}

function LeadPanelEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <UserRound className="h-8 w-8 text-muted-foreground/40" />
      <p className="mt-4 text-sm font-semibold text-foreground">Customer details</p>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
        Select a conversation to view CRM context and convert to a lead.
      </p>
    </div>
  );
}

export function InboxLeadPanel({
  conversation,
  orgProfiles,
  canConvert,
  canCreateFollowUp,
  canReassign,
  canUpdateStatus,
  canAddNote,
}: InboxLeadPanelProps) {
  const router = useRouter();
  const [showConvertForm, setShowConvertForm] = useState(false);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [convertFormPrefill, setConvertFormPrefill] =
    useState<ConvertLeadFormPrefill | null>(null);
  const [convertFormKey, setConvertFormKey] = useState(0);
  const [activityOpen, setActivityOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const conversationTimeline = useMemo(
    () => (conversation ? buildConversationTimeline(conversation) : []),
    [conversation],
  );

  if (!conversation) {
    return <LeadPanelEmptyState />;
  }

  const displayName = getConversationDisplayName(conversation);
  const leadContext = conversation.leadContext;
  const isConverted = Boolean(conversation.leadId);
  const leadId = conversation.leadId;
  const conversationId = conversation.id;
  const timeline = isConverted && leadContext ? leadContext.timeline : conversationTimeline;
  const tags =
    isConverted && leadContext && leadContext.tags.length > 0
      ? leadContext.tags
      : conversation.tags;

  function runAction(action: () => Promise<{ success: boolean; message?: string }>) {
    setFeedback(null);
    setError(null);

    startTransition(async () => {
      const result = await action();
      if (result.success) {
        setFeedback(result.message ?? "Saved.");
        router.refresh();
        return;
      }

      setError(result.message ?? "Unable to save changes.");
    });
  }

  function handleAssign(formData: FormData) {
    formData.set("conversation_id", conversationId);
    runAction(() => assignOmnichannelConversation(formData));
  }

  function handleStatusChange(status: string) {
    const formData = new FormData();
    formData.set("conversation_id", conversationId);
    formData.set("status", status);
    runAction(() => updateOmnichannelConversationStatus(formData));
  }

  function handleAddNote(formData: FormData) {
    formData.set("conversation_id", conversationId);
    runAction(async () => {
      const result = await addOmnichannelConversationNote(formData);
      return result;
    });
  }

  function handleConvert(formData: FormData) {
    setFeedback(null);
    setError(null);

    startTransition(async () => {
      const result = await convertOmnichannelConversationToLead(formData);

      if (!result.success) {
        setError(result.message ?? "Unable to convert conversation.");
        return;
      }

      setFeedback(result.message ?? "Lead created.");
      setShowConvertForm(false);
      router.refresh();
    });
  }

  function handleCreateFollowUp(formData: FormData) {
    setFeedback(null);
    setError(null);

    startTransition(async () => {
      const result = await createInboxFollowUpTask(formData);

      if (!result.success) {
        setError(result.message ?? "Unable to create follow up.");
        return;
      }

      setFeedback(result.message ?? "Follow up scheduled.");
      setShowFollowUpForm(false);
      router.refresh();
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
        <section className="space-y-1.5">
          <SectionLabel icon={<UserRound className="h-3.5 w-3.5 text-muted-foreground" />}>
            Customer
          </SectionLabel>
          <p className="text-sm font-semibold text-foreground">{displayName}</p>
          {conversation.customerUsername ? (
            <p className="text-[11px] text-muted-foreground">
              @{conversation.customerUsername.replace(/^@/, "")}
            </p>
          ) : null}
          {isConverted && leadId ? (
            <p className="text-[11px] font-medium text-emerald-700">Lead linked</p>
          ) : null}
        </section>

        <section className="space-y-1.5">
          <SectionLabel>Source</SectionLabel>
          <div className="flex flex-wrap items-center gap-1.5">
            <OmnichannelChannelBadge channel={conversation.channel} />
            <span className="text-[11px] text-muted-foreground">
              {conversation.channelLabel}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            First seen {formatInboxMessageTime(conversation.createdAt)}
          </p>
        </section>

        <section className="space-y-2 rounded-xl border bg-muted/15 p-3">
          <SectionLabel>Lead status</SectionLabel>
          {isConverted ? (
            leadContext ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                    {leadContext.statusLabel}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Score {leadContext.healthScore} · {leadContext.healthBadge}
                  </span>
                </div>
                <LinkedLeadDetails
                  leadContext={leadContext}
                  leadId={leadId!}
                  canCreateFollowUp={canCreateFollowUp}
                  showFollowUpForm={showFollowUpForm}
                  onOpenFollowUpForm={() => setShowFollowUpForm(true)}
                />
              </>
            ) : (
              <>
                <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                  Linked
                </span>
                {leadId ? (
                  <div className="grid gap-2 pt-1">
                    <Link
                      href={`/leads/${leadId}`}
                      className={cn(buttonVariants({ size: "sm" }), "w-full")}
                    >
                      View lead
                    </Link>
                  </div>
                ) : null}
              </>
            )
          ) : (
            <>
              <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900">
                Not converted
              </span>
              <p className="text-xs leading-relaxed text-muted-foreground">
                This conversation is not linked to a CRM lead yet.
              </p>
              {canConvert && !showConvertForm ? (
                <button
                  type="button"
                  onClick={() => setShowConvertForm(true)}
                  className={cn(buttonVariants({ size: "sm" }), "w-full")}
                >
                  Convert to lead
                </button>
              ) : null}
              {!canConvert ? (
                <p className="text-[11px] text-muted-foreground">
                  You don&apos;t have permission to convert this conversation.
                </p>
              ) : null}
            </>
          )}
        </section>

        {!isConverted && canConvert ? (
          <InboxLeadExtractionCard
            conversationId={conversationId}
            customerName={displayName}
            disabled={isPending}
            onApply={(prefill) => {
              setConvertFormPrefill(prefill);
              setConvertFormKey((key) => key + 1);
              setShowConvertForm(true);
            }}
          />
        ) : null}

        {!isConverted && showConvertForm && canConvert ? (
          <section className="space-y-2.5 rounded-xl border p-3">
            <p className="text-xs font-semibold text-foreground">Convert to lead</p>
            <ConvertLeadForm
              key={convertFormKey}
              conversation={conversation}
              displayName={displayName}
              orgProfiles={orgProfiles}
              initialValues={convertFormPrefill}
              isPending={isPending}
              onSubmit={handleConvert}
              onCancel={() => {
                setShowConvertForm(false);
                setConvertFormPrefill(null);
              }}
            />
          </section>
        ) : null}

        {isConverted && showFollowUpForm && canCreateFollowUp && leadId ? (
          <section className="space-y-2.5 rounded-xl border p-3">
            <p className="text-xs font-semibold text-foreground">Create follow up</p>
            <CreateFollowUpForm
              conversation={conversation}
              displayName={displayName}
              leadId={leadId}
              orgProfiles={orgProfiles}
              isPending={isPending}
              onSubmit={handleCreateFollowUp}
              onCancel={() => setShowFollowUpForm(false)}
            />
          </section>
        ) : null}

        <section className="space-y-1.5">
          <SectionLabel>Conversation status</SectionLabel>
          {canUpdateStatus ? (
            <select
              value={conversation.status}
              onChange={(event) => handleStatusChange(event.target.value)}
              className="w-full rounded-lg border bg-background px-2.5 py-1.5 text-xs"
              disabled={isPending}
            >
              {OMNICHANNEL_CONVERSATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatOmnichannelConversationStatusLabel(status)}
                </option>
              ))}
            </select>
          ) : (
            <OmnichannelStatusBadge status={conversation.status} />
          )}
        </section>

        <section className="space-y-2">
          <SectionLabel>Assigned to</SectionLabel>
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
          ) : (
            <p className="text-sm text-foreground">
              {formatAssignedUserLabel(conversation.assignedUserName)}
            </p>
          )}
        </section>

        <section className="space-y-1.5">
          <SectionLabel icon={<Tag className="h-3.5 w-3.5 text-muted-foreground" />}>
            Tags
          </SectionLabel>
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No tags yet.</p>
          )}
        </section>

        <section className="space-y-1.5">
          <SectionLabel icon={<StickyNote className="h-3.5 w-3.5 text-amber-600" />}>
            Notes
          </SectionLabel>
          {conversation.notes.length > 0 ? (
            <div className="max-h-28 space-y-2 overflow-y-auto">
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
          ) : (
            <p className="text-xs text-muted-foreground">No internal notes yet.</p>
          )}
          {canAddNote ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleAddNote(new FormData(event.currentTarget));
                event.currentTarget.reset();
              }}
              className="space-y-2"
            >
              <textarea
                name="note"
                rows={2}
                placeholder="Add a private note…"
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

        <section className="rounded-xl border border-border/60">
          <button
            type="button"
            onClick={() => setActivityOpen((open) => !open)}
            className="flex w-full items-center justify-between px-3 py-2.5 text-left"
            aria-expanded={activityOpen}
          >
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Activity history
            </span>
            <span className="flex items-center gap-2">
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                {timeline.length}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  activityOpen && "rotate-180",
                )}
              />
            </span>
          </button>

          {activityOpen ? (
            <div className="space-y-3 border-t px-3 py-3">
              {timeline.length > 0 ? (
                timeline.map((item, index) => {
                  const isLast = index === timeline.length - 1;

                  return (
                    <div key={item.id} className="relative flex gap-2.5 pb-1">
                      {!isLast ? (
                        <span className="absolute left-[5px] top-5 h-[calc(100%-4px)] w-px bg-border" />
                      ) : null}
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary/70 ring-4 ring-background" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground">{item.label}</p>
                        {item.detail ? (
                          <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                            {item.detail}
                          </p>
                        ) : null}
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {formatInboxLeadTimelineTime(item.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-[11px] text-muted-foreground">No activity yet.</p>
              )}
            </div>
          ) : null}
        </section>

        {isConverted && leadContext ? (
          <section className="space-y-2">
            {leadContext.nextFollowUp ? (
              <div className="rounded-xl border bg-muted/15 p-3">
                <SectionLabel>Next follow up</SectionLabel>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {leadContext.nextFollowUp.title}
                </p>
                <div className="mt-2 space-y-1.5">
                  <LinkedLeadDetailRow
                    label="Due"
                    value={leadContext.nextFollowUp.dueDateLabel}
                  />
                  <LinkedLeadDetailRow
                    label="Assigned to"
                    value={formatAssignedUserLabel(
                      leadContext.nextFollowUp.assignedToName,
                    )}
                  />
                  <LinkedLeadDetailRow
                    label="Priority"
                    value={leadContext.nextFollowUp.priorityLabel}
                  />
                </div>
                <Link
                  href="/follow-ups/queue"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "mt-3 inline-flex w-full items-center justify-center gap-1",
                  )}
                >
                  Open follow up queue
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="rounded-lg bg-muted/25 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Next follow up
                </p>
                <p className="mt-1 text-sm font-semibold">—</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Nothing scheduled
                </p>
              </div>
            )}
            <div className="rounded-lg bg-muted/25 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Last follow up
              </p>
              <p className="mt-1 text-sm font-semibold">
                {leadContext.lastFollowUpAt
                  ? formatInboxRelativeTime(leadContext.lastFollowUpAt)
                  : "—"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {leadContext.lastFollowUpLabel ?? "None completed"}
              </p>
            </div>
          </section>
        ) : null}

        {isConverted && leadContext && conversation ? (
          <section className="rounded-xl border p-3">
            <SectionLabel>AI Follow-Up Assistant</SectionLabel>
            <div className="mt-2">
              <FollowUpAssistantPanel
                mode="inbox"
                conversationId={conversation.id}
                leadId={leadContext.leadId}
                generateLabel="Generate Follow-Up"
                regenerateLabel="Regenerate"
              />
            </div>
          </section>
        ) : null}

        {feedback ? <p className="text-xs text-emerald-700">{feedback}</p> : null}
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}

function formatInboxBudget(value: number | null) {
  if (value == null) {
    return "—";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatInboxTravelDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function LinkedLeadDetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[58%] text-right font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

function LinkedLeadDetails({
  leadContext,
  leadId,
  canCreateFollowUp,
  showFollowUpForm,
  onOpenFollowUpForm,
}: {
  leadContext: NonNullable<OmnichannelConversationDetail["leadContext"]>;
  leadId: string;
  canCreateFollowUp: boolean;
  showFollowUpForm: boolean;
  onOpenFollowUpForm: () => void;
}) {
  return (
    <div className="space-y-3 pt-1">
      <div className="space-y-2 rounded-lg border bg-background/80 p-2.5">
        <LinkedLeadDetailRow
          label="Assigned to"
          value={formatAssignedUserLabel(leadContext.assignedToName)}
        />
        <LinkedLeadDetailRow label="Source" value={leadContext.sourceLabel} />
        <LinkedLeadDetailRow
          label="Destination"
          value={leadContext.packageInterest ?? "—"}
        />
        <LinkedLeadDetailRow
          label="Travel date"
          value={formatInboxTravelDate(leadContext.travelDatePreference)}
        />
        <LinkedLeadDetailRow
          label="Pax"
          value={leadContext.partySize != null ? String(leadContext.partySize) : "—"}
        />
        <LinkedLeadDetailRow
          label="Budget"
          value={formatInboxBudget(leadContext.budgetIdr)}
        />
      </div>
      <div className="grid gap-2">
        <Link
          href={`/leads/${leadId}`}
          className={cn(
            buttonVariants({ size: "sm" }),
            "inline-flex w-full items-center justify-center gap-1",
          )}
        >
          View lead
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
        {canCreateFollowUp && !showFollowUpForm ? (
          <button
            type="button"
            onClick={onOpenFollowUpForm}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
          >
            Create follow up
          </button>
        ) : null}
      </div>
    </div>
  );
}

function CreateFollowUpForm({
  conversation,
  displayName,
  leadId,
  orgProfiles,
  isPending,
  onSubmit,
  onCancel,
}: {
  conversation: OmnichannelConversationDetail;
  displayName: string;
  leadId: string;
  orgProfiles: OrgProfile[];
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
}) {
  const defaultNotes = buildInboxFollowUpDefaultNotes(
    conversation.channelLabel,
    conversation.lastMessagePreview,
  );

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(new FormData(event.currentTarget));
      }}
      className="space-y-2"
    >
      <input type="hidden" name="conversation_id" value={conversation.id} />
      <input type="hidden" name="lead_id" value={leadId} />
      <Field
        label="Follow up title"
        name="title"
        required
        defaultValue={buildInboxFollowUpDefaultTitle(displayName)}
      />
      <div className="grid grid-cols-2 gap-2">
        <Field
          label="Due date"
          name="due_date"
          type="date"
          required
          defaultValue={getTomorrowDateValue()}
        />
        <Field
          label="Due time"
          name="due_time"
          type="time"
          required
          defaultValue={getDefaultInboxFollowUpDueTime()}
        />
      </div>
      <div>
        <label htmlFor="follow-up-assigned" className="text-xs font-medium">
          Assigned to
        </label>
        <select
          id="follow-up-assigned"
          name="assigned_to"
          defaultValue={conversation.assignedUserId ?? ""}
          className="mt-1 w-full rounded-lg border bg-background px-2.5 py-2 text-xs"
        >
          <option value="">Unassigned</option>
          {orgProfiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.full_name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="follow-up-priority" className="text-xs font-medium">
          Priority
        </label>
        <select
          id="follow-up-priority"
          name="priority"
          defaultValue="normal"
          className="mt-1 w-full rounded-lg border bg-background px-2.5 py-2 text-xs"
        >
          {INBOX_FOLLOW_UP_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="follow-up-notes" className="text-xs font-medium">
          Notes
        </label>
        <textarea
          id="follow-up-notes"
          name="notes"
          rows={3}
          defaultValue={defaultNotes}
          className="mt-1 w-full rounded-lg border bg-background px-2.5 py-2 text-xs"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className={cn(buttonVariants({ size: "sm" }), "flex-1")}
        >
          {isPending ? "Saving…" : "Schedule follow up"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={onCancel}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function ConvertLeadForm({
  conversation,
  displayName,
  orgProfiles,
  initialValues,
  isPending,
  onSubmit,
  onCancel,
}: {
  conversation: OmnichannelConversationDetail;
  displayName: string;
  orgProfiles: OrgProfile[];
  initialValues?: ConvertLeadFormPrefill | null;
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
}) {
  const defaultNotes =
    initialValues?.notes ||
    buildInboxConvertNotesDefault(
      conversation.messages,
      conversation.lastMessagePreview,
    );

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(new FormData(event.currentTarget));
      }}
      className="space-y-2"
    >
      <input type="hidden" name="conversation_id" value={conversation.id} />
      <Field
        label="Lead name"
        name="full_name"
        required
        defaultValue={initialValues?.fullName ?? displayName}
      />
      <Field
        label="Phone"
        name="whatsapp_number"
        placeholder="62812xxxxxxx"
        defaultValue={initialValues?.phone ?? ""}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        defaultValue={initialValues?.email ?? ""}
      />
      <div>
        <label htmlFor="convert-source" className="text-xs font-medium text-foreground">
          Source
        </label>
        <input
          id="convert-source"
          value={conversation.channelLabel}
          readOnly
          className="mt-1 w-full rounded-lg border bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground"
        />
      </div>
      <Field
        label="Destination interest"
        name="package_interest"
        defaultValue={initialValues?.packageInterest ?? ""}
      />
      <Field
        label="Travel date"
        name="travel_date_preference"
        type="date"
        defaultValue={initialValues?.travelDatePreference ?? ""}
      />
      <Field
        label="Pax"
        name="party_size"
        type="number"
        min={1}
        defaultValue={initialValues?.partySize ?? ""}
      />
      <Field
        label="Budget (IDR)"
        name="budget_idr"
        type="number"
        min={0}
        defaultValue={initialValues?.budgetIdr ?? ""}
      />
      <div>
        <label htmlFor="convert-notes" className="text-xs font-medium">
          Notes
        </label>
        <textarea
          id="convert-notes"
          name="notes"
          rows={3}
          defaultValue={defaultNotes}
          className="mt-1 w-full rounded-lg border bg-background px-2.5 py-2 text-xs"
        />
      </div>
      <div>
        <label htmlFor="convert-assigned" className="text-xs font-medium">
          Assigned to
        </label>
        <select
          id="convert-assigned"
          name="assigned_to"
          defaultValue={conversation.assignedUserId ?? ""}
          className="mt-1 w-full rounded-lg border bg-background px-2.5 py-2 text-xs"
        >
          <option value="">Unassigned</option>
          {orgProfiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.full_name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className={cn(buttonVariants({ size: "sm" }), "flex-1")}
        >
          {isPending ? "Converting…" : "Create lead"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={onCancel}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
  required,
  min,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  min?: number;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-xs font-medium text-foreground">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        min={min}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border bg-background px-2.5 py-1.5 text-xs"
      />
    </div>
  );
}
