import {
  formatBookingReminderTypeLabel,
  TONE_INSTRUCTIONS,
  type FollowUpAssistantTone,
} from "./constants";
import type {
  BookingPaymentReminderContext,
  LeadFollowUpContext,
} from "./context";

const SAFETY_RULES = `
Aturan keamanan wajib:
- Tulis dalam Bahasa Indonesia.
- Jangan sebut kata "AI", "otomatis", atau "chatbot".
- Jangan mengarang harga, promo, diskon, atau ketersediaan seat/kuota.
- Jangan sebut angka harga/total/DP kecuali sudah tercantum eksplisit di data konteks.
- Jangan minta informasi pembayaran sensitif (OTP, PIN, nomor kartu, password).
- Pesan siap disalin manual oleh sales — TIDAK dikirim otomatis.
- Output hanya isi pesan. Tanpa markdown, label, atau penjelasan tambahan.
`.trim();

function formatOptional(value: string | number | null | undefined) {
  if (value == null || value === "") {
    return "Tidak tersedia — jangan dibuat-buat";
  }

  return String(value);
}

export function buildLeadFollowUpPrompt(
  context: LeadFollowUpContext,
  tone: FollowUpAssistantTone,
) {
  const conversationSection = context.lastConversationText
    ? `
Percakapan terakhir${context.lastConversationChannel ? ` (${context.lastConversationChannel})` : ""}:
"""
${context.lastConversationText}
"""
`
    : `
Percakapan terakhir:
- Tidak ada riwayat percakapan inbox. Gunakan status lead dan catatan saja.
`;

  return `
Kamu membantu sales travel Umroh/Halal Tour menulis draf follow-up untuk lead.

Tujuan: buat pesan follow-up kontekstual yang mengajak pelanggan merespons.

Nada pesan: ${TONE_INSTRUCTIONS[tone]}

${SAFETY_RULES}

Data lead:
- Nama: ${context.fullName}
- Status pipeline: ${context.status}
- Destinasi / paket: ${formatOptional(context.destination ?? context.packageInterest)}
- Preferensi tanggal: ${formatOptional(context.travelDate)}
- Jumlah pax: ${formatOptional(context.partySize)}
- Budget: ${formatOptional(context.budgetIdr)}
- Catatan lead: ${context.notes?.trim() || "-"}
- Hari sejak aktivitas terakhir: ${context.daysSinceLastActivity}
${conversationSection}

Instruksi:
- Sesuaikan follow-up dengan hari sejak aktivitas terakhir (lebih lama = lebih lembut re-engage).
- Referensikan percakapan terakhir jika ada, tanpa mengutip panjang.
- Jika detail paket belum jelas, ajak konfirmasi jadwal/destinasi/pax — jangan mengarang detail.
- Panjang ideal 3-6 kalimat, maksimal ~700 karakter.
`.trim();
}

export function buildBookingPaymentReminderPrompt(
  context: BookingPaymentReminderContext,
  tone: FollowUpAssistantTone,
) {
  const reminderLabel = formatBookingReminderTypeLabel(context.reminderType);

  return `
Kamu membantu sales travel menulis draf reminder pembayaran booking.

Tujuan: ${reminderLabel}

Nada pesan: ${TONE_INSTRUCTIONS[tone]}

${SAFETY_RULES}

Data booking:
- Customer: ${context.customerName}
- Kode booking: ${formatOptional(context.bookingCode)}
- Paket: ${formatOptional(context.packageName)}
- Tanggal keberangkatan: ${formatOptional(context.departureDate)}
- Total harga booking: Rp ${context.totalAmount.toLocaleString("id-ID")}
- Total sudah dibayar: Rp ${context.amountPaid.toLocaleString("id-ID")}
- Sisa outstanding: Rp ${context.outstandingBalance.toLocaleString("id-ID")}
- Status pembayaran: ${context.paymentStatusLabel}
- Pembayaran terakhir: ${formatOptional(context.lastPaymentDate)}

Riwayat pembayaran:
${context.paymentsSummary}

Instruksi reminder:
- dp_not_paid: ingatkan DP/booking fee belum masuk, ajak konfirmasi rencana transfer.
- partial_payment: ucapkan terima kasih atas pembayaran sebelumnya, ingatkan sisa pelunasan.
- final_payment_due: fokus pelunasan outstanding tanpa tekanan berlebihan.

Gunakan angka total/sisa/outstanding di atas jika relevan. Jangan tambah angka lain.
Panjang ideal 3-5 kalimat.
`.trim();
}
