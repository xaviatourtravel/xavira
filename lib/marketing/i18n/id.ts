import { platformSubroutes } from "@/lib/marketing/platform-content";
import { solutionSubroutes } from "@/lib/marketing/solutions-content";

export const marketingContentId = {
  locale: "id" as const,
  brand: {
    name: "Desklabs",
    tagline: "One Platform. Endless Growth.",
    email: "hello@desklabs.id",
  },
  nav: {
    platform: "Platform",
    solutions: "Solusi",
    resources: "Resources",
    pricing: "Harga",
    company: "Perusahaan",
    signIn: "Masuk",
    demo: "Coba Demo",
    viewPlatform: "Lihat Platform",
  },
  hero: {
    badge: "Kelola seluruh perjalanan customer dalam satu platform.",
    headline: "Kelola seluruh perjalanan customer dalam satu platform.",
    subheadline:
      "Dari percakapan pertama hingga follow up, penjualan, pembayaran, dan layanan pelanggan. Semua workflow customer-facing terhubung dalam satu workspace yang didukung AI.",
    primaryCta: "Coba Demo",
    secondaryCta: "Lihat Platform",
  },
  problem: {
    title: "Terlalu banyak aplikasi. Terlalu banyak pekerjaan yang berulang.",
    copy: "Tim customer-facing sering berpindah antara WhatsApp, Instagram, Facebook, spreadsheet, email, dan tools internal. Akibatnya konteks tersebar, follow up terlupakan, dan peluang bisnis hilang.",
    sources: ["WhatsApp", "Instagram", "Facebook", "Spreadsheet", "Email"],
    outcomes: [
      { label: "Konteks tersebar", tone: "warning" as const },
      { label: "Follow up terlewat", tone: "danger" as const },
      { label: "Peluang hilang", tone: "danger" as const },
    ],
  },
  solution: {
    title: "Satu platform untuk seluruh operasional customer.",
    items: [
      {
        id: "communication",
        label: "Komunikasi",
        description: "Semua channel customer masuk ke satu workspace.",
      },
      {
        id: "customer",
        label: "Pelanggan",
        description: "Profil, histori, dan konteks selalu tersedia.",
      },
      {
        id: "tasks",
        label: "Task",
        description: "Pekerjaan operasional menjadi antrian prioritas.",
      },
      {
        id: "sales",
        label: "Penjualan",
        description: "Pipeline dan proses closing lebih terstruktur.",
      },
      {
        id: "finance",
        label: "Keuangan",
        description: "Pembayaran dan outstanding terpantau rapi.",
      },
      {
        id: "knowledge",
        label: "Knowledge",
        description: "SOP dan pengetahuan tim dalam satu hub.",
      },
      {
        id: "ai",
        label: "AI",
        description: "Ringkasan, saran, dan keputusan lebih cepat.",
      },
    ],
  },
  capabilities: {
    title: "Semua kemampuan inti dalam satu platform.",
    items: [
      {
        title: "Komunikasi",
        description:
          "Balas seluruh komunikasi customer tanpa berpindah aplikasi.",
      },
      {
        title: "Pelanggan",
        description:
          "Simpan seluruh histori, konteks, dan aktivitas customer dalam satu tempat.",
      },
      {
        title: "Task",
        description:
          "Ubah pekerjaan operasional menjadi antrian prioritas yang jelas.",
      },
      {
        title: "Penjualan",
        description:
          "Kelola pipeline, peluang, dan proses closing dengan lebih rapi.",
      },
      {
        title: "Keuangan",
        description:
          "Pantau pembayaran, invoice, dan outstanding tanpa spreadsheet.",
      },
      {
        title: "Knowledge",
        description: "Satukan SOP, informasi produk, dan pengetahuan tim.",
      },
      {
        title: "AI",
        description:
          "AI membantu merangkum, menyarankan tindakan, dan mempercepat keputusan.",
      },
      {
        title: "Automation",
        description:
          "Otomatiskan pekerjaan berulang tanpa menghilangkan kontrol manusia.",
      },
    ],
  },
  industries: {
    title: "Dibangun untuk berbagai industri.",
    subtitle:
      "Desklabs memiliki core platform yang sama, lalu dapat disesuaikan melalui solution pack untuk kebutuhan industri berbeda.",
    items: [
      {
        name: "Travel Operations",
        modules: ["Komunikasi", "Operasional", "Keuangan"],
        status: "available" as const,
      },
      {
        name: "Education Operations",
        modules: ["Enrollment", "Task", "Keuangan"],
        status: "coming_soon" as const,
      },
      {
        name: "Property Operations",
        modules: ["Leads", "Visits", "Payments"],
        status: "coming_soon" as const,
      },
      {
        name: "Healthcare Operations",
        modules: ["Appointments", "Patient Care", "Billing"],
        status: "coming_soon" as const,
      },
      {
        name: "Agency Operations",
        modules: ["Clients", "Campaigns", "Delivery"],
        status: "coming_soon" as const,
      },
      {
        name: "Retail Operations",
        modules: ["Inquiries", "Orders", "Support"],
        status: "coming_soon" as const,
      },
    ],
  },
  journey: {
    title: "Dari percakapan menjadi pertumbuhan.",
    steps: [
      "Customer menghubungi bisnis",
      "Tim membalas dari satu workspace",
      "AI merangkum kebutuhan customer",
      "Task dan follow up otomatis tersusun",
      "Sales menutup deal dan menindaklanjuti transaksi",
      "Finance melacak pembayaran",
      "Customer menjadi pelanggan loyal",
    ],
  },
  comparison: {
    title: "Lebih dari sekadar CRM.",
    traditional: {
      title: "Software tradisional",
      items: [
        "Menyimpan data",
        "Banyak aplikasi terpisah",
        "Laporan pasif",
        "AI sebagai fitur tambahan",
        "Tim tetap harus mencari konteks",
      ],
    },
    desklabs: {
      title: "Desklabs",
      items: [
        "Mengarahkan pekerjaan",
        "Semua terhubung dalam satu platform",
        "Memberikan tindakan berikutnya",
        "AI berada di setiap workflow",
        "Customer context selalu tersedia",
      ],
    },
  },
  trust: {
    title: "Dibangun dari operasional nyata.",
    copy: "Desklabs lahir dari kebutuhan operasional bisnis yang menangani banyak percakapan, customer, transaksi, dan follow up setiap hari, bukan dari template software generik.",
    highlights: [
      {
        title: "Dibangun dari operasional harian nyata",
        description:
          "Dirancang dari workflow customer-facing yang benar-benar berjalan setiap hari.",
      },
      {
        title: "Siap untuk berbagai industri",
        description:
          "Core platform yang sama, disesuaikan lewat solution pack per industri.",
      },
      {
        title: "Siap untuk tim customer-facing",
        description:
          "Sales, support, operations, dan finance bekerja dari konteks customer yang sama.",
      },
      {
        title: "AI membantu, manusia yang memutuskan",
        description:
          "AI membantu merangkum dan menyarankan. Keputusan tetap berada di tangan tim.",
      },
    ],
  },
  cta: {
    title: "Siap mengelola customer journey dalam satu platform?",
    copy: "Mulai bangun operasional customer yang lebih rapi, cepat, dan terhubung bersama Desklabs.",
    primary: "Coba Demo",
    secondary: "Hubungi Kami",
  },
  footer: {
    platform: [
      { label: "Komunikasi", href: platformSubroutes.communication },
      { label: "Pelanggan", href: platformSubroutes.customer },
      { label: "Penjualan", href: platformSubroutes.sales },
      { label: "Keuangan", href: platformSubroutes.finance },
      { label: "Knowledge", href: platformSubroutes.knowledge },
      { label: "Automation", href: platformSubroutes.automation },
      { label: "AI", href: platformSubroutes.ai },
    ],
    solutions: [
      { label: "Travel Operations", href: solutionSubroutes.travel },
      { label: "Education Operations", href: "/solutions#education" },
      { label: "Property Operations", href: "/solutions#property" },
      { label: "Healthcare Operations", href: "/solutions#healthcare" },
      { label: "Agency Operations", href: "/solutions#agency" },
      { label: "Retail Operations", href: "/solutions#retail" },
    ],
    resources: [
      { label: "Dokumentasi", href: "#resources" },
      { label: "Product Updates", href: "#resources" },
      { label: "Kebijakan Privasi", href: "/privacy-policy" },
      { label: "Syarat Layanan", href: "/terms" },
    ],
    company: [
      { label: "Tentang", href: "/company" },
      { label: "Demo", href: "/demo" },
      { label: "Kontak", href: "/contact" },
      { label: "Karier", href: "/company" },
    ],
    columnTitles: {
      platform: "Platform",
      solutions: "Solusi",
      resources: "Resources",
      company: "Perusahaan",
    },
  },
} as const;

export type MarketingContentId = typeof marketingContentId;
