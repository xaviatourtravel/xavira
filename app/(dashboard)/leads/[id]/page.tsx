import Link from "next/link";
import { notFound } from "next/navigation";

import {
  createLeadActivity,
  createFollowUpTask,
  createFollowUpFromRecommendation,
  completeFollowUpTask,
  convertLeadToBooking,
} from "./actions";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PaymentStatusBadge } from "@/components/bookings/payment-status-badge";
import { AiFollowUpAssistantCard } from "@/components/leads/ai-follow-up-assistant-card";
import { AiSalesIntelligenceCard } from "@/components/leads/ai-sales-intelligence-card";
import { LeadBookingReadinessCard } from "@/components/leads/lead-booking-readiness-card";
import {
  LeadConversationContextCard,
  LeadDetailHeader,
  LeadDetailSummaryCard,
} from "@/components/leads/lead-customer-360-sections";
import { LeadFollowUpHistoryCard } from "@/components/leads/lead-follow-up-history-card";
import { LeadHealthScoreCard } from "@/components/leads/lead-health-score-card";
import { LeadTimelineCard } from "@/components/leads/lead-timeline-card";
import { QuotationCard } from "@/components/leads/quotation-card";
import { SnoozeLeadCard } from "@/components/leads/snooze-lead-card";
import { resolveLeadIntelligenceFromLeadData } from "@/lib/ai/lead-intelligence";
import { requireProfile } from "@/lib/auth/session";
import { buildBookingPaymentTotals } from "@/lib/bookings/payment-summary";
import {
  formatAssignedUserLabel,
  getLeadAssigneeName,
} from "@/lib/leads/assignment";
import { calculateLeadHealthScore } from "@/lib/leads/health-score";
import {
  buildBookingReadiness,
  buildExtendedLeadTimeline,
  buildLeadFollowUpHistory,
  loadLeadConversationContext,
  mapActivitiesForTimeline,
} from "@/lib/leads/lead-customer-360";
import { getEffectiveLeadTemperature } from "@/lib/leads/lead-temperature";
import { hasPendingRecommendedFollowUpTask } from "@/lib/leads/next-best-action";
import { formatLeadTimelineDateTime } from "@/lib/leads/timeline";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";

type LeadDetail = {
  id: string;
  full_name: string;
  phone: string | null;
  whatsapp_number: string | null;
  email: string | null;
  source: string;
  interest_type: string;
  package_interest: string | null;
  status: string;
  priority: string;
  budget_idr: number | null;
  travel_date_preference: string | null;
  party_size: number | null;
  notes: string | null;
  assigned_to: string | null;
  campaign_id: string | null;
  lead_date: string | null;
  lead_temperature: string | null;
  snooze_until: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  campaigns: { name: string } | { name: string }[] | null;
  profiles: { full_name: string | null } | { full_name: string | null }[] | null;
};

type LeadActivityRow = {
  id: string;
  activity_type: string;
  title: string | null;
  body: string | null;
  occurred_at: string;
  metadata: Record<string, unknown> | null;
  profiles:
    | { full_name: string | null }
    | { full_name: string | null }[]
    | null;
};

type FollowUpTask = {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  status: string;
  created_by: string | null;
};

