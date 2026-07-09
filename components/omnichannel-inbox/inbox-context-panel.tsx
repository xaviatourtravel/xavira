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
import { InboxEmptyState } from "@/components/omnichannel-inbox/inbox-empty-state";
import {
  AURORA_CONTEXT_AI_SUMMARY_CLASS,
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

const SECTION_ICON_CLASS = "h-4 w-4 shrink-0 text-muted-foreground/55";
const SECTION_TITLE_CLASS = "text-[13px] font-semibold tracking-tight text-foreground";
const SECTION_BODY_CLASS = "text-sm text-foreground/90";
const SECTION_META_CLASS = "text-xs text-muted-foreground";

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

function isBookingEmpty(booking: BookingView): boolean {
  return (
    booking.status === "No Booking Yet" &&
    booking.departure === EMPTY_VALUE &&
    booking.destination === EMPTY_VALUE &&
    booking.travelers === EMPTY_VALUE &&
    booking.budget === EMPTY_VALUE
  );
}

function isAiSummaryEmpty(conversation: OmnichannelConversationDetail): boolean {
  const summary = buildSalesTakeoverSummary({
    leadQualification: conversation.leadQualification,
    conversationMemory: conversation.conversationMemory,
    aiActivityEvents: conversation.aiActivityEvents,
    messages: conversation.messages,
  });

  if (summary.generatedSummary?.trim()) {
    return false;
  }

  if (conversation.leadContext?.packageInterest?.trim()) {
    return false;
  }

  if (conversation.lastMessagePreview?.trim()) {
    return false;
  }

  return !(
    summary.destination ||
    summary.budget ||
    summary.departure ||
    summary.passengerCount
  );
}

function isCustomerProfileEmpty(conversation: OmnichannelConversationDetail): boolean {
  if (conversation.leadContext || conversation.leadId) {
    return false;
  }

  const name = conversation.customerName?.trim();
  if (!name) {
    return true;
  }

  if (name === "Unknown Customer") {
    return true;
  }

  return name.startsWith("Customer ");
}

type ContextSectionProps = {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
};

function ContextSection({ title, icon: Icon, children, className }: ContextSectionProps) {
  return (
    <section className={cn(AURORA_CONTEXT_CARD_CLASS, className)}>
      <div className="mb-4 flex items-center gap-2">
        <Icon className={SECTION_ICON_CLASS} aria-hidden strokeWidth={1.75} />
        <h3 className={SECTION_TITLE_CLASS}>{title}</h3>
      </div>
      {children}
    </section>
  );
}

function BookingInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-baseline gap-x-4 gap-y-1">
      <span className={cn(SECTION_META_CLASS, "text-muted-foreground")}>{label}</span>
      <span className="truncate text-right text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

function CustomerSection({
  title,
  customer,
  conversation,
  emptyUnknownLabel,
  emptyProfileLabel,
}: {
  title: string;
  customer: CustomerView;
  conversation: OmnichannelConversationDetail;
  emptyUnknownLabel: string;
  emptyProfileLabel: string;
}) {
  const profileEmpty = isCustomerProfileEmpty(conversation);

  return (
    <ContextSection title={title} icon={User}>
      {profileEmpty ? (
        <>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/20">
            <User className="h-5 w-5 text-muted-foreground/45" strokeWidth={1.5} aria-hidden />
          </div>
          <div className="mt-4 min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{emptyUnknownLabel}</p>
            <p className={cn("mt-1", SECTION_META_CLASS)}>{emptyProfileLabel}</p>
          </div>
        </>
      ) : (
        <>
          <CustomerAvatar
            displayName={customer.displayName}
            avatarUrl={customer.avatarUrl}
            size="md"
            className="h-10 w-10"
            channel={
              customer.channel === "whatsapp"
                ? "whatsapp"
                : customer.channel === "instagram"
                  ? "instagram"
                  : customer.channel === "facebook"
                    ? "facebook"
                    : "default"
            }
          />

          <div className="mt-4 min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{customer.displayName}</p>
            <p className={cn("mt-1", SECTION_META_CLASS)}>
              {customer.channelLabel}
              {customer.statusLabel ? (
                <>
                  <span aria-hidden> · </span>
                  {customer.statusLabel}
                </>
              ) : null}
            </p>
          </div>

          {customer.tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {customer.tags.map((tag) => (
                <span key={tag} className={AURORA_CONTEXT_CHIP_CLASS}>
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {customer.assignedTo ? (
            <p className={cn("mt-4", SECTION_META_CLASS)}>Assigned to {customer.assignedTo}</p>
          ) : null}
        </>
      )}
    </ContextSection>
  );
}

function JourneySection({
  title,
  stages,
}: {
  title: string;
  stages: JourneyStageView[];
}) {
  return (
    <ContextSection title={title} icon={Route}>
      <ol className="space-y-0">
        {stages.map((stage, index) => {
          const isLast = index === stages.length - 1;
          const isReached = stage.state === "completed" || stage.state === "current";

          return (
            <li key={stage.id} className="flex gap-3">
              <div className="flex flex-col items-center pt-0.5">
                <span
                  className={cn(
                    "flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-full",
                    isReached
                      ? "bg-primary"
                      : "border-2 border-muted-foreground/25 bg-transparent",
                  )}
                  aria-hidden
                />
                {!isLast ? (
                  <span className="my-1 w-px flex-1 min-h-[20px] bg-border/30" aria-hidden />
                ) : null}
              </div>
              <div className={cn("min-w-0", !isLast && "pb-5")}>
                <p
                  className={cn(
                    SECTION_BODY_CLASS,
                    isReached ? "font-medium text-foreground" : "text-muted-foreground/55",
                    stage.state === "current" && "font-semibold text-primary",
                  )}
                >
                  {stage.label}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </ContextSection>
  );
}

function BookingSection({
  title,
  booking,
  emptyStatusLabel,
  emptyMessage,
}: {
  title: string;
  booking: BookingView;
  emptyStatusLabel: string;
  emptyMessage: string;
}) {
  const empty = isBookingEmpty(booking);

  return (
    <ContextSection title={title} icon={Briefcase}>
      {empty ? (
        <div className="space-y-2">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-baseline gap-x-4">
            <span className={cn(SECTION_META_CLASS, "text-muted-foreground")}>Status</span>
            <span className="truncate text-right text-sm font-semibold capitalize text-foreground">
              {emptyStatusLabel}
            </span>
          </div>
          <p className={cn(SECTION_META_CLASS, "leading-relaxed text-muted-foreground")}>
            {emptyMessage}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          <BookingInfoRow label="Status" value={booking.status} />
          <BookingInfoRow label="Departure" value={booking.departure} />
          <BookingInfoRow label="Destination" value={booking.destination} />
          <BookingInfoRow label="Travelers" value={booking.travelers} />
          <BookingInfoRow label="Budget" value={booking.budget} />
        </div>
      )}
    </ContextSection>
  );
}

function NotesSection({
  title,
  latestNote,
}: {
  title: string;
  latestNote: string | null;
}) {
  return (
    <ContextSection title={title} icon={NotebookPen}>
      {latestNote ? (
        <div className="space-y-3">
          <article className="rounded-xl bg-muted/15 px-3.5 py-3">
            <p className={cn(SECTION_BODY_CLASS, "leading-relaxed text-foreground/85")}>
              {latestNote}
            </p>
          </article>
        </div>
      ) : (
        <div className="space-y-1">
          <p className={cn(SECTION_BODY_CLASS, "text-muted-foreground")}>No notes yet</p>
        </div>
      )}

      <button
        type="button"
        className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-border/20 bg-muted/10 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors duration-150 ease-out hover:bg-muted/25 hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden strokeWidth={1.75} />
        Add Note
      </button>
    </ContextSection>
  );
}

function AiSummarySection({
  title,
  lines,
  empty,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  lines: string[];
  empty: boolean;
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <section className={AURORA_CONTEXT_AI_SUMMARY_CLASS}>
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className={SECTION_ICON_CLASS} aria-hidden strokeWidth={1.75} />
        <h3 className={SECTION_TITLE_CLASS}>{title}</h3>
      </div>
      {empty ? (
        <div className="space-y-2 animate-in fade-in duration-150 ease-out motion-reduce:animate-none">
          <p className="text-sm font-medium text-foreground/85">{emptyTitle}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{emptyDescription}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lines.map((line) => (
            <p key={line} className="text-sm leading-relaxed text-foreground/80">
              {line}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}

function ContextPanelEmptyState() {
  const { ti } = useInboxTranslation();

  return (
    <InboxEmptyState
      icon={User}
      title={ti("selectConversationEmpty")}
      description={ti("contextPanelSelectDesc")}
      variant="compact"
      className="h-full min-h-[280px]"
    />
  );
}

type InboxContextPanelProps = {
  conversation: OmnichannelConversationDetail | null;
  className?: string;
};

/**
 * Aurora Context Panel — premium CRM side rail bound to the selected conversation.
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
        "hidden h-full min-h-0 shrink-0 flex-col overflow-hidden border-l border-border/20 bg-background lg:flex",
        className,
      )}
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
        {!conversation ? (
          <ContextPanelEmptyState />
        ) : (
          <div className={cn("flex flex-col", AURORA_CONTEXT_CARD_STACK_GAP)}>
            <CustomerSection
              title={ti("contextPanelCustomer")}
              customer={buildCustomerView(conversation)}
              conversation={conversation}
              emptyUnknownLabel={ti("emptyCustomerUnknown")}
              emptyProfileLabel={ti("emptyCustomerNoProfile")}
            />
            <JourneySection
              title={ti("contextPanelJourney")}
              stages={buildJourneyStages(conversation)}
            />
            <BookingSection
              title={ti("contextPanelBooking")}
              booking={buildBookingView(conversation)}
              emptyStatusLabel={ti("emptyBookingStatus")}
              emptyMessage={ti("emptyBookingMessage")}
            />
            <NotesSection
              title={ti("contextPanelNotes")}
              latestNote={getLatestNote(conversation)}
            />
            <AiSummarySection
              title={ti("contextPanelAiSummary")}
              lines={buildAiSummaryLines(conversation)}
              empty={isAiSummaryEmpty(conversation)}
              emptyTitle={ti("emptyAiSummaryTitle")}
              emptyDescription={ti("emptyAiSummaryDesc")}
            />
          </div>
        )}
      </div>
    </aside>
  );
}
