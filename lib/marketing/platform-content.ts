export const platformSubroutes = {
  communication: "/platform/communication",
  customer: "/platform/customer",
  sales: "/platform/sales",
  finance: "/platform/finance",
  knowledge: "/platform/knowledge",
  automation: "/platform/automation",
  ai: "/platform/ai",
} as const;

export type PlatformCapabilityId = keyof typeof platformSubroutes;

export const platformFlowSteps = [
  { id: "communication", label: "Communication" },
  { id: "customer", label: "Customer" },
  { id: "tasks", label: "Task" },
  { id: "sales", label: "Sales" },
  { id: "finance", label: "Finance" },
  { id: "knowledge", label: "Knowledge" },
  { id: "automation", label: "Automation" },
  { id: "ai", label: "AI" },
] as const;

export const platformWorkflowStory = [
  "Customer sends message",
  "AI summarizes",
  "Lead created",
  "Task assigned",
  "Sales follows up",
  "Payment tracked",
  "Customer retained",
] as const;

export const platformCapabilities: Array<{
  id: PlatformCapabilityId;
  eyebrow: string;
  headline: string;
  description: string;
  benefits: string[];
  learnMoreHref: string;
}> = [
  {
    id: "communication",
    eyebrow: "Communication",
    headline: "Semua percakapan customer dalam satu workspace",
    description:
      "WhatsApp, Instagram, Facebook, dan channel lain masuk ke satu inbox operasional—tanpa berpindah aplikasi.",
    benefits: [
      "Balas customer dari satu layar kerja",
      "Konteks percakapan selalu tersedia saat membalas",
      "Tim sales dan support bekerja dari thread yang sama",
    ],
    learnMoreHref: platformSubroutes.communication,
  },
  {
    id: "customer",
    eyebrow: "Customer",
    headline: "Profil customer yang hidup, bukan database statis",
    description:
      "Histori percakapan, aktivitas, transaksi, dan catatan internal tersusun dalam satu customer workspace.",
    benefits: [
      "360° view untuk setiap customer",
      "Timeline aktivitas dari first touch hingga retention",
      "Handoff antar tim tanpa kehilangan konteks",
    ],
    learnMoreHref: platformSubroutes.customer,
  },
  {
    id: "sales",
    eyebrow: "Sales",
    headline: "Pipeline yang terhubung dengan percakapan nyata",
    description:
      "Opportunity, proposal, dan closing berjalan dari konteks customer—not from blank CRM records.",
    benefits: [
      "Lead dan deal terhubung ke conversation",
      "Sales tahu apa yang harus dilakukan berikutnya",
      "Pipeline update tanpa double entry",
    ],
    learnMoreHref: platformSubroutes.sales,
  },
  {
    id: "finance",
    eyebrow: "Finance",
    headline: "Pembayaran terpantau tanpa spreadsheet",
    description:
      "Invoice, DP, outstanding, dan status pembayaran terlihat dalam alur operasional customer.",
    benefits: [
      "Payment status terhubung ke booking dan customer",
      "Finance dan sales melihat angka yang sama",
      "Outstanding tidak lagi tersembunyi di chat",
    ],
    learnMoreHref: platformSubroutes.finance,
  },
  {
    id: "knowledge",
    eyebrow: "Knowledge",
    headline: "Pengetahuan tim tersentral, bukan tersebar",
    description:
      "SOP, FAQ produk, script sales, dan informasi operasional tersedia saat tim membutuhkannya.",
    benefits: [
      "Knowledge hub untuk onboarding tim baru",
      "Jawaban konsisten di semua channel",
      "Kurangi dependensi pada senior staff",
    ],
    learnMoreHref: platformSubroutes.knowledge,
  },
  {
    id: "automation",
    eyebrow: "Automation",
    headline: "Otomatisasi yang menjaga kontrol manusia",
    description:
      "Workflow berulang dipercepat tanpa menghilangkan keputusan manusia di titik-titik kritis.",
    benefits: [
      "Task generation dari event operasional",
      "Reminder dan routing pekerjaan otomatis",
      "Tim tetap memegang kendali akhir",
    ],
    learnMoreHref: platformSubroutes.automation,
  },
  {
    id: "ai",
    eyebrow: "AI",
    headline: "AI di setiap langkah workflow—bukan di sidebar terpisah",
    description:
      "Ringkasan percakapan, intent detection, suggested reply, dan next best action embedded in flow.",
    benefits: [
      "AI summary saat customer message masuk",
      "Saran tindakan berdasarkan konteks lengkap",
      "Keputusan lebih cepat, tanpa auto-send",
    ],
    learnMoreHref: platformSubroutes.ai,
  },
];

export const platformComparison = {
  traditional: {
    title: "Traditional Software",
    items: [
      "Data disimpan, tidak diarahkan",
      "Banyak aplikasi terpisah",
      "CRM, inbox, dan finance tidak terhubung",
      "AI sebagai add-on terpisah",
      "Tim mencari konteks manual",
      "Laporan passive, bukan action",
    ],
  },
  desklabs: {
    title: "Desklabs Platform",
    items: [
      "Workflow mengarahkan pekerjaan harian",
      "Satu platform terintegrasi",
      "Conversation → customer → task → sales → finance",
      "AI embedded di setiap modul",
      "Customer context selalu available",
      "Next best action, bukan hanya dashboard",
    ],
  },
};