type RelatedBooking = {
  id: string;
  booking_code: string | null;
  package_name: string | null;
  total_amount: number;
  payment_status: string;
  booking_status: string;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
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

function formatContact(lead: LeadDetail) {
  if (lead.whatsapp_number && lead.phone && lead.whatsapp_number !== lead.phone) {
    return `${lead.whatsapp_number} / ${lead.phone}`;
  }

  return lead.whatsapp_number || lead.phone || "—";
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const [
    { data: lead, error },
    { data: activities, error: activitiesError },
    { data: followUps, error: followUpsError },
    { data: relatedBooking, error: relatedBookingError },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select(
        `
          id,
          full_name,
          phone,
          whatsapp_number,
          email,
          source,
          interest_type,
          package_interest,
          status,
          priority,
          budget_idr,
          travel_date_preference,
          party_size,
          notes,
          assigned_to,
          campaign_id,
          lead_date,
          lead_temperature,
          snooze_until,
          metadata,
          created_at,
          updated_at,
          campaigns (
            name
          ),
          profiles!leads_assigned_to_fkey (
            full_name
          )
        `,
      )
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("lead_activities")
      .select(
        "id, activity_type, title, body, occurred_at, metadata, profiles:actor_id(full_name)",
      )
      .eq("lead_id", id)
      .eq("organization_id", profile.organization_id)
      .order("occurred_at", { ascending: false }),
    supabase
      .from("follow_up_tasks")
      .select("id, title, description, due_date, status, created_by")
      .eq("lead_id", id)
      .eq("organization_id", profile.organization_id)
      .order("due_date", { ascending: true }),
    supabase
      .from("bookings")
      .select("id, booking_code, package_name, total_amount, payment_status, booking_status")
      .eq("lead_id", id)
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (error || activitiesError || followUpsError || relatedBookingError) {
    throw new Error("Gagal memuat detail lead.");
  }

  if (!lead) {
    notFound();
  }

  const detail = lead as LeadDetail;
  const activityRows = (activities ?? []) as LeadActivityRow[];
  const followUpTasks = (followUps ?? []) as FollowUpTask[];
  const booking = relatedBooking as RelatedBooking | null;
  let bookingPaymentSummary: {
    outstandingBalance: number;
    lastPaymentDate: string | null;
  } | null = null;

  if (booking) {
    const { data: bookingPayments, error: bookingPaymentsError } = await supabase
      .from("booking_payments")
      .select("payment_type, amount, payment_date")
      .eq("booking_id", booking.id)
      .order("payment_date", { ascending: false, nullsFirst: false });

    if (bookingPaymentsError) {
      throw new Error("Gagal memuat data pembayaran booking.");
    }

    bookingPaymentSummary = buildBookingPaymentTotals(
      Number(booking.total_amount),
      bookingPayments ?? [],
    );
  }

  const assignedToLabel = formatAssignedUserLabel(
    getLeadAssigneeName(detail.profiles),
  );

  const conversationContext = await loadLeadConversationContext(
    supabase,
    profile.organization_id,
    detail,
  );

  const timelineActivities = mapActivitiesForTimeline(activityRows);
  const timelineEvents = buildExtendedLeadTimeline({
    leadId: detail.id,
    leadCreatedAt: detail.created_at,
    leadMetadata: detail.metadata,
    activities: timelineActivities,
    conversation: conversationContext,
  });

  const followUpHistory = buildLeadFollowUpHistory(
    followUpTasks,
    activityRows,
    getLeadAssigneeName(detail.profiles),
  );

  const { data: selectedPackage } = detail.package_interest
    ? await supabase
        .from("packages")
        .select("name, destination, departure_date, duration_days, price_idr, quota")
        .eq("organization_id", profile.organization_id)
        .eq("name", detail.package_interest)
        .maybeSingle()
    : { data: null };

  const bookingReadiness = buildBookingReadiness(
    detail,
    Boolean(selectedPackage),
  );

  const healthScore = calculateLeadHealthScore({
    assignedTo: detail.assigned_to,
    updatedAt: detail.updated_at,
    status: detail.status,
    followUpTaskCount: followUpTasks.filter((task) => task.status !== "completed")
      .length,
  });

  const leadTemperature = getEffectiveLeadTemperature({
    lead_temperature: detail.lead_temperature,
    status: detail.status,
    updated_at: detail.updated_at,
  });

  const leadIntelligence = resolveLeadIntelligenceFromLeadData({
    metadata: detail.metadata,
    updatedAt: detail.updated_at,
    status: detail.status,
    notes: detail.notes,
    leadTemperature: detail.lead_temperature,
    packageInterest: detail.package_interest,
    activities: activityRows.map((activity) => ({
      activity_type: activity.activity_type,
      title: activity.title,
      body: activity.body,
      occurred_at: activity.occurred_at,
    })),
    followUpTasks,
  });

  const hasPendingRecommendedTask = hasPendingRecommendedFollowUpTask(
    detail.status,
    followUpTasks,
  );

  const quotationText = selectedPackage
    ? `Assalamualaikum ${detail.full_name},

Terima kasih atas ketertarikannya pada paket:

${selectedPackage.name}

Destinasi:
${selectedPackage.destination ?? "-"}

Durasi:
${selectedPackage.duration_days ? `${selectedPackage.duration_days} Hari` : "-"}

Tanggal Keberangkatan:
${
  selectedPackage.departure_date
    ? formatDate(selectedPackage.departure_date)
    : "-"
}

Harga:
${
  selectedPackage.price_idr != null
    ? formatCurrency(selectedPackage.price_idr)
    : "-"
}

Kuota:
${selectedPackage.quota ?? "-"} pax

Apabila berkenan, kami siap membantu proses reservasi dan menjawab pertanyaan lebih lanjut.

Terima kasih.`
    : "";

  const createBookingAction = (
    <form action={convertLeadToBooking}>
      <input type="hidden" name="lead_id" value={detail.id} />
      <button
        type="submit"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        Create booking
      </button>
    </form>
  );

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 overflow-x-hidden pb-24 lg:pb-0">
      {query?.error ? (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(query.error)}
        </div>
      ) : null}

      {query?.success ? (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          {decodeURIComponent(query.success)}
        </div>
      ) : null}

      <LeadDetailHeader
        leadId={detail.id}
        fullName={detail.full_name}
        status={detail.status}
        source={detail.source}
        assignedToLabel={assignedToLabel}
        createdAtLabel={formatDateTime(detail.created_at)}
        leadTemperature={leadTemperature}
        conversationHref={conversationContext?.inboxHref ?? null}
        hasBooking={Boolean(booking)}
        createBookingAction={createBookingAction}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <LeadDetailSummaryCard
            phone={formatContact(detail)}
            email={detail.email || "—"}
            destinationInterest={detail.package_interest || "—"}
            travelDate={
              detail.travel_date_preference
                ? formatDate(detail.travel_date_preference)
                : "—"
            }
            pax={detail.party_size != null ? String(detail.party_size) : "—"}
            budgetLabel={
              detail.budget_idr != null
                ? formatCurrency(detail.budget_idr)
                : "—"
            }
            packageInterest={detail.package_interest || "—"}
            leadScore={healthScore.score}
            leadScoreBadge={healthScore.badge}
            intentLevel={leadTemperature.value}
            intentSuggested={leadTemperature.isSuggested}
            notes={detail.notes || "—"}
          />

          {conversationContext ? (
            <LeadConversationContextCard
              channelLabel={conversationContext.channelLabel}
              customerName={conversationContext.customerName}
              status={conversationContext.status}
              lastMessageAtLabel={
                conversationContext.lastMessageAt
                  ? formatDateTime(conversationContext.lastMessageAt)
                  : "—"
              }
              inboxHref={conversationContext.inboxHref}
              messages={conversationContext.recentMessages.map((message) => ({
                ...message,
                createdAtLabel: formatLeadTimelineDateTime(message.createdAt),
              }))}
            />
          ) : null}

          <LeadTimelineCard
            leadId={detail.id}
            events={timelineEvents}
            createLeadActivity={createLeadActivity}
          />

          {booking ? (
            <Card>
              <CardHeader>
                <CardTitle>Related booking</CardTitle>
                <CardDescription>
                  This lead has been converted to a booking.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">Booking code</dt>
                    <dd className="text-sm font-medium">
                      {booking.booking_code || booking.id}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Package</dt>
                    <dd className="text-sm font-medium">
                      {booking.package_name || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Payment</dt>
                    <dd>
                      <PaymentStatusBadge status={booking.payment_status} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">
                      Outstanding balance
                    </dt>
                    <dd className="text-sm font-medium">
                      {bookingPaymentSummary
                        ? formatCurrency(bookingPaymentSummary.outstandingBalance)
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">
                      Last payment date
                    </dt>
                    <dd className="text-sm font-medium">
                      {bookingPaymentSummary?.lastPaymentDate
                        ? formatDate(bookingPaymentSummary.lastPaymentDate)
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Status</dt>
                    <dd className="text-sm font-medium capitalize">
                      {formatLabel(booking.booking_status)}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4">
                  <Link
                    href={`/bookings/${booking.id}`}
                    className={cn(buttonVariants({ size: "sm" }))}
                  >
                    View booking
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <LeadBookingReadinessCard
            readiness={bookingReadiness}
            leadId={detail.id}
            hasBooking={Boolean(booking)}
            createBookingAction={createBookingAction}
          />

          <LeadFollowUpHistoryCard
            followUpTasks={followUpHistory}
            leadId={detail.id}
            completeFollowUpTask={completeFollowUpTask}
          />

          <Card id="create-follow-up">
            <CardHeader>
              <CardTitle>Create follow up</CardTitle>
              <CardDescription>
                Schedule a reminder for this lead.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createFollowUpTask} className="space-y-4">
                <input type="hidden" name="lead_id" value={detail.id} />
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
                  className={cn(buttonVariants({ size: "sm" }), "w-full")}
                >
                  Save follow up
                </button>
              </form>
            </CardContent>
          </Card>

          <LeadHealthScoreCard healthScore={healthScore} />

          <AiFollowUpAssistantCard leadId={detail.id} />

          <AiSalesIntelligenceCard
            leadId={detail.id}
            fullName={detail.full_name}
            packageInterest={detail.package_interest}
            whatsappNumber={detail.whatsapp_number}
            phone={detail.phone}
            status={detail.status}
            updatedAt={detail.updated_at}
            hasPendingRecommendedTask={hasPendingRecommendedTask}
            createFollowUpFromRecommendation={createFollowUpFromRecommendation}
            initialIntelligence={leadIntelligence}
          />

          <QuotationCard
            leadId={detail.id}
            selectedPackage={selectedPackage}
            quotationText={quotationText}
            contactPhone={formatContact(detail)}
          />

          <SnoozeLeadCard leadId={detail.id} snoozeUntil={detail.snooze_until} />
        </div>
      </div>
    </div>
  );
}
