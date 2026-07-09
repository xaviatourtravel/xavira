"use client";

import {
  Briefcase,
  NotebookPen,
  Plus,
  Route,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { CustomerAvatar } from "@/components/omnichannel-inbox/customer-avatar";
import { getConversationDisplayName } from "@/components/omnichannel-inbox/inbox-display";
import {
  AURORA_CONTEXT_CARD_CLASS,
  AURORA_CONTEXT_CARD_STACK_GAP,
  AURORA_CONTEXT_CHIP_CLASS,
  AURORA_CONTEXT_PANEL_WIDTH,
} from "@/components/workspace/aurora-tokens";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import { cn } from "@/lib/utils";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { buildSalesTakeoverSummary } from "@/modules/inbox/lib/build-sales-takeover-summary";

const JOURNEY_STAGES = [
  { id: "new-lead", label: "New Lead" },
  { id: "qualified", label: "Qualified" },
  { id: "quotation", label: "Quotation" },
  { id: "booked", label: "Booked" },
] as const;

type JourneyStageId = (typeof JOURNEY_STAGES)[number]["id"];
type JourneyStageState = "completed" | "current" | "upcoming";

type JourneyStageView = {
  id: JourneyStageId;
  label: string;
  state: JourneyStageState;
};

type BookingView = {
  status: string;
  departure: string;
  destination: string;
  travelers: string;
  budget: string;
};

type CustomerView = {
  displayName: string;
  avatarUrl: string | null;
  channel: OmnichannelConversationDetail["channel"];
  channelLabel: string;
  statusLabel: string | null;
  assignedTo: string | null;
  tags: string[];
};

const EMPTY_VALUE = "—";

function formatBudgetIdr(value: number): string {
  return `Rp${value.toLocaleString("id-ID")}`;
}

function resolveCurrentJourneyStageId(
  conversation: OmnichannelConversationDetail,
): JourneyStageId {
  const leadStatus = conversation.leadContext?.status;

  if (leadStatus) {
    switch (leadStatus) {
      case "new":
      case "contacted":
      case "nurturing":
        return "new-lead";
      case "qualified":
        return "qualified";
      case "proposal":
      case "negotiation":
        return "quotation";
      case "won":
        return "booked";
      default:
        return "new-lead";
    }
  }

  switch (conversation.status) {
    case "new":
      return "new-lead";
    case "following_up":
      return "qualified";
    case "quotation_sent":
      return "quotation";
    case "waiting_dp":
    case "closed_won":
      return "booked";
    default:
      return "new-lead";
  }
}

function buildJourneyStages(
  conversation: OmnichannelConversationDetail,
): JourneyStageView[] {
  const currentStageId = resolveCurrentJourneyStageId(conversation);
  const currentIndex = JOURNEY_STAGES.findIndex((stage) => stage.id === currentStageId);

  return JOURNEY_STAGES.map((stage, index) => ({
    id: stage.id,
    label: stage.label,
    state:
      index < currentIndex
        ? "completed"
        : index === currentIndex
          ? "current"
          : "upcoming",
  }));
}

function resolveTags(conversation: OmnichannelConversationDetail): string[] {
  if (conversation.leadContext?.tags.length) {
    return conversation.leadContext.tags;
  }

  if (conversation.tags.length) {
    return conversation.tags;
  }

  return conversation.labels.map((label) => label.tag);
}

function buildCustomerView(conversation: OmnichannelConversationDetail): CustomerView {
  const lead = conversation.leadContext;

  return {
    displayName: lead?.fullName?.trim() || getConversationDisplayName(conversation),
    avatarUrl: conversation.customerAvatar,
    channel: conversation.channel,
    channelLabel: conversation.channelLabel,
    statusLabel: lead?.statusLabel ?? conversation.statusLabel ?? null,
    assignedTo: conversation.assignedUserName?.trim() || lead?.assignedToName?.trim() || null,
    tags: resolveTags(conversation),
  };
}

function buildBookingView(conversation: OmnichannelConversationDetail): BookingView {
  const lead = conversation.leadContext;
  const summary = buildSalesTakeoverSummary({
    leadQualification: conversation.leadQualification,
    conversationMemory: conversation.conversationMemory,
    aiActivityEvents: conversation.aiActivityEvents,
    messages: conversation.messages,
  });

  const hasBookingStatus =
    conversation.status === "waiting_dp" || conversation.status === "closed_won";

  const departure =
    lead?.travelDatePreference?.trim() ||
    summary.departure ||
    summary.tripType ||
    EMPTY_VALUE;

  const destination =
    lead?.packageInterest?.trim() || summary.destination || EMPTY_VALUE;

  const travelers =
    lead?.partySize != null
      ? String(lead.partySize)
      : summary.passengerCount || EMPTY_VALUE;

  const budget =
    lead?.budgetIdr != null
      ? formatBudgetIdr(lead.budgetIdr)
      : summary.budget || EMPTY_VALUE;

  const hasBookingDetails =
    hasBookingStatus ||
    departure !== EMPTY_VALUE ||
    destination !== EMPTY_VALUE ||
    travelers !== EMPTY_VALUE ||
    budget !== EMPTY_VALUE;

  if (!hasBookingDetails) {
    return {
      status: "No Booking Yet",
      departure: EMPTY_VALUE,
      destination: EMPTY_VALUE,
      travelers: EMPTY_VALUE,
      budget: EMPTY_VALUE,
    };
  }

  return {
    status: hasBookingStatus ? conversation.statusLabel : "No Booking Yet",
    departure,
    destination,
    travelers,
    budget,
  };
}

function buildAiSummaryLines(conversation: OmnichannelConversationDetail): string[] {
  const summary = buildSalesTakeoverSummary({
    leadQualification: conversation.leadQualification,
    conversationMemory: conversation.conversationMemory,
    aiActivityEvents: conversation.aiActivityEvents,
    messages: conversation.messages,
  });

  if (summary.generatedSummary) {
    return summary.generatedSummary
      .split(/(?<=\.)\s+/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  const lines: string[] = [];
  const lead = conversation.leadContext;

  if (lead?.packageInterest?.trim()) {
    lines.push(`Customer is interested in ${lead.packageInterest.trim()}.`);
  }

  if (summary.budget) {
    lines.push(`Budget discussed: ${summary.budget}.`);
  } else {
    lines.push("Budget has not been confirmed.");
  }

  if (summary.departure) {
    lines.push(`Travel period: ${summary.departure}.`);
  } else {
    lines.push("Travel period still unknown.");
  }

  const preview = conversation.lastMessagePreview?.trim();
  if (preview) {
    const clipped = preview.length > 120 ? `${preview.slice(0, 120)}…` : preview;
    lines.push(`Latest message: "${clipped}"`);
  } else if (lines.length <= 2) {
    lines.push("Waiting for more customer context.");
  }

  return lines;
}

function getLatestNote(conversation: OmnichannelConversationDetail): string | null {
  if (conversation.notes.length === 0) {
    return null;
  }

  const latestNote = [...conversation.notes].sort(
    (left, right) =>
      new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  )[0];

  return latestNote.note.trim() || null;
}

type ContextSectionCardProps = {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
};

function ContextSectionCard({ title, icon: Icon, children }: ContextSectionCardProps) {
  return (
    <section className={AURORA_CONTEXT_CARD_CLASS}>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/55" aria-hidden />
        <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function LabelValueRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right text-sm text-foreground">{value}</span>
    </div>
  );
}

function CustomerCard({
  title,
  customer,
}: {
  title: string;
  customer: CustomerView;
}) {
  return (
    <ContextSectionCard title={title} icon={User}>
      <div className="flex items-start gap-3">
        <CustomerAvatar
          displayName={customer.displayName}
          avatarUrl={customer.avatarUrl}
          size="md"
          channel={customer.channel}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {customer.displayName}
          </p>
          {customer.statusLabel ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {customer.channelLabel}
              <span aria-hidden> · </span>
              {customer.statusLabel}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">{customer.channelLabel}</p>
          )}
          {customer.assignedTo ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Assigned to {customer.assignedTo}
            </p>
          ) : null}
        </div>
      </div>
      {customer.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {customer.tags.map((tag) => (
            <span key={tag} className={AURORA_CONTEXT_CHIP_CLASS}>
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </ContextSectionCard>
  );
}

function JourneyCard({
  title,
  stages,
}: {
  title: string;
  stages: JourneyStageView[];
}) {
  return (
    <ContextSectionCard title={title} icon={Route}>
      <ol className="space-y-0">
        {stages.map((stage, index) => {
          const isLast = index === stages.length - 1;
          const isCompleted = stage.state === "completed";
          const isCurrent = stage.state === "current";

          return (
            <li key={stage.id} className="flex gap-2.5">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                    isCompleted && "bg-emerald-500/80",
                    isCurrent && "bg-primary",
                    !isCompleted && !isCurrent && "bg-muted-foreground/25",
                  )}
                />
                {!isLast ? (
                  <span className="my-0.5 w-px flex-1 bg-border/40" aria-hidden />
                ) : null}
              </div>
              <div className={cn("min-w-0 pb-3", isLast && "pb-0")}>
                <p
                  className={cn(
                    "text-sm leading-snug",
                    isCompleted && "font-medium text-emerald-700 dark:text-emerald-400",
                    isCurrent && "font-semibold text-foreground",
                    !isCompleted && !isCurrent && "text-muted-foreground/55",
                  )}
                >
                  {stage.label}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </ContextSectionCard>
  );
}

function BookingCard({
  title,
  booking,
}: {
  title: string;
  booking: BookingView;
}) {
  return (
    <ContextSectionCard title={title} icon={Briefcase}>
      <div className="divide-y divide-border/20">
        <LabelValueRow label="Status" value={booking.status} />
        <LabelValueRow label="Departure" value={booking.departure} />
        <LabelValueRow label="Destination" value={booking.destination} />
        <LabelValueRow label="Travelers" value={booking.travelers} />
        <LabelValueRow label="Budget" value={booking.budget} />
      </div>
    </ContextSectionCard>
  );
}

function NotesCard({
  title,
  latestNote,
}: {
  title: string;
  latestNote: string | null;
}) {
  return (
    <ContextSectionCard title={title} icon={NotebookPen}>
      <p className="text-sm text-muted-foreground">
        {latestNote ?? "No notes yet"}
      </p>
      <button
        type="button"
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border/25 bg-muted/15 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
        Add Note
      </button>
    </ContextSectionCard>
  );
}

function AiSummaryCard({
  title,
  lines,
}: {
  title: string;
  lines: string[];
}) {
  return (
    <ContextSectionCard title={title} icon={Sparkles}>
      <div className="space-y-2">
        {lines.map((line) => (
          <p
            key={line}
            className="text-[13px] leading-relaxed text-muted-foreground/80"
          >
            {line}
          </p>
        ))}
      </div>
    </ContextSectionCard>
  );
}

function ContextPanelEmptyState() {
  const { ti } = useInboxTranslation();

  return (
    <div className="flex h-full min-h-[240px] flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold text-foreground">
        {ti("selectConversationEmpty")}
      </p>
      <p className="mt-1.5 max-w-[240px] text-sm leading-relaxed text-muted-foreground">
        Customer details will appear here
      </p>
    </div>
  );
}

type InboxContextPanelProps = {
  conversation: OmnichannelConversationDetail | null;
  className?: string;
};

/**
 * Aurora Context Panel — CRM-style desktop rail bound to the selected conversation.
 */
export function InboxContextPanel({
  conversation,
  className,
}: InboxContextPanelProps) {
  const { ti } = useInboxTranslation();

  return (
    <aside
      className={cn(
        AURORA_CONTEXT_PANEL_WIDTH,
        "hidden h-full min-h-0 shrink-0 flex-col overflow-hidden border-l border-border/25 bg-background lg:flex",
        className,
      )}
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
        {!conversation ? (
          <ContextPanelEmptyState />
        ) : (
          <div className={cn("flex flex-col", AURORA_CONTEXT_CARD_STACK_GAP)}>
            <CustomerCard
              title={ti("contextPanelCustomer")}
              customer={buildCustomerView(conversation)}
            />
            <JourneyCard
              title={ti("contextPanelJourney")}
              stages={buildJourneyStages(conversation)}
            />
            <BookingCard
              title={ti("contextPanelBooking")}
              booking={buildBookingView(conversation)}
            />
            <NotesCard
              title={ti("contextPanelNotes")}
              latestNote={getLatestNote(conversation)}
            />
            <AiSummaryCard
              title={ti("contextPanelAiSummary")}
              lines={buildAiSummaryLines(conversation)}
            />
          </div>
        )}
      </div>
    </aside>
  );
}
