import type { CustomerWorkspaceData } from "@/lib/customers/load-customer-workspace";
import type { LeadFollowUpHistoryItem } from "@/lib/leads/lead-customer-360";
import type { LeadTimelineEventType } from "@/lib/leads/timeline";
import type { LeadHealthBadge } from "@/lib/leads/health-score";
import type { MessageRow } from "@/types/omnichannel-inbox";

export type CommunicationFeedCategory =
  | "whatsapp"
  | "email"
  | "booking"
  | "invoice"
  | "payment"
  | "task"
  | "note"
  | "ai";

export type CommunicationFeedItem = {
  id: string;
  category: CommunicationFeedCategory;
  title: string;
  description: string;
  occurredAt: string;
};

export type CommunicationAiSummary = {
  bullets: string[];
  recommendation: string;
};

export type StructuredAiSummary = {
  minat: string;
  diskusiTerakhir: string;
  statusTindakLanjut: string;
  statusBooking: string;
  statusPembayaran: string;
  rekomendasi: string;
};

export type CustomerWorkspaceFileGroup = {
  category: "passport" | "invoice" | "itinerary" | "document";
  label: string;
  items: {
    id: string;
    title: string;
    subtitle: string;
    href: string | null;
  }[];
};

export type CustomerWorkspaceNote = {
  id: string;
  title: string;
  body: string | null;
  occurredAt: string;
  actorName: string;
};

export type CommunicationAiRecommendation = {
  headline: string;
  detail: string;
  urgency: "tinggi" | "sedang" | "rendah";
};

export type CommunicationPreviewMessage = {
  id: string;
  direction: "incoming" | "outgoing";
  text: string;
  createdAt: string;
};

export const AI_SUMMARY_DISCLAIMER =
  "Ringkasan ini akan diperbarui otomatis saat data percakapan bertambah.";

const HEALTH_BADGE_ID: Record<LeadHealthBadge, string> = {
  Excellent: "Sangat Baik",
  Healthy: "Sehat",
  "Attention Needed": "Perlu Perhatian",
  Critical: "Kritis",
};

const LEAD_STATUS_ID: Record<string, string> = {
  new: "Baru",
  contacted: "Dihubungi",
  qualified: "Terkualifikasi",
  proposal: "Penawaran",
  negotiation: "Negosiasi",
  won: "Menang",
  lost: "Gagal",
  nurturing: "Dalam Pendampingan",
};

const FEED_CATEGORY_META: Record<
  CommunicationFeedCategory,
  { label: string; tone: string }
> = {
  whatsapp: { label: "WhatsApp", tone: "bg-emerald-100 text-emerald-800" },
  email: { label: "Email", tone: "bg-sky-100 text-sky-800" },
  booking: { label: "Pemesanan", tone: "bg-violet-100 text-violet-800" },
  invoice: { label: "Tagihan", tone: "bg-amber-100 text-amber-800" },
  payment: { label: "Pembayaran", tone: "bg-teal-100 text-teal-800" },
  task: { label: "Tugas", tone: "bg-indigo-100 text-indigo-800" },
  note: { label: "Catatan", tone: "bg-zinc-100 text-zinc-700" },
  ai: { label: "AI", tone: "bg-cyan-100 text-cyan-800" },
};

export function getCommunicationFeedCategoryMeta(category: CommunicationFeedCategory) {
  return FEED_CATEGORY_META[category];
}

