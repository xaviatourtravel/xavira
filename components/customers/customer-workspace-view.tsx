"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bot,
  CalendarPlus,
  CreditCard,
  LayoutGrid,
  MessageSquare,
  NotebookPen,
  StickyNote,
  Users,
} from "lucide-react";

import { CustomerAiSummaryPanel } from "@/components/customers/customer-ai-summary-panel";
import { CustomerConversationPanel } from "@/components/customers/customer-conversation-panel";
import { PaymentStatusBadge } from "@/components/bookings/payment-status-badge";
import { BookingParticipantsList } from "@/components/bookings/booking-participants-list";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LeadFollowUpHistoryCard } from "@/components/leads/lead-follow-up-history-card";
import { LeadTemperatureBadge } from "@/components/leads/lead-temperature-badge";
import { LeadTimelineCard } from "@/components/leads/lead-timeline-card";
import { LeadDetailSummaryCard } from "@/components/leads/lead-customer-360-sections";
import {
  createFollowUpTask,
  createLeadActivity,
  completeFollowUpTask,
  convertLeadToBooking,
} from "@/app/(dashboard)/leads/[id]/actions";
import type { CustomerAiSummary } from "@/lib/ai/customer-summary";
import {
  type CustomerWorkspaceTab,
} from "@/lib/customers/constants";
import type { CustomerWorkspaceData } from "@/lib/customers/load-customer-workspace";
import { formatLeadSourceLabel } from "@/lib/leads/source-tracking";
import { formatPaymentTypeLabel } from "@/lib/bookings/payment-fields";
import { formatLeadTimelineDateTime } from "@/lib/leads/timeline";
import type { LeadTimelineEvent } from "@/lib/leads/timeline";
import { cn } from "@/lib/utils";

type CustomerWorkspaceViewProps = {
  data: CustomerWorkspaceData;
  activeTab: CustomerWorkspaceTab;
  canReplyToConversation: boolean;
  canSuggestReply: boolean;
  isUnassignedForAgent: boolean;
  hasBooking: boolean;
  initialAiSummary?: CustomerAiSummary | null;
  hasMinimalAiContext?: boolean;
};

const TAB_ITEMS: Array<{
  id: CustomerWorkspaceTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "conversation", label: "Conversation", icon: MessageSquare },
  { id: "bookings", label: "Bookings", icon: CalendarPlus },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "participants", label: "Participants", icon: Users },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "activity", label: "Activity", icon: NotebookPen },
  { id: "ai", label: "AI", icon: Bot },
];

function formatStatusLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatContact(lead: CustomerWorkspaceData["lead"]) {
  return lead.whatsapp_number || lead.phone || "—";
}

function filterNoteEvents(events: LeadTimelineEvent[]) {
  return events.filter((event) => event.eventType === "note_added");
}

