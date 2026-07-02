"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  Bell,
  Check,
  Copy,
  Phone,
  UserRoundPlus,
} from "lucide-react";

import type { useWorkspaceOperations } from "@/components/communication-workspace/workspace-operations-panel";
import { OmnichannelChannelBadge } from "@/components/omnichannel-inbox/channel-badge";
import { CustomerAvatar } from "@/components/omnichannel-inbox/customer-avatar";
import { buttonVariants } from "@/components/ui/button";
import { DesklabsAvatar } from "@/components/ui/desklabs-avatar";
import {
  InspectorField,
  InspectorSection,
  InspectorSectionLabel,
  InspectorSurface,
} from "@/components/customer-passport/inspector/primitives";
import {
  getInspectorJourneyStatusLabel,
  INSPECTOR_JOURNEY_STAGES,
  INSPECTOR_STATUS_BADGE_LABELS,
  mapPassportStageToInspectorJourney,
  resolveInspectorPaymentStatus,
} from "@/lib/customer-passport/inspector-helpers";
import type { CustomerPassport } from "@/lib/customer-passport/types";
import { customerWorkspaceHref } from "@/lib/customers/routes";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import { cn } from "@/lib/utils";

type Ops = ReturnType<typeof useWorkspaceOperations>;

const PASSPORT_FIELD_CLASS =
  "h-9 w-full rounded-2xl bg-muted/30 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30";

const PASSPORT_ACTION_CLASS =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-2xl border border-border/60 bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted/40 disabled:pointer-events-none disabled:opacity-40";

export function PassportIdentitySection({
  passport,
  conversation,
  journeyLabel,
  phone,
}: {
  passport: CustomerPassport;
  conversation: OmnichannelConversationDetail;
  journeyLabel: string;
  phone: string | null;
}) {
  return (
    <InspectorSection className="space-y-3">
      <div className="flex items-start gap-4">
        <CustomerAvatar
          displayName={passport.identity.name}
          avatarUrl={passport.identity.avatarUrl}
          size="lg"
          channel={
            conversation.channel === "whatsapp"
              ? "whatsapp"
              : conversation.channel === "instagram"
                ? "instagram"
                : conversation.channel === "facebook"
                  ? "facebook"
                  : "default"
          }
        />
        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="truncate text-lg font-semibold leading-tight text-foreground">
            {passport.identity.name}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <OmnichannelChannelBadge
              channel={conversation.channel}
              className="px-2 py-0.5 text-[10px]"
            />
            <span className="inline-flex rounded-full bg-[#2563EB]/10 px-2 py-0.5 text-[10px] font-medium text-[#2563EB]">
              {journeyLabel}
            </span>
          </div>
          {phone ? (
            <p className="truncate text-sm text-muted-foreground">{phone}</p>
          ) : null}
        </div>
      </div>
    </InspectorSection>
  );
}

export function PassportAssignedSalesSection({
  conversation,
  orgProfiles,
  canReassign,
  ops,
}: {
  conversation: OmnichannelConversationDetail;
  orgProfiles: Array<{ id: string; full_name: string }>;
  canReassign: boolean;
  ops: Ops;
}) {
  const assigneeName = conversation.assignedUserName ?? "Belum ditugaskan";

  return (
    <InspectorSection className="space-y-3">
      <InspectorSectionLabel>Assigned Sales</InspectorSectionLabel>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <DesklabsAvatar name={assigneeName} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {assigneeName}
            </p>
            <p className="text-xs text-muted-foreground">Sales</p>
          </div>
        </div>

        {canReassign ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              ops.handleAssign(new FormData(event.currentTarget));
            }}
            className="flex shrink-0 items-center gap-1.5"
          >
            <select
              name="assigned_user_id"
              defaultValue={conversation.assignedUserId ?? ""}
              disabled={ops.isPending}
              className={cn(PASSPORT_FIELD_CLASS, "w-[7.5rem]")}
              aria-label="Pilih sales"
            >
              <option value="">—</option>
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
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-9 rounded-2xl px-3 text-xs",
              )}
            >
              Assign
            </button>
          </form>
        ) : null}
      </div>
    </InspectorSection>
  );
}

