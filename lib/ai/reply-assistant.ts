import { getEffectiveLeadTemperature } from "@/lib/leads/lead-temperature";

export const REPLY_ASSISTANT_TYPES = [
  "follow_up",
  "answer_package_question",
  "price_explanation",
  "closing",
  "re_engagement",
  "payment_reminder",
] as const;

export type ReplyAssistantType = (typeof REPLY_ASSISTANT_TYPES)[number];

const REPLY_TYPE_LABELS: Record<ReplyAssistantType, string> = {
  follow_up: "Follow Up",
  answer_package_question: "Answer Package Question",
  price_explanation: "Price Explanation",
  closing: "Closing",
  re_engagement: "Re-engagement",
  payment_reminder: "Payment Reminder",
};

const REPLY_TYPE_INSTRUCTIONS: Record<ReplyAssistantType, string> = {
  follow_up:
    "Buat pesan follow up yang natural untuk melanjutkan percakapan dan mengajak pelanggan merespons.",
  answer_package_question:
    "Jawab pertanyaan terkait paket dengan jelas. Jika detail paket belum lengkap, arahkan sales untuk konfirmasi manual.",
  price_explanation:
    "Jelaskan harga paket dengan transparan. Jika harga tidak tersedia di data, jangan sebut angka dan minta sales konfirmasi manual.",
  closing:
    "Bantu sales mengajak pelanggan mengambil keputusan booking dengan sopan, tanpa tekanan berlebihan.",
  re_engagement:
    "Buat pesan untuk menghidupkan kembali lead yang sempat dingin atau belum merespons.",
  payment_reminder:
    "Ingatkan pelanggan tentang pembayaran yang belum lunas dengan sopan. Jangan minta data pembayaran sensitif.",
};

export function isReplyAssistantType(value: string): value is ReplyAssistantType {
  return REPLY_ASSISTANT_TYPES.includes(value as ReplyAssistantType);
}

export function parseReplyAssistantType(value: string): ReplyAssistantType | null {
  const trimmed = value.trim();
  return isReplyAssistantType(trimmed) ? trimmed : null;
}

export function getReplyAssistantTypeLabel(type: ReplyAssistantType) {
  return REPLY_TYPE_LABELS[type];
}

export type ReplyAssistantLead = {
  full_name: string;
  status: string;
  interest_type: string;
  package_interest: string | null;
  notes: string | null;
  lead_temperature: string | null;
  updated_at: string;
  budget_idr: number | null;
  travel_date_preference: string | null;
  party_size: number | null;
};

export type ReplyAssistantPackage = {
  name: string;
  destination: string | null;
  departure_date: string | null;
  duration_days: number | null;
  price_idr: number | null;
  quota: number | null;
};

export type ReplyAssistantActivity = {
  activity_type: string;
  title: string | null;
  body: string | null;
  occurred_at: string;
};

export type ReplyAssistantFollowUpTask = {
  title: string;
  description: string | null;
  due_date: string;
  status: string;
};

export type ReplyAssistantBooking = {
  booking_code: string | null;
  package_name: string | null;
  payment_status: string;
  booking_status: string;
};

export type ReplyAssistantPromptInput = {
  replyType: ReplyAssistantType;
  customerContext?: string;
  lead: ReplyAssistantLead;
  selectedPackage: ReplyAssistantPackage | null;
  activities: ReplyAssistantActivity[];
  followUpTasks: ReplyAssistantFollowUpTask[];
  booking: ReplyAssistantBooking | null;
};

function formatOptionalValue(value: string | number | null | undefined) {
  if (value == null || value === "") {
    return "TIDAK TERSEDIA — jangan dibuat-buat, minta sales konfirmasi manual";
  }

  return String(value);
}

function formatActivities(activities: ReplyAssistantActivity[]) {
  if (activities.length === 0) {
    return "- Belum ada aktivitas tercatat";
  }

  return activities
    .map(
      (activity) =>
        `- ${activity.occurred_at}: ${activity.activity_type} | ${activity.title ?? ""} ${activity.body ?? ""}`.trim(),
    )
    .join("\n");
}

