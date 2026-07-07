import { getEffectiveLeadTemperature } from "@/lib/leads/lead-temperature";
import {
  withTemporalContext,
  type BuildTemporalContextOptions,
} from "@/lib/ai/temporal-context";

export const SALES_ASSISTANT_ACTIONS = [
  "follow_up",
  "reply",
  "closing",
  "re_engagement",
  "payment_reminder",
  "qualification_questions",
] as const;

export type SalesAssistantAction = (typeof SALES_ASSISTANT_ACTIONS)[number];

const SALES_ASSISTANT_ACTION_LABELS: Record<SalesAssistantAction, string> = {
  follow_up: "Generate Follow Up",
  reply: "Generate Reply",
  closing: "Generate Closing Message",
  re_engagement: "Generate Re-engagement Message",
  payment_reminder: "Generate Payment Reminder",
  qualification_questions: "Generate Qualification Questions",
};

const SALES_ASSISTANT_ACTION_INSTRUCTIONS: Record<SalesAssistantAction, string> = {
  follow_up:
    "Buat pesan follow up yang natural untuk melanjutkan percakapan dan mengajak pelanggan merespons.",
  reply:
    "Buat balasan WhatsApp yang relevan terhadap konteks pelanggan. Jawab pertanyaan dengan jelas. Jika detail paket belum lengkap, arahkan sales untuk konfirmasi manual.",
  closing:
    "Bantu sales mengajak pelanggan mengambil keputusan booking dengan sopan, tanpa tekanan berlebihan.",
  re_engagement:
    "Buat pesan untuk menghidupkan kembali lead yang sempat dingin atau belum merespons.",
  payment_reminder:
    "Ingatkan pelanggan tentang pembayaran yang belum lunas dengan sopan. Jangan minta data pembayaran sensitif.",
  qualification_questions:
    "Buat daftar pertanyaan kualifikasi singkat yang bisa sales kirim via WhatsApp untuk memahami kebutuhan pelanggan (jadwal, budget, jumlah peserta, preferensi paket). Format natural, bukan kuesioner kaku.",
};

export function isSalesAssistantAction(
  value: string,
): value is SalesAssistantAction {
  return SALES_ASSISTANT_ACTIONS.includes(value as SalesAssistantAction);
}

export function parseSalesAssistantAction(
  value: string,
): SalesAssistantAction | null {
  const trimmed = value.trim();
  return isSalesAssistantAction(trimmed) ? trimmed : null;
}

export function getSalesAssistantActionLabel(action: SalesAssistantAction) {
  return SALES_ASSISTANT_ACTION_LABELS[action];
}

export type SalesAssistantLead = {
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

export type SalesAssistantPackage = {
  name: string;
  destination: string | null;
  departure_date: string | null;
  duration_days: number | null;
  price_idr: number | null;
  quota: number | null;
};

export type SalesAssistantActivity = {
  activity_type: string;
  title: string | null;
  body: string | null;
  occurred_at: string;
};

export type SalesAssistantFollowUpTask = {
  title: string;
  description: string | null;
  due_date: string;
  status: string;
};

export type SalesAssistantBooking = {
  booking_code: string | null;
  package_name: string | null;
  payment_status: string;
  booking_status: string;
};

export type SalesAssistantPromptInput = {
  action: SalesAssistantAction;
  customerContext?: string;
  lead: SalesAssistantLead;
  selectedPackage: SalesAssistantPackage | null;
  activities: SalesAssistantActivity[];
  followUpTasks: SalesAssistantFollowUpTask[];
  booking: SalesAssistantBooking | null;
  timezone?: string | null;
};

function formatOptionalValue(value: string | number | null | undefined) {
  if (value == null || value === "") {
    return "TIDAK TERSEDIA — jangan dibuat-buat, minta sales konfirmasi manual";
  }

  return String(value);
}

function formatActivities(activities: SalesAssistantActivity[]) {
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

function formatFollowUpTasks(tasks: SalesAssistantFollowUpTask[]) {
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

export function buildSalesAssistantPrompt({
  action,
  customerContext,
  lead,
  selectedPackage,
  activities,
  followUpTasks,
  booking,
  timezone,
}: SalesAssistantPromptInput) {
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

  return withTemporalContext(
    `
Kamu membantu sales travel Umroh dan Halal Tour menulis draf pesan WhatsApp.

Aksi: ${getSalesAssistantActionLabel(action)}
Instruksi aksi: ${SALES_ASSISTANT_ACTION_INSTRUCTIONS[action]}

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
`.trim(),
    { timezone } satisfies BuildTemporalContextOptions,
  );
}