export function CustomerWorkspaceView({
  data,
  activeTab,
  canReplyToConversation,
  canSuggestReply,
  isUnassignedForAgent,
  hasBooking,
  initialAiSummary = null,
  hasMinimalAiContext = true,
}: CustomerWorkspaceViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setTab(tab: CustomerWorkspaceTab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/customers/${data.lead.id}?${params.toString()}`, {
      scroll: false,
    });
  }

  const createBookingAction = (
    <form action={convertLeadToBooking}>
      <input type="hidden" name="lead_id" value={data.lead.id} />
      <button
        type="submit"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        Create Booking
      </button>
    </form>
  );

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 pb-24 lg:pb-0">
      <div className="rounded-2xl border bg-card p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
                {data.lead.full_name}
              </h1>
              <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-800">
                {formatStatusLabel(data.lead.status)}
              </span>
              <LeadTemperatureBadge
                value={data.leadTemperature.value}
                isSuggested={data.leadTemperature.isSuggested}
              />
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                Score {data.healthScore.score}
              </span>
            </div>

            <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-5">
              <span>Source: {formatLeadSourceLabel(data.lead.source)}</span>
              <span>Assigned: {data.lead.assignedToLabel}</span>
              <span>Created {formatDateTime(data.lead.created_at)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!hasBooking ? createBookingAction : null}
            <button
              type="button"
              onClick={() => setTab("overview")}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Add Follow-up
            </button>
            <button
              type="button"
              onClick={() => setTab("notes")}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Add Note
            </button>
            {data.conversationDetail ? (
              <button
                type="button"
                onClick={() => setTab("conversation")}
                className={cn(buttonVariants({ size: "sm" }))}
              >
                Open Conversation
              </button>
            ) : null}
            <Link
              href={`/leads/${data.lead.id}`}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Lead Detail
            </Link>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <nav
          aria-label="Customer workspace tabs"
          className="flex min-w-max gap-1 rounded-xl border bg-muted/30 p-1"
        >
          {TAB_ITEMS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTab(tab.id)}
                className={cn(
                  "inline-flex min-h-[40px] items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === "overview" ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Total Bookings", value: String(data.metrics.totalBookings) },
                { label: "Total Paid", value: formatCurrency(data.metrics.totalPaid) },
                {
                  label: "Outstanding Balance",
                  value: formatCurrency(data.metrics.outstandingBalance),
                },
                {
                  label: "Next Follow-up",
                  value: data.nextFollowUp
                    ? formatDate(data.nextFollowUp.dueDate)
                    : "—",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border bg-card p-4 shadow-sm"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold tabular-nums">
                    {item.value}
                  </p>
                </div>
              ))}
            </section>

            <LeadDetailSummaryCard
              phone={formatContact(data.lead)}
              email={data.lead.email || "—"}
              destinationInterest={data.lead.package_interest || "—"}
              travelDate={
                data.lead.travel_date_preference
                  ? formatDate(data.lead.travel_date_preference)
                  : "—"
              }
              pax={
                data.lead.party_size != null
                  ? String(data.lead.party_size)
                  : "—"
              }
              budgetLabel={
                data.lead.budget_idr != null
                  ? formatCurrency(data.lead.budget_idr)
                  : "—"
              }
              packageInterest={data.lead.package_interest || "—"}
              leadScore={data.healthScore.score}
              leadScoreBadge={data.healthScore.badge}
              intentLevel={data.leadTemperature.value}
              intentSuggested={data.leadTemperature.isSuggested}
              notes={data.lead.notes || "—"}
            />

            <Card>
              <CardHeader>
                <CardTitle>Customer Snapshot</CardTitle>
                <CardDescription>
                  Ringkasan status dan aktivitas terbaru customer.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Lead Status</p>
                  <p className="text-sm font-medium capitalize">
                    {formatStatusLabel(data.lead.status)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Activity</p>
                  <p className="text-sm font-medium">
                    {data.lastActivityAt
                      ? formatLeadTimelineDateTime(data.lastActivityAt)
                      : "—"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <LeadFollowUpHistoryCard
              followUpTasks={data.followUpHistory}
              leadId={data.lead.id}
              completeFollowUpTask={completeFollowUpTask}
            />

            <Card id="create-follow-up">
              <CardHeader>
                <CardTitle>Create Follow-up</CardTitle>
                <CardDescription>
                  Jadwalkan follow-up untuk customer ini.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={createFollowUpTask} className="space-y-4">
                  <input type="hidden" name="lead_id" value={data.lead.id} />
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <input
                      name="title"
                      required
                      placeholder="Call back customer"
                      className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Due date</label>
                    <input
                      type="datetime-local"
                      name="due_date"
                      required
                      className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Notes</label>
                    <textarea
                      name="description"
                      rows={3}
                      className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className={cn(buttonVariants({ size: "sm" }))}
                  >
                    Save Follow-up
                  </button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {activeTab === "conversation" ? (
        data.conversationDetail ? (
          <CustomerConversationPanel
            conversation={data.conversationDetail}
            customerId={data.lead.id}
            canReply={canReplyToConversation}
            canSuggestReply={canSuggestReply}
            isUnassignedForAgent={isUnassignedForAgent}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No conversation linked</CardTitle>
              <CardDescription>
                Customer ini belum memiliki conversation di Inbox.
              </CardDescription>
            </CardHeader>
          </Card>
        )
      ) : null}

      {activeTab === "bookings" ? (
        <Card>
          <CardHeader>
            <CardTitle>Bookings</CardTitle>
            <CardDescription>
              Semua booking yang terhubung dengan customer ini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada booking untuk customer ini.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="border-b bg-muted/50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">Booking</th>
                      <th className="px-4 py-3 font-medium">Package</th>
                      <th className="px-4 py-3 font-medium">Departure</th>
                      <th className="px-4 py-3 font-medium">Total</th>
                      <th className="px-4 py-3 font-medium">Payment</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bookings.map((booking) => (
                      <tr key={booking.id} className="border-b last:border-b-0">
                        <td className="px-4 py-3 font-medium">
                          {booking.booking_code || booking.id.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3">{booking.package_name || "—"}</td>
                        <td className="px-4 py-3">
                          {booking.departure_date
                            ? formatDate(booking.departure_date)
                            : "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                          {formatCurrency(Number(booking.total_amount))}
                        </td>
                        <td className="px-4 py-3">
                          <PaymentStatusBadge status={booking.payment_status} />
                        </td>
                        <td className="px-4 py-3 capitalize">
                          {formatStatusLabel(booking.booking_status)}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/bookings/${booking.id}`}
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                          >
                            Open
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "payments" ? (
        <Card>
          <CardHeader>
            <CardTitle>Payments</CardTitle>
            <CardDescription>
              Aggregated payments across all customer bookings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada payment tercatat.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="border-b bg-muted/50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">Booking</th>
                      <th className="px-4 py-3 font-medium">Payment Type</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.map((payment) => (
                      <tr key={payment.id} className="border-b last:border-b-0">
                        <td className="px-4 py-3 font-medium">
                          {payment.bookingCode || payment.bookingId.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3">
                          {formatPaymentTypeLabel(payment.payment_type)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                          {formatCurrency(Number(payment.amount))}
                        </td>
                        <td className="px-4 py-3">
                          <PaymentStatusBadge status={payment.bookingPaymentStatus} />
                        </td>
                        <td className="px-4 py-3">
                          {payment.payment_date
                            ? formatDate(payment.payment_date)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "participants" ? (
        <div className="space-y-6">
          {data.participantGroups.length === 0 ||
          data.participantGroups.every((group) => group.participants.length === 0) ? (
            <Card>
              <CardHeader>
                <CardTitle>Participants</CardTitle>
                <CardDescription>
                  Belum ada participant untuk booking customer ini.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            data.participantGroups.map((group) =>
              group.participants.length > 0 ? (
                <Card key={group.bookingId}>
                  <CardHeader>
                    <CardTitle>
                      {group.bookingCode || group.bookingId.slice(0, 8)}
                    </CardTitle>
                    <CardDescription>
                      {group.packageName || "Booking participants"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BookingParticipantsList
                      bookingId={group.bookingId}
                      participants={group.participants}
                    />
                  </CardContent>
                </Card>
              ) : null,
            )
          )}
        </div>
      ) : null}

      {activeTab === "notes" ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Notes</CardTitle>
              <CardDescription>
                Catatan profil customer dari data lead.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {data.lead.notes || "Belum ada catatan profil."}
              </p>
            </CardContent>
          </Card>

          <LeadTimelineCard
            leadId={data.lead.id}
            events={filterNoteEvents(data.timelineEvents)}
            createLeadActivity={createLeadActivity}
            title="Internal Notes"
            description="Catatan aktivitas internal untuk customer ini."
          />
        </div>
      ) : null}

      {activeTab === "activity" ? (
        <LeadTimelineCard
          leadId={data.lead.id}
          events={data.timelineEvents}
          createLeadActivity={createLeadActivity}
          showComposer={false}
          title="Activity Timeline"
          description="Riwayat aktivitas customer dari lead, conversation, booking, dan payment."
        />
      ) : null}

      {activeTab === "ai" ? (
        <CustomerAiSummaryPanel
          leadId={data.lead.id}
          initialSummary={initialAiSummary}
          hasMinimalContext={hasMinimalAiContext}
        />
      ) : null}
    </div>
  );
}
