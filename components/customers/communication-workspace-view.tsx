"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  Bot,
  CreditCard,
  FolderOpen,
  MessageCircle,
  Phone,
  Plus,
  Sparkles,
  Tag,
} from "lucide-react";

import {
  convertLeadToBooking,
  createCustomerFollowUp,
  createCustomerNote,
} from "@/lib/actions/customer";
import { Button, buttonVariants } from "@/components/ui/button";
import { DesklabsAvatar } from "@/components/ui/desklabs-avatar";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import {
  AI_SUMMARY_DISCLAIMER,
  buildCommunicationAiRecommendation,
  buildCommunicationFeed,
  buildCommunicationPreviewMessages,
  buildCustomerContactHref,
  buildCustomerTags,
  buildCustomerWorkspaceFiles,
  buildCustomerWorkspaceNotes,
  buildLatestConversationMessage,
  buildStructuredAiSummary,
  buildUpcomingActivityLabel,
  formatAiUrgencyLabel,
  formatCommunicationCurrency,
  formatCommunicationDate,
  formatCommunicationDateTime,
  formatCustomerLeadStatus,
  getCommunicationFeedCategoryMeta,
  type CommunicationFeedItem,
  type CommunicationPreviewMessage,
  type CustomerWorkspaceFileGroup,
} from "@/lib/customers/communication-workspace";
import { customerWorkspaceHref } from "@/lib/customers/routes";
import type { CustomerWorkspaceData } from "@/lib/customers/load-customer-workspace";
import type { LeadFollowUpHistoryItem } from "@/lib/leads/lead-customer-360";
import { cn } from "@/lib/utils";
type CommunicationWorkspaceViewProps = {
  data: CustomerWorkspaceData;
};

const inputClassName =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200";

function WorkspaceSection({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6",
        className,
      )}
    >
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-base font-semibold text-slate-950">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function SidebarCard({
  title,
  children,
  compact = false,
}: {
  title: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn(compact ? "space-y-1.5" : "rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm")}>
      {!compact ? (
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          {title}
        </p>
      ) : (
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          {title}
        </p>
      )}
      <div className={cn(!compact && "mt-3")}>{children}</div>
    </div>
  );
}

function WorkspaceContextPanel({
  data,
  tags,
  aiRecommendation,
  upcomingActivity,
  contactHref,
  returnTo,
  primaryBooking,
}: {
  data: CustomerWorkspaceData;
  tags: string[];
  aiRecommendation: ReturnType<typeof buildCommunicationAiRecommendation>;
  upcomingActivity: ReturnType<typeof buildUpcomingActivityLabel>;
  contactHref: string | null;
  returnTo: string;
  primaryBooking: CustomerWorkspaceData["bookings"][0] | null;
}) {
  return (
    <aside className="xl:sticky xl:top-6 xl:self-start">
      <div className="flex max-h-[500px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Konteks Customer
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Skor Closing
              </p>
              <p className="text-2xl font-semibold tabular-nums text-slate-950">
                {data.healthScore.score}
                <span className="ml-1 text-sm font-normal text-slate-500">/ 100</span>
              </p>
            </div>
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                aiRecommendation.urgency === "tinggi"
                  ? "bg-red-100 text-red-800"
                  : aiRecommendation.urgency === "sedang"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800",
              )}
            >
              {formatAiUrgencyLabel(aiRecommendation.urgency)}
            </span>
          </div>

          <SidebarCard title="Penanggung Jawab" compact>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <DesklabsAvatar name={data.lead.assignedToLabel} size="xs" />
              <span className="truncate">{data.lead.assignedToLabel}</span>
            </div>
          </SidebarCard>

          <SidebarCard title="Tag" compact>
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </span>
              ))}
            </div>
          </SidebarCard>

          <SidebarCard title="Follow Up Berikutnya" compact>
            {data.nextFollowUp || upcomingActivity ? (
              <div className="space-y-1">
                <p className="line-clamp-2 text-sm font-medium text-slate-900">
                  {data.nextFollowUp?.title ?? upcomingActivity?.title}
                </p>
                <p className="text-xs text-slate-500">
                  {data.nextFollowUp
                    ? formatCommunicationDateTime(data.nextFollowUp.dueDate)
                    : upcomingActivity?.subtitle}
                </p>
                {data.nextFollowUp?.isOverdue ? (
                  <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-800">
                    Terlambat
                  </span>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Belum ada follow up terjadwal.</p>
            )}
          </SidebarCard>

          <SidebarCard title="Rekomendasi AI" compact>
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-medium text-slate-900">
                  {aiRecommendation.headline}
                </p>
                <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-slate-600">
                  {aiRecommendation.detail}
                </p>
              </div>
            </div>
          </SidebarCard>
        </div>

        <div className="space-y-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Aksi Cepat
          </p>
          <div className="grid gap-2">
            {contactHref ? (
              <a
                href={contactHref}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "h-9 w-full justify-center gap-2",
                )}
              >
                <Phone className="h-3.5 w-3.5" />
                Hubungi Customer
              </a>
            ) : (
              <Button disabled size="sm" className="h-9 w-full gap-2">
                <Phone className="h-3.5 w-3.5" />
                Hubungi Customer
              </Button>
            )}
            {primaryBooking ? (
              <>
                <Link
                  href={`/bookings/${primaryBooking.id}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "h-9 w-full justify-center gap-2",
                  )}
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  Kelola Pembayaran
                </Link>
                <Link
                  href={`/bookings/${primaryBooking.id}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "h-9 w-full justify-center gap-2",
                  )}
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Buka Booking
                </Link>
              </>
            ) : (
              <div className="w-full">
                <BookingFormButton
                  leadId={data.lead.id}
                  returnTo={returnTo}
                  label="Buat Booking"
                />
              </div>
            )}
            {data.conversationHref ? (
              <Link
                href={data.conversationHref}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "h-9 w-full justify-center gap-2",
                )}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Buka Inbox
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}

