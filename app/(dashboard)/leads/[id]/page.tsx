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
import { requireProfile } from "@/lib/auth/session";
import {
  formatAssignedUserLabel,
  getLeadAssigneeName,
} from "@/lib/leads/assignment";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";
import { PaymentStatusBadge } from "@/components/bookings/payment-status-badge";
import { QuotationCard } from "@/components/leads/quotation-card";
import { AiFollowUpCard } from "@/components/leads/ai-follow-up-card";
import { AiRecommendationCard } from "@/components/leads/ai-recommendation-card";
import { hasPendingRecommendedFollowUpTask } from "@/lib/leads/next-best-action";
import { calculateLeadHealthScore } from "@/lib/leads/health-score";
import { formatLeadSourceLabel } from "@/lib/leads/source-tracking";
import { LeadHealthScoreCard } from "@/components/leads/lead-health-score-card";
import { FollowUpTasksCard } from "@/components/leads/follow-up-tasks-card";
import {
  ActivityTimelineCard,
  type LeadActivityItem,
} from "@/components/leads/activity-timeline-card";

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
  created_at: string;
  updated_at: string;
  profiles: { full_name: string | null } | { full_name: string | null }[] | null;
};

type FollowUpTask = {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  status: string;
};

type RelatedBooking = {
  id: string;
  booking_code: string | null;
  package_name: string | null;
  payment_status: string;
  booking_status: string;
};


function formatLabel(value: string) {
  return value.replace(/_/g, " ");
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
    dateStyle: "long",
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

  return lead.whatsapp_number || lead.phone || "-";
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
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
          created_at,
          updated_at,
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
          "id, activity_type, title, body, occurred_at, profiles:actor_id(full_name)",
        )
        .eq("lead_id", id)
        .eq("organization_id", profile.organization_id)
        .order("occurred_at", { ascending: false }),
        supabase
  .from("follow_up_tasks")
  .select("id, title, description, due_date, status")
  .eq("lead_id", id)
  .eq("organization_id", profile.organization_id)
  .order("due_date", { ascending: true }),
      supabase
        .from("bookings")
        .select("id, booking_code, package_name, payment_status, booking_status")
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
  const timeline = (activities ?? []) as LeadActivityItem[];
  const followUpTasks = (followUps ?? []) as FollowUpTask[];
  const booking = relatedBooking as RelatedBooking | null;
  const hasPendingRecommendedTask = hasPendingRecommendedFollowUpTask(
    detail.status,
    followUpTasks,
  );
  const healthScore = calculateLeadHealthScore({
    assignedTo: detail.assigned_to,
    updatedAt: detail.updated_at,
    status: detail.status,
    followUpTaskCount: followUpTasks.length,
  });
  const { data: selectedPackage } = detail.package_interest
  ? await supabase
      .from("packages")
      .select("name, destination, departure_date, duration_days, price_idr, quota")
      .eq("organization_id", profile.organization_id)
      .eq("name", detail.package_interest)
      .maybeSingle()
  : { data: null };

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

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-6">
      {query?.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(query.error)}
        </div>
      )}

      {query?.success && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          {decodeURIComponent(query.success)}
        </div>
      )}

      <div className="flex gap-2">
  <Link
    href="/leads"
    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
  >
    Kembali
  </Link>

  <Link
    href={`/leads/${detail.id}/edit`}
    className={cn(buttonVariants({ size: "sm" }))}
  >
    Edit Lead
  </Link>

  {!booking && (
    <form action={convertLeadToBooking}>
      <input type="hidden" name="lead_id" value={detail.id} />
      <button
        type="submit"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        Convert to Booking
      </button>
    </form>
  )}
</div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
      <Card>
        <CardHeader>
          <CardTitle>{detail.full_name}</CardTitle>
          <div className="mt-3">
  {formatContact(detail) !== "-" && (
    <a
      href={`https://wa.me/${formatContact(detail).replace(/\D/g, "")}`}
      target="_blank"
      rel="noreferrer"
      className="inline-flex rounded bg-green-600 px-3 py-2 text-sm text-white"
    >
      Buka WhatsApp
    </a>
  )}