export function PassportJourneySection({
  currentStage,
}: {
  currentStage: ReturnType<typeof mapPassportStageToInspectorJourney>;
}) {
  return (
    <InspectorSection className="space-y-3">
      <InspectorSectionLabel>Journey</InspectorSectionLabel>
      <ul className="space-y-0">
        {INSPECTOR_JOURNEY_STAGES.map((stage, index) => {
          const isCurrent = stage === currentStage;
          const isLast = index === INSPECTOR_JOURNEY_STAGES.length - 1;

          return (
            <li key={stage} className="flex gap-3">
              <div className="flex flex-col items-center pt-1">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isCurrent ? "bg-[#2563EB]" : "bg-border",
                  )}
                />
                {!isLast ? (
                  <span className="mt-1 w-px flex-1 min-h-[18px] bg-border/70" />
                ) : null}
              </div>
              <p
                className={cn(
                  "pb-3 text-xs leading-none",
                  isCurrent
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {INSPECTOR_STATUS_BADGE_LABELS[stage]}
              </p>
            </li>
          );
        })}
      </ul>
    </InspectorSection>
  );
}

export function PassportBookingSection({
  conversation,
  passport,
  lead,
}: {
  conversation: OmnichannelConversationDetail;
  passport: CustomerPassport;
  lead: OmnichannelConversationDetail["leadContext"];
}) {
  const customerHref = conversation.leadId
    ? customerWorkspaceHref(conversation.leadId)
    : null;

  return (
    <InspectorSection className="space-y-3">
      <InspectorSectionLabel>Current Booking</InspectorSectionLabel>
      <InspectorSurface className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <InspectorField
            label="Package"
            value={lead?.packageInterest ?? passport.travel.wishlist[0] ?? null}
          />
          <InspectorField
            label="Departure"
            value={lead?.travelDatePreference ?? null}
          />
          <InspectorField
            label="Payment Status"
            value={resolveInspectorPaymentStatus(
              conversation.status,
              lead?.status,
            )}
          />
          <InspectorField
            label="PIC"
            value={
              conversation.assignedUserName ?? lead?.assignedToName ?? null
            }
          />
        </div>
        {customerHref ? (
          <Link
            href={customerHref}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-9 w-full rounded-2xl text-xs",
            )}
          >
            Open Booking
            <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        ) : null}
      </InspectorSurface>
    </InspectorSection>
  );
}

export function PassportQuickActionsSection({
  conversation,
  phone,
  hasBooking,
  canConvert,
  onConvert,
  isPending,
}: {
  conversation: OmnichannelConversationDetail;
  phone: string | null;
  hasBooking: boolean;
  canConvert: boolean;
  onConvert: () => void;
  isPending: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const customerHref = conversation.leadId
    ? customerWorkspaceHref(conversation.leadId)
    : null;
  const phoneDigits = phone?.replace(/\D/g, "") ?? "";

  function handleCopy() {
    if (!phone) return;
    void navigator.clipboard.writeText(phone).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  }

  const actions = [
    {
      key: "customer",
      label: "Open Customer",
      href: customerHref,
      disabled: !customerHref,
      icon: ArrowUpRight,
    },
    {
      key: "call",
      label: "Call",
      href: phoneDigits ? `tel:+${phoneDigits}` : null,
      disabled: !phoneDigits,
      icon: Phone,
    },
    {
      key: "copy",
      label: copied ? "Copied" : "Copy Number",
      onClick: handleCopy,
      disabled: !phone,
      icon: copied ? Check : Copy,
    },
    {
      key: "booking",
      label: "Open Booking",
      href: hasBooking ? customerHref : null,
      disabled: !hasBooking || !customerHref,
      icon: ArrowUpRight,
    },
  ] as const;

  return (
    <InspectorSection className="space-y-3">
      <InspectorSectionLabel>Quick Actions</InspectorSectionLabel>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          const className = PASSPORT_ACTION_CLASS;

          if (
            "href" in action &&
            action.href &&
            !action.disabled
          ) {
            return (
              <Link key={action.key} href={action.href} className={className}>
                <Icon className="h-3.5 w-3.5" />
                {action.label}
              </Link>
            );
          }

          return (
            <button
              key={action.key}
              type="button"
              disabled={
                (("disabled" in action ? action.disabled : false) || isPending)
              }
              onClick={"onClick" in action ? action.onClick : undefined}
              className={className}
            >
              <Icon className="h-3.5 w-3.5" />
              {action.label}
            </button>
          );
        })}
        {canConvert && !conversation.leadId ? (
          <button
            type="button"
            disabled={isPending}
            onClick={onConvert}
            className={cn(PASSPORT_ACTION_CLASS, "col-span-2")}
          >
            <UserRoundPlus className="h-3.5 w-3.5" />
            Konversi jadi lead
          </button>
        ) : null}
      </div>
    </InspectorSection>
  );
}