export function formatCustomerLeadStatus(status: string) {
  return (
    LEAD_STATUS_ID[status] ??
    status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

export function formatCustomerHealthBadge(badge: LeadHealthBadge) {
  return HEALTH_BADGE_ID[badge] ?? badge;
}

export function formatCommunicationDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function formatCommunicationDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function formatCommunicationCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function daysSince(value: string | null) {
  if (!value) {
    return null;
  }

  const diffMs = Date.now() - new Date(value).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function mapTimelineCategory(eventType: LeadTimelineEventType): CommunicationFeedCategory {
  switch (eventType) {
    case "booking_created":
      return "booking";
    case "payment_recorded":
      return "payment";
    case "follow_up_completed":
      return "task";
    case "note_added":
      return "note";
    case "ai_follow_up_generated":
    case "ai_recommendation_generated":
      return "ai";
    default:
      return "note";
  }
}

function mapFollowUpToFeedItem(task: LeadFollowUpHistoryItem): CommunicationFeedItem {
  return {
    id: `task-${task.id}`,
    category: "task",
    title: task.isCompleted ? "Tugas selesai" : "Tugas tindak lanjut",
    description: task.title,
    occurredAt: task.dueDate,
  };
}

function mapMessageToFeedItem(message: MessageRow): CommunicationFeedItem {
  return {
    id: `wa-${message.id}`,
    category: "whatsapp",
    title:
      message.direction === "incoming"
        ? "Pesan masuk WhatsApp"
        : "Pesan keluar WhatsApp",
    description: message.message_text?.trim() || "Pesan tanpa teks",
    occurredAt: message.created_at,
  };
}

export function buildCommunicationFeed(
  data: CustomerWorkspaceData,
): CommunicationFeedItem[] {
  const items: CommunicationFeedItem[] = [];

  for (const event of data.timelineEvents) {
    items.push({
      id: `timeline-${event.id}`,
      category: mapTimelineCategory(event.eventType),
      title: event.description,
      description: event.details ?? event.userName,
      occurredAt: event.occurredAt,
    });
  }

  for (const task of data.followUpHistory) {
    items.push(mapFollowUpToFeedItem(task));
  }

  if (data.conversationDetail?.messages.length) {
    for (const message of data.conversationDetail.messages) {
      items.push(mapMessageToFeedItem(message));
    }
  }

  for (const booking of data.bookings) {
    items.push({
      id: `booking-${booking.id}`,
      category: "booking",
      title: "Pemesanan dibuat",
      description: booking.package_name
        ? `${booking.package_name} · ${booking.booking_code ?? "Tanpa kode"}`
        : booking.booking_code ?? "Pemesanan baru",
      occurredAt: booking.created_at,
    });
  }

  for (const payment of data.payments) {
    const booking = data.bookings.find((row) => row.id === payment.bookingId);
    items.push({
      id: `payment-${payment.id}`,
      category: "payment",
      title: "Pembayaran tercatat",
      description: `${formatCommunicationCurrency(Number(payment.amount))}${
        payment.bookingCode ? ` · ${payment.bookingCode}` : ""
      }`,
      occurredAt:
        payment.payment_date ?? booking?.created_at ?? new Date().toISOString(),
    });
  }

  for (const booking of data.bookings) {
    if (booking.payment_status === "unpaid" || booking.payment_status === "partial") {
      items.push({
        id: `invoice-${booking.id}`,
        category: "invoice",
        title: "Tagihan booking",
        description: `${booking.booking_code ?? "Booking"} · ${formatCommunicationCurrency(Number(booking.total_amount))}`,
        occurredAt: booking.created_at,
      });
    }
  }

  return items.sort(
    (left, right) =>
      new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
  );
}

export function buildCommunicationPreviewMessages(
  data: CustomerWorkspaceData,
): CommunicationPreviewMessage[] {
  const messages = data.conversationDetail?.messages ?? [];

  if (messages.length === 0) {
    return [];
  }

  return messages.slice(-8).map((message) => ({
    id: message.id,
    direction: message.direction,
    text: message.message_text?.trim() || "Pesan tanpa teks",
    createdAt: message.created_at,
  }));
}

export function buildLatestConversationMessage(data: CustomerWorkspaceData) {
  const messages = data.conversationDetail?.messages ?? [];
  const latest = messages.at(-1);

  if (!latest) {
    return null;
  }

  return {
    text: latest.message_text?.trim() || "Pesan tanpa teks",
    direction: latest.direction,
    createdAt: latest.created_at,
  };
}

export function buildCommunicationAiSummary(
  data: CustomerWorkspaceData,
): CommunicationAiSummary {
  const packageName =
    data.lead.package_interest ??
    data.bookings[0]?.package_name ??
    "Yunnan Premium 8D7N";
  const inactiveDays = daysSince(data.lastActivityAt ?? data.lead.updated_at);
  const bullets: string[] = [
    `Customer tertarik paket ${packageName}.`,
    "Sudah meminta itinerary.",
  ];

  if (inactiveDays != null && inactiveDays >= 1) {
    bullets.push(`Belum di-follow up selama ${inactiveDays} hari.`);
  } else {
    bullets.push("Aktivitas masih hangat dalam 24 jam terakhir.");
  }

  if (data.healthScore.score >= 70) {
    bullets.push("Peluang closing tinggi.");
  } else if (data.healthScore.score >= 45) {
    bullets.push("Peluang closing sedang, perlu follow up terstruktur.");
  } else {
    bullets.push("Perlu intervensi segera agar deal tidak hilang.");
  }

  const recommendation =
    inactiveDays != null && inactiveDays >= 2
      ? "Sebaiknya hubungi customer hari ini."
      : "Lanjutkan percakapan dan kunci kebutuhan sebelum jam kerja berakhir.";

  return { bullets, recommendation };
}

export function buildCommunicationAiRecommendation(
  data: CustomerWorkspaceData,
): CommunicationAiRecommendation {
  const inactiveDays = daysSince(data.lastActivityAt ?? data.lead.updated_at);
  const customerName = data.lead.full_name.split(" ")[0] ?? "Customer";

  if (inactiveDays != null && inactiveDays >= 3) {
    return {
      headline: `${customerName} sudah tidak dihubungi selama ${inactiveDays} hari.`,
      detail: "Hubungi sebelum jam 15.00 dengan update itinerary dan opsi keberangkatan terdekat.",
      urgency: "tinggi",
    };
  }

  if (data.nextFollowUp?.isOverdue) {
    return {
      headline: "Follow up terjadwal sudah melewati batas waktu.",
      detail: `Prioritaskan task "${data.nextFollowUp.title}" sebelum menangani lead lain.`,
      urgency: "tinggi",
    };
  }

  if (data.metrics.outstandingBalance > 0) {
    return {
      headline: "Masih ada tagihan belum lunas yang perlu ditindaklanjuti.",
      detail: `Sisa pembayaran ${formatCommunicationCurrency(data.metrics.outstandingBalance)}. Kirim reminder pembayaran setelah konfirmasi keberangkatan.`,
      urgency: "sedang",
    };
  }

  return {
    headline: "Momentum deal masih terbuka.",
    detail: "Kirim rekap paket dan ajukan jadwal call singkat untuk kunci keputusan.",
    urgency: "rendah",
  };
}

export function buildCustomerContactHref(data: CustomerWorkspaceData) {
  const phone = data.lead.whatsapp_number ?? data.lead.phone;
  if (phone) {
    const normalized = phone.replace(/\D/g, "");
    return `https://wa.me/${normalized.startsWith("0") ? `62${normalized.slice(1)}` : normalized}`;
  }

  if (data.conversationHref) {
    return data.conversationHref;
  }

  return null;
}

export function buildStructuredAiSummary(
  data: CustomerWorkspaceData,
): StructuredAiSummary {
  const packageName =
    data.lead.package_interest ??
    data.bookings[0]?.package_name ??
    "belum dipilih";
  const primaryBooking = data.bookings[0] ?? null;
  const lastMessage = data.conversationDetail?.messages.at(-1);
  const inactiveDays = daysSince(data.lastActivityAt ?? data.lead.updated_at);

  let diskusiTerakhir = "Belum ada percakapan tercatat.";
  if (lastMessage?.message_text?.trim()) {
    const preview = lastMessage.message_text.trim();
    diskusiTerakhir =
      preview.length > 120 ? `${preview.slice(0, 117)}...` : preview;
  } else if (data.timelineEvents[0]?.description) {
    diskusiTerakhir = data.timelineEvents[0].description;
  }

  let statusTindakLanjut = "Belum ada tugas tindak lanjut aktif.";
  if (data.nextFollowUp?.isOverdue) {
    statusTindakLanjut = `Tugas "${data.nextFollowUp.title}" sudah melewati jatuh tempo.`;
  } else if (data.nextFollowUp) {
    statusTindakLanjut = `Tugas "${data.nextFollowUp.title}" dijadwalkan ${formatCommunicationDateTime(data.nextFollowUp.dueDate)}.`;
  } else if (inactiveDays != null && inactiveDays >= 2) {
    statusTindakLanjut = `Belum dihubungi selama ${inactiveDays} hari.`;
  }

  let statusBooking = "Belum ada booking.";
  if (primaryBooking) {
    statusBooking = `${primaryBooking.package_name ?? "Paket"} · ${formatCustomerLeadStatus(primaryBooking.booking_status)}`;
    if (primaryBooking.departure_date) {
      statusBooking += ` · keberangkatan ${formatCommunicationDate(primaryBooking.departure_date)}`;
    }
  }

  let statusPembayaran = "Belum ada pembayaran.";
  if (data.metrics.totalPaid > 0 && data.metrics.outstandingBalance <= 0) {
    statusPembayaran = `Lunas · total terbayar ${formatCommunicationCurrency(data.metrics.totalPaid)}`;
  } else if (data.metrics.outstandingBalance > 0) {
    statusPembayaran = `Sisa tagihan ${formatCommunicationCurrency(data.metrics.outstandingBalance)}`;
  } else if (primaryBooking) {
    statusPembayaran = "Booking ada, pembayaran belum tercatat.";
  }

  const recommendation = buildCommunicationAiRecommendation(data);
  const rekomendasi = `${recommendation.headline} ${recommendation.detail}`;

  return {
    minat: `Tertarik paket ${packageName}.`,
    diskusiTerakhir,
    statusTindakLanjut,
    statusBooking,
    statusPembayaran,
    rekomendasi,
  };
}

export function buildCustomerWorkspaceFiles(
  data: CustomerWorkspaceData,
): CustomerWorkspaceFileGroup[] {
  const passportItems: CustomerWorkspaceFileGroup["items"] = [];
  const documentItems: CustomerWorkspaceFileGroup["items"] = [];

  for (const group of data.participantGroups) {
    for (const participant of group.participants) {
      if (participant.passport_number || participant.passport_photo_url) {
        passportItems.push({
          id: `passport-${participant.id}`,
          title: participant.full_name,
          subtitle: participant.passport_number
            ? `Paspor ${participant.passport_number}`
            : "Foto paspor terunggah",
          href: participant.passport_photo_url,
        });
      }

      if (participant.address || participant.emergency_contact || participant.notes) {
        documentItems.push({
          id: `doc-${participant.id}`,
          title: participant.full_name,
          subtitle: participant.notes?.trim() || "Dokumen pendukung peserta",
          href: null,
        });
      }
    }
  }

  const invoiceItems = data.bookings.map((booking) => ({
    id: `invoice-${booking.id}`,
    title: booking.booking_code ?? "Tagihan booking",
    subtitle:
      booking.payment_status === "paid"
        ? "Lunas"
        : `Sisa ${formatCommunicationCurrency(
            Math.max(
              0,
              Number(booking.total_amount) -
                data.payments
                  .filter((payment) => payment.bookingId === booking.id)
                  .reduce((sum, payment) => sum + Number(payment.amount), 0),
            ),
          )}`,
    href: `/bookings/${booking.id}`,
  }));

  const packageName =
    data.lead.package_interest ?? data.bookings[0]?.package_name ?? null;
  const itineraryItems = packageName
    ? [
        {
          id: "itinerary-package",
          title: packageName,
          subtitle: "Rencana perjalanan paket terkait customer",
          href: null,
        },
      ]
    : [];

  return [
    { category: "passport", label: "Paspor", items: passportItems },
    { category: "invoice", label: "Tagihan", items: invoiceItems },
    { category: "itinerary", label: "Rencana Perjalanan", items: itineraryItems },
    { category: "document", label: "Dokumen lainnya", items: documentItems },
  ];
}

export function buildCustomerWorkspaceNotes(
  data: CustomerWorkspaceData,
): CustomerWorkspaceNote[] {
  return data.timelineEvents
    .filter((event) => event.eventType === "note_added")
    .map((event) => ({
      id: event.id,
      title: event.description,
      body: event.details,
      occurredAt: event.occurredAt,
      actorName: event.userName,
    }));
}

export function formatAiUrgencyLabel(urgency: CommunicationAiRecommendation["urgency"]) {
  switch (urgency) {
    case "tinggi":
      return "Tinggi";
    case "sedang":
      return "Sedang";
    default:
      return "Rendah";
  }
}

export function buildUpcomingActivityLabel(data: CustomerWorkspaceData) {
  if (data.nextFollowUp) {
    return {
      title: data.nextFollowUp.title,
      subtitle: formatCommunicationDateTime(data.nextFollowUp.dueDate),
    };
  }

  const departure = data.bookings[0]?.departure_date;
  if (departure) {
    return {
      title: "Keberangkatan terjadwal",
      subtitle: formatCommunicationDate(departure),
    };
  }

  return null;
}

export function buildCustomerTags(data: CustomerWorkspaceData) {
  const tags: string[] = [];

  if (data.lead.package_interest) {
    tags.push(data.lead.package_interest);
  }

  if (data.leadTemperature.value) {
    tags.push(`Suhu ${data.leadTemperature.value}`);
  }

  if (data.metrics.totalBookings > 0) {
    tags.push("Sudah pesan");
  }

  if (data.metrics.outstandingBalance > 0) {
    tags.push("Sisa tagihan");
  }

  if (tags.length === 0) {
    tags.push("Customer aktif", "Butuh tindak lanjut");
  }

  return tags.slice(0, 5);
}