</div>
          <CardDescription>Detail lead</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-5 sm:grid-cols-2">
            <DetailItem label="WhatsApp / Telepon" value={formatContact(detail)} />
            <DetailItem label="Email" value={detail.email || "-"} />
            <DetailItem
              label="Lead Source"
              value={formatLeadSourceLabel(detail.source)}
            />
            <DetailItem
              label="Minat"
              value={
                <span className="capitalize">{formatLabel(detail.interest_type)}</span>
              }
            />
            <DetailItem
              label="Paket Diminati"
              value={detail.package_interest || "-"}
            />
            <DetailItem
              label="Status"
              value={<span className="capitalize">{formatLabel(detail.status)}</span>}
            />
            <DetailItem
              label="Prioritas"
              value={<span className="capitalize">{formatLabel(detail.priority)}</span>}
            />
            <DetailItem
              label="Assigned User"
              value={formatAssignedUserLabel(
                getLeadAssigneeName(detail.profiles),
              )}
            />
            <DetailItem
              label="Budget"
              value={
                detail.budget_idr != null
                  ? formatCurrency(detail.budget_idr)
                  : "-"
              }
            />
            <DetailItem
              label="Tanggal Keberangkatan"
              value={
                detail.travel_date_preference
                  ? formatDate(detail.travel_date_preference)
                  : "-"
              }
            />
            <DetailItem
              label="Jumlah Peserta"
              value={detail.party_size ?? "-"}
            />
            <DetailItem
              label="Dibuat"
              value={formatDateTime(detail.created_at)}
            />
            <div className="space-y-1 sm:col-span-2">
              <dt className="text-sm text-muted-foreground">Catatan</dt>
              <dd className="whitespace-pre-wrap text-sm font-medium">
                {detail.notes || "-"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {booking && (
        <Card>
          <CardHeader>
            <CardTitle>Booking Terkait</CardTitle>
            <CardDescription>
              Lead ini sudah dikonversi menjadi booking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
              <DetailItem
                label="Booking Code"
                value={booking.booking_code || booking.id}
              />
              <DetailItem
                label="Package Name"
                value={booking.package_name || "-"}
              />
              <DetailItem
                label="Payment Status"
                value={<PaymentStatusBadge status={booking.payment_status} />}
              />
              <DetailItem
                label="Booking Status"
                value={
                  <span className="capitalize">
                    {formatLabel(booking.booking_status)}
                  </span>
                }
              />
            </dl>

            <div className="mt-4">
              <Link
                href={`/bookings/${booking.id}`}
                className={cn(buttonVariants({ size: "sm" }))}
              >
                Lihat Booking
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <ActivityTimelineCard
        leadId={detail.id}
        timeline={timeline}
        createLeadActivity={createLeadActivity}
      />
        </div>

        <div className="space-y-6 lg:col-span-1">
      <LeadHealthScoreCard healthScore={healthScore} />

      <AiRecommendationCard
        leadId={detail.id}
        fullName={detail.full_name}
        packageInterest={detail.package_interest}
        whatsappNumber={detail.whatsapp_number}
        phone={detail.phone}
        status={detail.status}
        updatedAt={detail.updated_at}
        hasPendingRecommendedTask={hasPendingRecommendedTask}
        createFollowUpFromRecommendation={createFollowUpFromRecommendation}
      />

      <QuotationCard
        leadId={detail.id}
        selectedPackage={selectedPackage}
        quotationText={quotationText}
        contactPhone={formatContact(detail)}
      />

<AiFollowUpCard leadId={detail.id} />
      
      <Card>
  <CardHeader>
    <CardTitle>Jadwalkan Follow Up</CardTitle>
    <CardDescription>
      Buat pengingat follow up untuk lead ini.
    </CardDescription>
  </CardHeader>

  <CardContent>
    <form action={createFollowUpTask} className="space-y-4">

      <input
        type="hidden"
        name="lead_id"
        value={detail.id}
      />

      <div>
        <label className="text-sm font-medium">
          Judul
        </label>

        <input
          name="title"
          required
          placeholder="Telepon kembali"
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </div>

      <div>
        <label className="text-sm font-medium">
          Tanggal Follow Up
        </label>

        <input
          type="datetime-local"
          name="due_date"
          required
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </div>

      <div>
        <label className="text-sm font-medium">
          Catatan
        </label>

        <textarea
          name="description"
          rows={3}
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </div>

      <button
        type="submit"
        className="rounded-md bg-blue-600 px-4 py-2 text-white"
      >
        Simpan Follow Up
      </button>

    </form>
  </CardContent>
</Card>

<FollowUpTasksCard
  leadId={detail.id}
  followUpTasks={followUpTasks}
  completeFollowUpTask={completeFollowUpTask}
/>
        </div>
      </div>
    </div>
  );
}