function formatFollowUpTasks(tasks: ReplyAssistantFollowUpTask[]) {
  if (tasks.length === 0) {
    return "- Belum ada follow up terjadwal";
  }

  return tasks
    .map(
      (task) =>
        `- ${task.due_date} [${task.status}] ${task.title}${task.description ? ` — ${task.description}` : ""}`,
    )
    .join("\n");
}

export function buildReplyAssistantPrompt({
  replyType,
  customerContext,
  lead,
  selectedPackage,
  activities,
  followUpTasks,
  booking,
}: ReplyAssistantPromptInput) {
  const temperature = getEffectiveLeadTemperature({
    lead_temperature: lead.lead_temperature,
    status: lead.status,
    updated_at: lead.updated_at,
  });

  const packageSection = selectedPackage
    ? `
Data paket (hanya gunakan informasi yang tersedia):
- Nama paket: ${selectedPackage.name}
- Destinasi: ${formatOptionalValue(selectedPackage.destination)}
- Durasi: ${formatOptionalValue(selectedPackage.duration_days)} hari
- Harga: ${formatOptionalValue(selectedPackage.price_idr)}
- Kuota: ${formatOptionalValue(selectedPackage.quota)}
- Tanggal berangkat: ${formatOptionalValue(selectedPackage.departure_date)}
`
    : `
Data paket:
- Paket belum cocok dengan data master atau belum dipilih.
- Jangan sebut harga, tanggal keberangkatan, atau ketersediaan seat.
- Gunakan kalimat bahwa tim akan cek dan konfirmasi detail paket secara manual.
`;

  const bookingSection = booking
    ? `
Data booking terkait:
- Kode booking: ${booking.booking_code ?? "-"}
- Paket booking: ${booking.package_name ?? "-"}
- Status pembayaran: ${booking.payment_status}
- Status booking: ${booking.booking_status}
`
    : `
Data booking terkait:
- Belum ada booking untuk lead ini.
`;

  const customerContextSection = customerContext?.trim()
    ? `
Konteks tambahan dari sales (pertanyaan/kebutuhan pelanggan terakhir):
${customerContext.trim()}
`
    : "";

  return `
Kamu membantu sales travel Umroh dan Halal Tour menulis draf balasan WhatsApp.

Jenis balasan: ${getReplyAssistantTypeLabel(replyType)}
Instruksi jenis balasan: ${REPLY_TYPE_INSTRUCTIONS[replyType]}

Aturan wajib:
- Tulis dalam Bahasa Indonesia, ramah, profesional, cocok untuk WhatsApp.
- Gunakan sapaan "Kak" + nama depan, kecuali nama jelas formal (mis. Bapak/Ibu/Pak/Bu/Hj.) — sesuaikan sopan.
- Jangan sebut kata "AI", "otomatis", atau "chatbot".
- Jangan janjikan ketersediaan seat/kuota kecuali data kuota paket tersedia dan jelas.
- Jangan buat diskon, promo, atau harga nego yang tidak ada di data.
- Jangan minta informasi pembayaran sensitif (nomor kartu, OTP, PIN, password, rekening penuh).
- Jika harga, tanggal, atau kuota TIDAK TERSEDIA, jangan mengarang angka/tanggal. Gunakan kalimat bahwa tim akan konfirmasi manual.
- Pesan singkat-sedang, natural, mudah disalin ke WhatsApp.
- Output hanya isi pesan WhatsApp. Tanpa markdown, tanpa penjelasan tambahan.

Data lead:
- Nama: ${lead.full_name}
- Status pipeline: ${lead.status}
- Suhu lead: ${temperature.value}${temperature.isSuggested ? " (suggested)" : ""}
- Minat: ${lead.interest_type}
- Paket diminati: ${lead.package_interest ?? "-"}
- Budget: ${formatOptionalValue(lead.budget_idr)}
- Preferensi tanggal: ${formatOptionalValue(lead.travel_date_preference)}
- Jumlah peserta: ${formatOptionalValue(lead.party_size)}
- Catatan lead: ${lead.notes?.trim() || "-"}
${packageSection}
${bookingSection}
Aktivitas terakhir:
${formatActivities(activities)}

Follow up terjadwal:
${formatFollowUpTasks(followUpTasks)}
${customerContextSection}
`.trim();
}
