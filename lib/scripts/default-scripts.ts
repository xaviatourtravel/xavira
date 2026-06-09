export type ScriptCategory =
  | "opening"
  | "follow_up"
  | "proposal"
  | "negotiation"
  | "closing"
  | "lost_lead";

export type SalesScript = {
  id: string;
  title: string;
  category: ScriptCategory;
  content: string;
};

export const SCRIPT_CATEGORY_LABELS: Record<ScriptCategory, string> = {
  opening: "Opening",
  follow_up: "Follow Up",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closing: "Closing",
  lost_lead: "Lost Lead",
};

export const SCRIPT_CATEGORIES: ScriptCategory[] = [
  "opening",
  "follow_up",
  "proposal",
  "negotiation",
  "closing",
  "lost_lead",
];

export const DEFAULT_SALES_SCRIPTS: SalesScript[] = [
  {
    id: "opening-welcome-inquiry",
    title: "Sapa Lead Baru dari Inquiry",
    category: "opening",
    content: `Assalamu'alaikum Bapak/Ibu {{nama}},

Perkenalkan, saya {{nama_sales}} dari {{nama_travel}}. Terima kasih sudah menghubungi kami terkait paket {{paket}}.

Boleh saya bantu jelaskan opsi keberangkatan dan estimasi biayanya? Kalau Bapak/Ibu berkenan, kapan waktu yang paling nyaman untuk saya follow up singkat?`,
  },
  {
    id: "opening-referral-intro",
    title: "Opening dari Referral",
    category: "opening",
    content: `Assalamu'alaikum Bapak/Ibu {{nama}},

Perkenalkan, saya {{nama_sales}} dari {{nama_travel}}. Saya dihubungi oleh {{nama_referral}} dan diminta membantu Bapak/Ibu terkait rencana {{paket}}.

Apakah Bapak/Ibu sedang mencari keberangkatan bulan tertentu? Saya siap bantu cek ketersediaan seat dan promo yang sedang berjalan.`,
  },
  {
    id: "opening-returning-lead",
    title: "Opening Lead yang Pernah Chat",
    category: "opening",
    content: `Assalamu'alaikum Bapak/Ibu {{nama}},

Semoga sehat selalu. Saya {{nama_sales}} dari {{nama_travel}}, melanjutkan percakapan kita terkait {{paket}}.

Apakah rencana keberangkatan Bapak/Ibu masih sama, atau ada preferensi baru yang perlu saya sesuaikan?`,
  },
  {
    id: "follow-up-day-1",
    title: "Follow Up Hari Pertama",
    category: "follow_up",
    content: `Assalamu'alaikum Bapak/Ibu {{nama}},

Saya ingin follow up terkait paket {{paket}} yang kemarin kita bahas. Apakah ada pertanyaan tambahan soal jadwal, hotel, atau rincian biaya?

Kalau Bapak/Ibu berkenan, saya bisa kirimkan ringkasan penawaran hari ini.`,
  },
  {
    id: "follow-up-no-response",
    title: "Follow Up Tanpa Balasan",
    category: "follow_up",
    content: `Assalamu'alaikum Bapak/Ibu {{nama}},

Saya {{nama_sales}} dari {{nama_travel}}. Sempat mengirim info paket {{paket}}, belum sempat saya follow up lagi.

Apakah rencana keberangkatan masih aktif? Saya siap bantu cek ketersediaan seat terbaru jika Bapak/Ibu masih berminat.`,
  },
  {
    id: "follow-up-after-brochure",
    title: "Follow Up Setelah Kirim Brosur",
    category: "follow_up",
    content: `Assalamu'alaikum Bapak/Ibu {{nama}},

Semoga brosur paket {{paket}} yang saya kirim kemarin sudah sempat Bapak/Ibu baca.

Bagian mana yang paling menarik perhatian Bapak/Ibu: jadwal keberangkatan, fasilitas hotel, atau skema pembayaran? Saya bisa jelaskan lebih detail.`,
  },
  {
    id: "proposal-send-summary",
    title: "Kirim Ringkasan Proposal",
    category: "proposal",
    content: `Assalamu'alaikum Bapak/Ibu {{nama}},

Berikut ringkasan proposal paket {{paket}} untuk Bapak/Ibu:

• Keberangkatan: {{tanggal}}
• Durasi: {{durasi}}
• Estimasi biaya: {{harga}}
• Termasuk: {{fasilitas}}

Silakan dicek dulu. Jika ada bagian yang perlu disesuaikan, saya siap bantu revisi.`,
  },
  {
    id: "proposal-payment-scheme",
    title: "Proposal Skema Pembayaran",
    category: "proposal",
    content: `Assalamu'alaikum Bapak/Ibu {{nama}},

Untuk paket {{paket}}, berikut skema pembayaran yang bisa kita gunakan:

• DP awal: {{dp}}
• Pelunasan: {{pelunasan}}
• Jadwal cicilan: {{cicilan}}

Apakah skema ini sudah sesuai, atau perlu saya sesuaikan lagi dengan rencana budget Bapak/Ibu?`,
  },
  {
    id: "negotiation-price-objection",
    title: "Negosiasi Keberatan Harga",
    category: "negotiation",
    content: `Assalamu'alaikum Bapak/Ibu {{nama}},

Terima kasih feedback-nya. Saya paham budget menjadi pertimbangan penting.

Untuk paket {{paket}}, saya bisa bantu cek opsi:
• keberangkatan alternatif
• kategori hotel yang lebih fleksibel
• promo yang masih berlaku

Kalau Bapak/Ibu punya target budget, saya akan usahakan penyesuaian terbaik tanpa mengurangi kenyamanan perjalanan.`,
  },
  {
    id: "negotiation-seat-urgency",
    title: "Negosiasi Seat Terbatas",
    category: "negotiation",
    content: `Assalamu'alaikum Bapak/Ibu {{nama}},

Update untuk paket {{paket}}: seat untuk keberangkatan {{tanggal}} tersisa {{sisa_seat}}.

Jika Bapak/Ibu sudah cocok dengan proposalnya, saya sarankan konfirmasi DP dulu agar seat aman. Saya bisa bantu proses hari ini jika Bapak/Ibu setuju.`,
  },
  {
    id: "closing-dp-confirmation",
    title: "Closing Konfirmasi DP",
    category: "closing",
    content: `Assalamu'alaikum Bapak/Ibu {{nama}},

Alhamdulillah, saya siap bantu proses booking paket {{paket}} untuk keberangkatan {{tanggal}}.

Untuk mengamankan seat, mohon konfirmasi DP sebesar {{dp}} ke rekening berikut:
{{rekening}}

Setelah transfer, mohon kirim bukti transfer. Saya akan segera proses administrasi dan kirimkan dokumen persyaratan.`,
  },
  {
    id: "closing-final-checklist",
    title: "Closing Checklist Sebelum Berangkat",
    category: "closing",
    content: `Assalamu'alaikum Bapak/Ibu {{nama}},

Terima kasih sudah mempercayakan perjalanan {{paket}} kepada {{nama_travel}}.

Sebelum keberangkatan, mohon pastikan dokumen berikut sudah lengkap:
• Paspor
• Vaksin (jika diperlukan)
• Bukti pelunasan

Jika ada yang perlu dibantu, saya siap follow up kapan saja.`,
  },
  {
    id: "lost-lead-soft-close",
    title: "Lost Lead — Tutup dengan Sopan",
    category: "lost_lead",
    content: `Assalamu'alaikum Bapak/Ibu {{nama}},

Terima kasih atas waktu dan pertimbangannya selama proses konsultasi paket {{paket}}.

Saya paham saat ini mungkin belum menjadi waktu yang tepat. Jika nanti rencana keberangkatan kembali aktif, saya dengan senang hati bantu lagi.

Semoga Bapak/Ibu dan keluarga selalu sehat.`,
  },
  {
    id: "lost-lead-door-open",
    title: "Lost Lead — Pintu Terbuka untuk Masa Depan",
    category: "lost_lead",
    content: `Assalamu'alaikum Bapak/Ibu {{nama}},

Terima kasih sudah berdiskusi dengan {{nama_travel}} terkait {{paket}}.

Meskipun belum jadi lanjut saat ini, saya simpan data Bapak/Ibu. Jika ada promo atau jadwal baru yang sesuai, boleh saya hubungi kembali?

Semoga rencana ibadah Bapak/Ibu dimudahkan.`,
  },
];