export function PassportNotesSection({
  conversation,
  canAddNote,
  ops,
}: {
  conversation: OmnichannelConversationDetail;
  canAddNote: boolean;
  ops: Ops;
}) {
  if (!canAddNote) {
    return null;
  }

  return (
    <InspectorSection className="space-y-3">
      <InspectorSectionLabel>Internal Notes</InspectorSectionLabel>
      <textarea
        value={ops.noteText}
        onChange={(event) => ops.setNoteText(event.target.value)}
        rows={3}
        placeholder="Catatan privat, hanya tim yang bisa melihat…"
        disabled={ops.isPending}
        className={cn(PASSPORT_FIELD_CLASS, "min-h-[88px] resize-none py-2.5")}
      />
      <button
        type="button"
        disabled={ops.isPending || !ops.noteText.trim()}
        onClick={ops.handleAddNote}
        className={cn(
          buttonVariants({ size: "sm" }),
          "h-9 rounded-2xl px-4 text-xs",
        )}
      >
        Simpan catatan
      </button>
      {conversation.notes.length > 0 ? (
        <div className="max-h-32 space-y-3 overflow-y-auto pt-1">
          {conversation.notes.slice(0, 5).map((note) => (
            <div key={note.id} className="text-xs">
              <p className="leading-relaxed text-foreground">{note.note}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {note.authorName ?? "Tim"} ·{" "}
                {new Date(note.created_at).toLocaleString("id-ID")}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </InspectorSection>
  );
}

export function PassportReminderSection({
  conversation,
  canCreateFollowUp,
  ops,
}: {
  conversation: OmnichannelConversationDetail;
  canCreateFollowUp: boolean;
  ops: Ops;
}) {
  if (!canCreateFollowUp) {
    return null;
  }

  return (
    <InspectorSection className="space-y-3">
      <InspectorSectionLabel className="flex items-center gap-1.5">
        <Bell className="h-3 w-3" />
        Reminder
      </InspectorSectionLabel>
      {conversation.leadId ? (
        <div className="space-y-2">
          <input
            value={ops.followUpTitle}
            onChange={(event) => ops.setFollowUpTitle(event.target.value)}
            placeholder="Judul pengingat…"
            disabled={ops.isPending}
            className={PASSPORT_FIELD_CLASS}
          />
          <input
            type="date"
            value={ops.followUpDueDate}
            onChange={(event) => ops.setFollowUpDueDate(event.target.value)}
            disabled={ops.isPending}
            className={PASSPORT_FIELD_CLASS}
          />
          <button
            type="button"
            disabled={
              ops.isPending || !ops.followUpTitle.trim() || !ops.followUpDueDate
            }
            onClick={ops.handleFollowUp}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-9 rounded-2xl px-4 text-xs",
            )}
          >
            Jadwalkan tindak lanjut
          </button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Konversi jadi lead dulu untuk menjadwalkan pengingat.
        </p>
      )}
    </InspectorSection>
  );
}

export function PassportLabelsSection({
  conversation,
  ops,
}: {
  conversation: OmnichannelConversationDetail;
  ops: Ops;
}) {
  return (
    <InspectorSection className="space-y-3">
      <InspectorSectionLabel>Labels</InspectorSectionLabel>
      <div className="flex gap-2">
        <input
          value={ops.newLabel}
          onChange={(event) => ops.setNewLabel(event.target.value)}
          placeholder="Tambah label…"
          disabled={ops.isPending}
          className={cn(PASSPORT_FIELD_CLASS, "min-w-0 flex-1")}
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
            "h-9 shrink-0 rounded-2xl px-3 text-xs",
          )}
        >
          Tambah
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {conversation.labels.length === 0 ? (
          <p className="text-xs text-muted-foreground">Belum ada label</p>
        ) : (
          conversation.labels.map((label) => (
            <span
              key={label.tag}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
              style={{ backgroundColor: label.color }}
            >
              {label.tag}
              <button
                type="button"
                disabled={ops.isPending}
                onClick={() => ops.handleRemoveLabel(label.tag)}
                className="rounded-full px-0.5 opacity-80 hover:opacity-100 disabled:opacity-50"
                aria-label={`Remove ${label.tag}`}
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>
    </InspectorSection>
  );
}