function EmptyState({
  message,
  action,
}: {
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-center">
      <p className="text-sm text-slate-600">{message}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

function FeedIcon({ category }: { category: CommunicationFeedItem["category"] }) {
  const tone = getCommunicationFeedCategoryMeta(category).tone;

  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-semibold",
        tone,
      )}
    >
      {getCommunicationFeedCategoryMeta(category).label.slice(0, 2).toUpperCase()}
    </span>
  );
}

function TimelineFeed({ items }: { items: CommunicationFeedItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState message="Belum ada aktivitas. Aktivitas customer akan muncul di sini." />
    );
  }

  return (
    <ol className="relative space-y-0">
      <div
        aria-hidden
        className="absolute bottom-2 left-[18px] top-2 w-px bg-slate-200"
      />
      {items.slice(0, 15).map((item) => (
        <li key={item.id} className="relative flex gap-4 pb-5 last:pb-0">
          <div className="relative z-10 mt-0.5">
            <FeedIcon category={item.category} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">{item.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-600">
                  {item.description}
                </p>
              </div>
              <time
                dateTime={item.occurredAt}
                className="shrink-0 text-[11px] tabular-nums text-slate-400"
              >
                {formatCommunicationDateTime(item.occurredAt)}
              </time>
            </div>
            <p className="mt-1 text-[11px] font-medium text-slate-400">
              {getCommunicationFeedCategoryMeta(item.category).label}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function ConversationPreview({
  customerName,
  messages,
  channelLabel,
  hasConversation,
  latestMessage,
  conversationHref,
}: {
  customerName: string;
  messages: CommunicationPreviewMessage[];
  channelLabel: string;
  hasConversation: boolean;
  latestMessage: ReturnType<typeof buildLatestConversationMessage>;
  conversationHref: string | null;
}) {
  if (!hasConversation) {
    return (
      <div className="space-y-4">
        <EmptyState message="Belum ada percakapan tercatat. Hubungi customer untuk memulai komunikasi." />
        <DisabledReplyComposer channelLabel={channelLabel} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/60">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 bg-white px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">{customerName}</p>
            <p className="text-xs text-slate-500">Sumber: {channelLabel}</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-800">
            Terhubung
          </span>
        </div>

        {latestMessage ? (
          <div className="border-b border-slate-200/80 bg-white px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Pesan terakhir
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-800">{latestMessage.text}</p>
            <p className="mt-1 text-xs text-slate-500">
              {latestMessage.direction === "incoming" ? "Masuk" : "Keluar"} ·{" "}
              {formatCommunicationDateTime(latestMessage.createdAt)}
            </p>
          </div>
        ) : null}

        <div className="space-y-3 px-4 py-4">
          {messages.map((message) => {
            const isOutgoing = message.direction === "outgoing";

            return (
              <div
                key={message.id}
                className={cn("flex", isOutgoing ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
                    isOutgoing
                      ? "rounded-br-md bg-slate-950 text-white"
                      : "rounded-bl-md border border-slate-200/80 bg-white text-slate-800",
                  )}
                >
                  <p>{message.text}</p>
                  <p
                    className={cn(
                      "mt-1 text-[10px] tabular-nums",
                      isOutgoing ? "text-slate-300" : "text-slate-400",
                    )}
                  >
                    {formatCommunicationDateTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <DisabledReplyComposer channelLabel={channelLabel} />

      {conversationHref ? (
        <Link
          href={conversationHref}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full gap-2 sm:w-auto")}
        >
          <MessageCircle className="h-4 w-4" />
          Buka Inbox Lengkap
        </Link>
      ) : null}
    </div>
  );
}

function DisabledReplyComposer({ channelLabel }: { channelLabel: string }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-3">
      <textarea
        disabled
        rows={2}
        placeholder={`Balas via ${channelLabel}...`}
        className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-400"
      />
      <p className="mt-2 text-xs text-slate-500">
        Balasan langsung akan tersedia setelah integrasi channel aktif.
      </p>
    </div>
  );
}

function TaskList({
  tasks,
  leadId,
  returnTo,
}: {
  tasks: LeadFollowUpHistoryItem[];
  leadId: string;
  returnTo: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const customerTasks = tasks.filter((task) => task.isPending || task.isOverdue);

  if (customerTasks.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState message="Tidak ada tugas aktif untuk customer ini." />
        {showForm ? (
          <form action={createCustomerFollowUp} className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/40 p-4">
            <input type="hidden" name="lead_id" value={leadId} />
            <input type="hidden" name="return_to" value={returnTo} />
            <p className="text-sm font-medium text-slate-900">Tambah tugas tindak lanjut</p>
            <div>
              <label className="text-xs font-medium text-slate-600">Judul tugas</label>
              <input
                name="title"
                required
                placeholder="Contoh: Hubungi ulang customer"
                className={inputClassName}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Jatuh tempo</label>
              <input
                type="datetime-local"
                name="due_date"
                required
                className={inputClassName}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Catatan</label>
              <textarea
                name="description"
                rows={2}
                placeholder="Detail tugas..."
                className={inputClassName}
              />
            </div>
            <FormSubmitButton type="submit" size="sm" className="w-full gap-2" loadingLabel="Menyimpan...">
              <Plus className="h-4 w-4" />
              Simpan Tugas
            </FormSubmitButton>
          </form>
        ) : (
          <div className="flex justify-center">
            <Button type="button" size="sm" className="gap-2" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              Tambah Task
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {customerTasks.slice(0, 5).map((task) => (
        <li
          key={task.id}
          className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-3"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900">{task.title}</p>
            {task.description ? (
              <p className="mt-0.5 text-sm text-slate-600">{task.description}</p>
            ) : null}
            <p className="mt-1 text-xs text-slate-500">
              Jatuh tempo {formatCommunicationDateTime(task.dueDate)}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium",
              task.isOverdue
                ? "bg-red-100 text-red-800"
                : "bg-amber-100 text-amber-800",
            )}
          >
            {task.isOverdue ? "Terlambat" : "Aktif"}
          </span>
        </li>
      ))}
    </ul>
  );
}

function FileGroupSection({ group }: { group: CustomerWorkspaceFileGroup }) {
  if (group.items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/40 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {group.label}
        </p>
        <p className="mt-1 text-sm text-slate-500">Belum ada file.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/40 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {group.label}
      </p>
      <ul className="mt-2 space-y-2">
        {group.items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-500">{item.subtitle}</p>
            </div>
            {item.href ? (
              <a
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "shrink-0 gap-1 px-2")}
              >
                Buka
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function NotesSection({
  leadId,
  notes,
  returnTo,
}: {
  leadId: string;
  notes: ReturnType<typeof buildCustomerWorkspaceNotes>;
  returnTo: string;
}) {
  return (
    <div className="space-y-4">
      {notes.length === 0 ? (
        <EmptyState message="Belum ada catatan internal untuk customer ini." />
      ) : (
        <ul className="space-y-3">
          {notes.slice(0, 6).map((note) => (
            <li
              key={note.id}
              className="rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-slate-900">{note.title}</p>
                <time
                  dateTime={note.occurredAt}
                  className="shrink-0 text-[11px] text-slate-400"
                >
                  {formatCommunicationDateTime(note.occurredAt)}
                </time>
              </div>
              {note.body ? (
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{note.body}</p>
              ) : null}
              <p className="mt-2 text-xs text-slate-500">{note.actorName}</p>
            </li>
          ))}
        </ul>
      )}

      <form
        action={createCustomerNote}
        className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/40 p-4"
      >
        <input type="hidden" name="lead_id" value={leadId} />
        <input type="hidden" name="return_to" value={returnTo} />
        <p className="text-sm font-medium text-slate-900">Tambah catatan internal</p>
        <div>
          <label className="text-xs font-medium text-slate-600">Judul</label>
          <input
            name="title"
            placeholder="Contoh: Preferensi kamar twin"
            className={inputClassName}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Isi catatan</label>
          <textarea
            name="body"
            rows={3}
            required
            placeholder="Tulis catatan untuk tim..."
            className={inputClassName}
          />
        </div>
        <FormSubmitButton type="submit" size="sm" className="gap-2" loadingLabel="Menyimpan...">
          <Plus className="h-4 w-4" />
          Simpan Catatan
        </FormSubmitButton>
      </form>
    </div>
  );
}

const SUMMARY_FIELDS = [
  { key: "minat" as const, label: "Minat customer" },
  { key: "diskusiTerakhir" as const, label: "Diskusi terakhir" },
  { key: "statusTindakLanjut" as const, label: "Status follow up" },
  { key: "statusBooking" as const, label: "Status booking" },
  { key: "statusPembayaran" as const, label: "Status pembayaran" },
];

function BookingFormButton({
  leadId,
  returnTo,
  label,
  variant = "default",
}: {
  leadId: string;
  returnTo: string;
  label: string;
  variant?: "default" | "outline";
}) {
  return (
    <form action={convertLeadToBooking} className="w-full">
      <input type="hidden" name="lead_id" value={leadId} />
      <input type="hidden" name="return_to" value={returnTo} />
      <FormSubmitButton
        type="submit"
        size="sm"
        variant={variant}
        className="h-9 w-full gap-2"
        loadingLabel="Memproses..."
      >
        <Plus className="h-4 w-4" />
        {label}
      </FormSubmitButton>
    </form>
  );
}

export function CommunicationWorkspaceView({ data }: CommunicationWorkspaceViewProps) {
  const feed = buildCommunicationFeed(data);
  const aiSummary = buildStructuredAiSummary(data);
  const aiRecommendation = buildCommunicationAiRecommendation(data);
  const previewMessages = buildCommunicationPreviewMessages(data);
  const latestMessage = buildLatestConversationMessage(data);
  const contactHref = buildCustomerContactHref(data);
  const tags = buildCustomerTags(data);
  const fileGroups = buildCustomerWorkspaceFiles(data);
  const notes = buildCustomerWorkspaceNotes(data);
  const upcomingActivity = buildUpcomingActivityLabel(data);
  const primaryBooking = data.bookings[0] ?? null;
  const returnTo = customerWorkspaceHref(data.lead.id);
  const packageLabel =
    data.lead.package_interest ?? primaryBooking?.package_name ?? "Belum ada minat paket";
  const channelLabel = data.conversationDetail?.channelLabel ?? "WhatsApp";
  const hasConversation = Boolean(data.conversationDetail?.messages.length);
  const hasPayments = data.payments.length > 0 || data.metrics.totalPaid > 0;
  const paymentDueDate =
    primaryBooking?.departure_date ?? data.lead.travel_date_preference ?? null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-10">
      <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-[linear-gradient(to_bottom_right,#ffffff,#f8fafc)] p-6 shadow-sm sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-violet-100/50 blur-3xl"
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 space-y-4">
            <p className="text-sm font-medium text-violet-700">Ruang Kerja Customer</p>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <DesklabsAvatar name={data.lead.full_name} size="xl" />
                <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  {data.lead.full_name}
                </h1>
              </div>
            </div>

            <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <p>
                <span className="font-medium text-slate-900">Tahap:</span>{" "}
                {formatCustomerLeadStatus(data.lead.status)}
              </p>
              <p>
                <span className="font-medium text-slate-900">Minat paket:</span>{" "}
                {packageLabel}
              </p>
              <p>
                <span className="font-medium text-slate-900">Penanggung jawab:</span>{" "}
                {data.lead.assignedToLabel}
              </p>
              <p>
                <span className="font-medium text-slate-900">Aktivitas terakhir:</span>{" "}
                {data.lastActivityAt
                  ? formatCommunicationDateTime(data.lastActivityAt)
                  : "Belum ada"}
              </p>
            </div>
          </div>

          {contactHref ? (
            <a
              href={contactHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-md bg-slate-950 px-6 text-sm font-medium text-white transition-colors hover:bg-slate-800 sm:w-auto"
            >
              <Phone className="h-4 w-4" />
              Hubungi Customer
            </a>
          ) : (
            <Button disabled className="h-11 w-full px-6 sm:w-auto">
              <Phone className="h-4 w-4" />
              Hubungi Customer
            </Button>
          )}
        </div>
      </section>

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-8">
          <WorkspaceSection
            eyebrow="Ringkasan"
            title="Ringkasan AI"
            description="Konteks customer dalam satu pandangan."
          >
            <div className="rounded-xl border border-violet-200/60 bg-violet-50/40 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-700 text-white">
                  <Bot className="h-4 w-4" />
                </span>
                <dl className="min-w-0 space-y-3">
                  {SUMMARY_FIELDS.map((field) => (
                    <div key={field.key}>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                        {field.label}
                      </dt>
                      <dd className="mt-0.5 text-sm leading-relaxed text-slate-700">
                        {aiSummary[field.key]}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-emerald-200/70 bg-emerald-50/50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                Rekomendasi berikutnya
              </p>
              <p className="mt-1 text-sm leading-relaxed text-emerald-900">
                {aiSummary.rekomendasi}
              </p>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              {AI_SUMMARY_DISCLAIMER}
            </p>
          </WorkspaceSection>

          <WorkspaceSection
            eyebrow="Komunikasi"
            title="Percakapan"
            description="Preview percakapan tanpa perlu pindah halaman."
          >
            <ConversationPreview
              customerName={data.lead.full_name}
              messages={previewMessages}
              channelLabel={channelLabel}
              hasConversation={hasConversation}
              latestMessage={latestMessage}
              conversationHref={data.conversationHref}
            />
          </WorkspaceSection>
        </div>

        <WorkspaceContextPanel
          data={data}
          tags={tags}
          aiRecommendation={aiRecommendation}
          upcomingActivity={upcomingActivity}
          contactHref={contactHref}
          returnTo={returnTo}
          primaryBooking={primaryBooking}
        />
      </div>

      <div className="space-y-8">
        <WorkspaceSection
          eyebrow="Aktivitas"
          title="Linimasa Bisnis"
          description="Semua aktivitas customer dalam satu urutan kronologis."
        >
          <TimelineFeed items={feed} />
        </WorkspaceSection>

        <div className="grid gap-8 lg:grid-cols-2">
          <WorkspaceSection eyebrow="Operasional" title="Booking">
            {primaryBooking ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { label: "Paket", value: primaryBooking.package_name ?? "Belum diisi" },
                    {
                      label: "Keberangkatan",
                      value: primaryBooking.departure_date
                        ? formatCommunicationDate(primaryBooking.departure_date)
                        : "Belum dijadwalkan",
                    },
                    { label: "Jumlah pax", value: String(primaryBooking.total_pax) },
                    {
                      label: "Status",
                      value: formatCustomerLeadStatus(primaryBooking.booking_status),
                    },
                    {
                      label: "Nilai booking",
                      value: formatCommunicationCurrency(Number(primaryBooking.total_amount)),
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-3"
                    >
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Link
                    href={`/bookings/${primaryBooking.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
                  >
                    Buka Booking
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </>
            ) : (
              <EmptyState
                message="Belum ada booking untuk customer ini."
                action={
                  <BookingFormButton
                    leadId={data.lead.id}
                    returnTo={returnTo}
                    label="Buat Booking"
                  />
                }
              />
            )}
          </WorkspaceSection>

          <WorkspaceSection eyebrow="Keuangan" title="Pembayaran">
            {hasPayments ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Terbayar
                    </p>
                    <p className="mt-1 text-sm font-semibold tabular-nums text-slate-950">
                      {formatCommunicationCurrency(data.metrics.totalPaid)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Sisa tagihan
                    </p>
                    <p className="mt-1 text-sm font-semibold tabular-nums text-slate-950">
                      {formatCommunicationCurrency(data.metrics.outstandingBalance)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Jatuh tempo
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {paymentDueDate
                        ? formatCommunicationDate(paymentDueDate)
                        : "Belum ditentukan"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Status pembayaran
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {data.metrics.outstandingBalance > 0 ? "Belum lunas" : "Lunas"}
                    </p>
                  </div>
                </div>
                {primaryBooking ? (
                  <div className="mt-4">
                    <Link
                      href={`/bookings/${primaryBooking.id}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
                    >
                      <CreditCard className="h-4 w-4" />
                      Kelola Pembayaran
                    </Link>
                  </div>
                ) : null}
              </>
            ) : (
              <EmptyState
                message="Belum ada pembayaran tercatat."
                action={
                  primaryBooking ? (
                    <Link
                      href={`/bookings/${primaryBooking.id}`}
                      className={cn(buttonVariants({ size: "sm" }), "w-full gap-2 sm:w-auto")}
                    >
                      <Plus className="h-4 w-4" />
                      Buat Invoice
                    </Link>
                  ) : (
                    <BookingFormButton
                      leadId={data.lead.id}
                      returnTo={returnTo}
                      label="Buat booking dulu untuk tagihan"
                      variant="outline"
                    />
                  )
                }
              />
            )}
          </WorkspaceSection>
        </div>

        <WorkspaceSection
          eyebrow="Tindak Lanjut"
          title="Tugas"
          description="Tugas yang terkait langsung dengan customer ini."
        >
          <TaskList tasks={data.followUpHistory} leadId={data.lead.id} returnTo={returnTo} />
        </WorkspaceSection>

        <WorkspaceSection
          eyebrow="Dokumen"
          title="File"
          description="Paspor, tagihan, rencana perjalanan, dan dokumen lainnya."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {fileGroups.map((group) => (
              <FileGroupSection key={group.category} group={group} />
            ))}
          </div>
          {fileGroups.every((group) => group.items.length === 0) ? (
            <div className="mt-4">
              {primaryBooking ? (
                <Link
                  href={`/bookings/${primaryBooking.id}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
                >
                  <FolderOpen className="h-4 w-4" />
                  Kelola Dokumen di Booking
                </Link>
              ) : (
                <p className="text-xs text-slate-500">
                  Upload dokumen setelah booking dibuat.
                </p>
              )}
            </div>
          ) : null}
        </WorkspaceSection>

        <WorkspaceSection
          eyebrow="Internal"
          title="Catatan"
          description="Catatan internal untuk koordinasi tim."
        >
          <NotesSection leadId={data.lead.id} notes={notes} returnTo={returnTo} />
        </WorkspaceSection>
      </div>
    </div>
  );
}
