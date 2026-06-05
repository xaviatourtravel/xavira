import Link from "next/link";
import { notFound } from "next/navigation";

import {
  createLeadActivity,
  createFollowUpTask,
  completeFollowUpTask,
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
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";
import { QuotationCard } from "@/components/leads/quotation-card";
import { AiFollowUpCard } from "@/components/leads/ai-follow-up-card";

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
  created_at: string;
};

type LeadActivity = {
  id: string;
  activity_type: string;
  title: string | null;
  body: string | null;
  occurred_at: string;
  profiles:
    | {
        full_name: string | null;
      }
    | {
        full_name: string | null;
      }[]
    | null;
};
type FollowUpTask = {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  status: string;
};

function getActorName(activity: LeadActivity) {
  if (!activity.profiles) {
    return "Sistem";
  }

  if (Array.isArray(activity.profiles)) {
    return activity.profiles[0]?.full_name ?? "Sistem";
  }

  return activity.profiles.full_name ?? "Sistem";
}

const inputClassName =
  "mt-1 w-full rounded-md border px-3 py-2 text-sm";

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
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const [
    { data: lead, error },
    { data: activities, error: activitiesError },
    { data: followUps, error: followUpsError },
  ] = await Promise.all([
      supabase
        .from("leads")
        .select(
          "id, full_name, phone, whatsapp_number, email, source, interest_type, package_interest, status, priority, budget_idr, travel_date_preference, party_size, notes, created_at",
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
    ]);

  if (error || activitiesError || followUpsError) {
    throw new Error("Gagal memuat detail lead.");
  }

  if (!lead) {
    notFound();
  }

  const detail = lead as LeadDetail;
  const timeline = (activities ?? []) as LeadActivity[];
  const followUpTasks = (followUps ?? []) as FollowUpTask[];
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
    <div className="mx-auto max-w-3xl space-y-6">
      {query?.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(query.error)}
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
</div>

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
              label="Sumber"
              value={<span className="capitalize">{formatLabel(detail.source)}</span>}
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

<Card>
  <CardHeader>
    <CardTitle>Follow Up Terjadwal</CardTitle>
    <CardDescription>
      Daftar follow up yang harus dilakukan.
    </CardDescription>
  </CardHeader>

  <CardContent>
    {followUpTasks.length === 0 ? (
      <p className="text-sm text-muted-foreground">
        Belum ada follow up terjadwal.
      </p>
    ) : (
      <div className="space-y-3">
        {followUpTasks.map((task) => (
          <div
            key={task.id}
            className="rounded-lg border p-4"
          >
            <div className="flex items-center justify-between gap-2">
  <div>
    <h4 className="font-medium">
      {task.title}
    </h4>
  </div>

  <div className="flex items-center gap-2">

    <span className="text-xs rounded bg-slate-100 px-2 py-1">
      {task.status}
    </span>

    {task.status !== "completed" && (
      <form action={completeFollowUpTask}>
        <input
          type="hidden"
          name="lead_id"
          value={detail.id}
        />

        <input
          type="hidden"
          name="task_id"
          value={task.id}
        />

        <button
          type="submit"
          className="rounded bg-green-600 px-2 py-1 text-xs text-white"
        >
          ✓ Selesai
        </button>
      </form>
    )}

  </div>
</div>

            {task.description && (
              <p className="mt-2 text-sm text-muted-foreground">
                {task.description}
              </p>
            )}

            <p className="mt-2 text-xs text-muted-foreground">
              {formatDateTime(task.due_date)}
            </p>
          </div>
        ))}
      </div>
    )}
  </CardContent>
</Card>
      
      
      <Card>
        <CardHeader>
          <CardTitle>Aktivitas</CardTitle>
          <CardDescription>Riwayat interaksi dan catatan untuk lead ini.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form action={createLeadActivity} className="space-y-4 rounded-lg border p-4">
            <input type="hidden" name="lead_id" value={detail.id} />

            <div>
              <label className="text-sm font-medium">Jenis Aktivitas</label>
              <select
                name="activity_type"
                defaultValue="note"
                className={inputClassName}
              >
                <option value="note">Catatan</option>
                <option value="call">Telepon</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Judul</label>
              <input
                name="title"
                className={inputClassName}
                placeholder="Contoh: Follow up harga paket"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Isi</label>
              <textarea
                name="body"
                rows={3}
                className={inputClassName}
                placeholder="Tulis detail aktivitas..."
              />
            </div>

            <button type="submit" className={cn(buttonVariants({ size: "sm" }))}>
              Tambah Aktivitas
            </button>
          </form>

          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada aktivitas untuk lead ini.
            </p>
          ) : (
            <ul className="space-y-4">
              {timeline.map((activity) => (
                <li key={activity.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium capitalize">
                      {formatLabel(activity.activity_type)}
                      {activity.title ? `: ${activity.title}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(activity.occurred_at)}
                    </p>
                  </div>
                  {activity.body && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                      {activity.body}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    oleh {getActorName(activity)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
