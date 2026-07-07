import type { CustomerAiSummaryContext } from "./context";
import { formatCustomerAiSummaryContext } from "./context";
import { withTemporalContext } from "@/lib/ai/temporal-context";

const SAFETY_RULES = `
Aturan keamanan wajib:
- Gunakan hanya fakta dari data konteks.
- Jangan mengarang harga, promo, ketersediaan seat, detail penerbangan, hotel, atau paket.
- Jika data tidak ada, tulis null atau sebut "belum tersedia" — jangan dibuat-buat.
- suggestedFollowUpMessage: Bahasa Indonesia, hangat, profesional, helpful, gaya konsultan travel.
- Jangan sebut kata AI/otomatis/chatbot.
- Pesan follow-up siap disalin manual — TIDAK dikirim otomatis.
`.trim();

export function buildCustomerAiSummaryPrompt(
  context: CustomerAiSummaryContext,
  timezone?: string | null,
) {
  return withTemporalContext(
    `
Kamu membantu sales travel Umroh/Halal Tour memahami customer secara instan dari Customer Workspace.

Berdasarkan data berikut, buat analisis dalam format JSON saja (tanpa markdown, tanpa teks di luar JSON).

Struktur JSON wajib:
{
  "customerSummary": "ringkasan singkat 2-4 kalimat Bahasa Indonesia",
  "destinationInterest": "string atau null",
  "travelDateOrMonth": "string atau null",
  "pax": angka atau null,
  "budget": "string ringkas atau null (contoh: Rp 25.000.000)",
  "intentLevel": "Low" | "Medium" | "High",
  "leadTemperature": "Cold" | "Warm" | "Hot",
  "missingFields": ["phone", "travel date", "pax", "budget", "package preference"],
  "nextBestAction": "rekomendasi langkah konkret untuk sales (1-2 kalimat Bahasa Indonesia)",
  "suggestedFollowUpMessage": "draf pesan follow-up Bahasa Indonesia, 3-6 kalimat",
  "insufficientData": true atau false
}

Aturan:
- missingFields: hanya gunakan nilai dari daftar: phone, travel date, pax, budget, package preference.
- Gabungkan deteksi sistem dengan analisis percakapan.
- intentLevel dan leadTemperature harus konsisten dengan engagement dan kesiapan beli.
- insufficientData: true jika konteks terlalu tipis untuk analisis kuat.
- nextBestAction: spesifik dan actionable (contoh: konfirmasi tanggal keberangkatan, follow up DP, kirim opsi paket alternatif).
- suggestedFollowUpMessage: jangan sertakan harga/promo kecuali sudah eksplisit di data.

${SAFETY_RULES}

${formatCustomerAiSummaryContext(context)}
`.trim(),
    { timezone },
  );
}
