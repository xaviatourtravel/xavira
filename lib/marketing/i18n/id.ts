import { platformSubroutes } from "@/lib/marketing/platform-content";
import { marketingHomeAnchors } from "@/lib/marketing/routes";
import { solutionSubroutes } from "@/lib/marketing/solutions-content";

export const marketingContentId = {
  locale: "id" as const,
  brand: {
    name: "Desklabs",
    tagline: "Customer Operations Platform untuk bisnis layanan modern.",
    email: "hello@desklabs.id",
  },
  nav: {
    platform: "Platform",
    solutions: "Solusi",
    industries: "Industri",
    pricing: "Harga",
    resources: "Sumber Daya",
    company: "Perusahaan",
    signIn: "Masuk",
    startFree: "Mulai Gratis",
    seeDemo: "Lihat Demo",
  },
  hero: {
    eyebrow: "Customer Operations Platform",
    headline: "Satukan seluruh operasional pelanggan dalam satu workspace.",
    subheadline:
      "Kelola percakapan, CRM, proses operasional, pembayaran, otomatisasi, dan AI tanpa berpindah-pindah aplikasi.",
    primaryCta: "Mulai Gratis",
    secondaryCta: "Lihat Demo",
    microcopy:
      "Siap digunakan untuk tim layanan, penjualan, dan operasional.",
  },
  trust: {
    statement: "Dibangun untuk bisnis layanan yang berfokus pada pelanggan.",
    industries: ["Travel", "Education", "Healthcare", "Property", "Agency"],
  },
  industries: {
    title: "Satu platform. Beragam cara bisnis melayani pelanggan.",
    description:
      "Desklabs menyediakan fondasi yang sama — komunikasi, data pelanggan, workflow, pembayaran, dan AI — lalu menyesuaikannya dengan cara kerja setiap industri.",
    cta: "Jelajahi semua solusi industri",
    items: [
      {
        id: "travel" as const,
        name: "Travel & Tourism",
        description:
          "Dari inquiry dan quotation sampai booking, pembayaran, dokumen, dan keberangkatan.",
        workflow: "Inquiry → Quotation → Booking → Departure",
        status: "available" as const,
      },
      {
        id: "education" as const,
        name: "Education",
        description:
          "Kelola inquiry, admission, komunikasi orang tua atau siswa, pembayaran, dan aktivitas belajar.",
        workflow: "Inquiry → Admission → Enrollment → Student Support",
        status: "coming_soon" as const,
      },
      {
        id: "healthcare" as const,
        name: "Healthcare",
        description:
          "Rapikan komunikasi pasien, appointment, reminder, intake, dan koordinasi layanan non-klinis.",
        workflow: "Inquiry → Appointment → Reminder → Follow-up",
        status: "coming_soon" as const,
      },
      {
        id: "property" as const,
        name: "Property",
        description:
          "Tangani lead, jadwal viewing, unit yang diminati, follow-up, deal, dan pembayaran.",
        workflow: "Lead → Viewing → Negotiation → Deal",
        status: "coming_soon" as const,
      },
      {
        id: "agency" as const,
        name: "Agency & Professional Services",
        description:
          "Hubungkan lead, proposal, project handoff, invoice, dan hubungan klien dalam satu alur.",
        workflow: "Lead → Proposal → Project → Invoice",
        status: "coming_soon" as const,
      },
    ],
  },
  problems: {
    title: "Bisnis layanan seharusnya tidak terasa seacak ini.",
    items: [
      {
        problem: "Percakapan tersebar di banyak channel",
        problemDetail:
          "Tim kehilangan konteks karena WhatsApp, Instagram, email, dan channel lain berjalan sendiri-sendiri.",
        solution: "Unified Communication Workspace",
        solutionDetail:
          "Semua percakapan masuk ke satu workspace dengan assignment, status, dan konteks pelanggan yang sama.",
      },
      {
        problem: "Lead dan pelanggan terlewat",
        problemDetail:
          "Informasi penting terkunci di chat pribadi, spreadsheet, catatan manual, dan kepala anggota tim.",
        solution: "Shared CRM & Customer Timeline",
        solutionDetail:
          "Satu riwayat pelanggan yang bisa dipercaya — percakapan, aktivitas, kebutuhan, dan transaksi dalam satu tempat.",
      },
      {
        problem: "Operasional hidup di spreadsheet dan tools terpisah",
        problemDetail:
          "Penjualan, booking, appointment, project, pembayaran, dan dokumen tidak punya sumber data yang sama.",
        solution: "One Connected Operations Workspace",
        solutionDetail:
          "Workflow operasional terhubung dengan data pelanggan yang sama, tanpa duplikasi pekerjaan.",
      },
      {
        problem: "Follow-up bergantung pada ingatan dan pekerjaan manual",
        problemDetail:
          "Peluang hilang bukan karena produknya buruk, tetapi karena tidak ada sistem yang menjaga tindak lanjut.",
        solution: "Automation & Aurora AI Assistance",
        solutionDetail:
          "Otomatisasi dan AI membantu mengingatkan, menyarankan, dan menyiapkan tindakan — manusia tetap memegang keputusan.",
      },
    ],
  },
  platformCore: {
    title: "Semua yang dibutuhkan tim Anda, bekerja sebagai satu sistem.",
    description:
      "Desklabs menghubungkan percakapan, customer record, workflow operasional, pembayaran, dan AI. Saat satu hal berubah, seluruh tim melihat konteks yang sama.",
    modules: [
      "Communication",
      "CRM",
      "Operations",
      "Finance",
      "Automation",
      "Aurora AI",
      "Analytics",
    ],
  },
  productModules: {
    title: "Modul inti platform",
    description: "Satu operating system terhubung — bukan tujuh SaaS yang terpisah.",
    items: [
      {
        id: "communication" as const,
        title: "Communication Workspace",
        outcome: "Semua percakapan. Satu tempat kerja.",
        capabilities: [
          "WhatsApp, Instagram, email, dan channel lain dalam satu inbox",
          "Assignment, status, dan customer context di setiap percakapan",
        ],
      },
      {
        id: "crm" as const,
        title: "CRM",
        outcome: "Satu riwayat pelanggan yang bisa dipercaya.",
        capabilities: [
          "Timeline percakapan, aktivitas, dan transaksi",
          "Catatan internal dan perubahan status yang terlihat tim",
        ],
      },
      {
        id: "operations" as const,
        title: "Operations",
        outcome: "Workflow yang mengikuti cara bisnis Anda bekerja.",
        capabilities: [
          "Template operasional per industri",
          "Booking, admission, appointment, project, dan dokumen",
        ],
      },
      {
        id: "finance" as const,
        title: "Finance",
        outcome: "Pembayaran dan kewajiban yang jelas.",
        capabilities: [
          "Invoice, cicilan, jatuh tempo, dan refund",
          "Nilai pelanggan dalam konteks operasional yang sama",
        ],
      },
      {
        id: "automation" as const,
        title: "Automation",
        outcome: "Kurangi pekerjaan berulang tanpa kehilangan kontrol.",
        capabilities: [
          "Assignment, reminder, follow-up, dan handoff",
          "Aturan berdasarkan kondisi bisnis",
        ],
      },
      {
        id: "aurora" as const,
        title: "Aurora AI",
        outcome: "AI yang membantu tim mengambil keputusan, bukan mengambil alih.",
        capabilities: [
          "Ringkasan percakapan dan rekomendasi langkah berikutnya",
          "Draft balasan dengan persetujuan manusia",
        ],
      },
      {
        id: "analytics" as const,
        title: "Analytics",
        outcome: "Pantau operasional dengan data yang konsisten.",
        capabilities: [
          "Response time, conversion, workload, dan revenue",
          "Bottleneck operasional yang mudah diaudit",
        ],
      },
    ],
  },
  aurora: {
    eyebrow: "Aurora AI",
    title: "Rekan kerja AI yang memahami konteks pelanggan Anda.",
    description:
      "Aurora membaca informasi yang sudah dimiliki tim, membantu menemukan hal penting, dan menyiapkan tindakan berikutnya — tanpa membuat workspace terasa ramai.",
    reassurance:
      "Tim Anda tetap meninjau dan memutuskan setiap tindakan sebelum dijalankan.",
    capabilities: [
      "Merangkum percakapan",
      "Mengidentifikasi intent dan data yang belum lengkap",
      "Menyarankan balasan",
      "Mencocokkan workflow atau layanan",
      "Mengingatkan follow-up",
      "Menjelaskan alasan rekomendasi",
    ],
    steps: [
      {
        title: "Pelanggan mengirim pesan",
        description: "Percakapan masuk ke Communication Workspace.",
      },
      {
        title: "Aurora memahami konteks",
        description: "AI membaca riwayat, status, dan kebutuhan pelanggan.",
      },
      {
        title: "Aurora merangkum atau menyiapkan balasan",
        description: "Ringkasan dan draft balasan siap ditinjau tim.",
      },
      {
        title: "Manusia meninjau",
        description: "Tim memverifikasi sebelum tindakan dijalankan.",
      },
      {
        title: "Manusia mengirim atau menyetujui",
        description: "Keputusan akhir tetap berada di tangan tim.",
      },
    ],
    cta: "Lihat Aurora bekerja",
  },
  workflow: {
    title: "Dari percakapan pertama sampai pekerjaan selesai.",
    description:
      "Alur universal yang berlaku untuk berbagai industri — dengan label yang dapat disesuaikan per bisnis.",
    steps: [
      "Conversation",
      "Qualification",
      "Proposal or Quotation",
      "Operation or Appointment",
      "Payment",
      "Delivery or Service",
      "Follow-up",
    ],
  },
  proof: {
    title: "Lebih sedikit perpindahan aplikasi. Lebih banyak pekerjaan selesai.",
    disconnected: {
      title: "Tools terpisah",
      items: [
        "Inbox terpisah per channel",
        "Spreadsheet untuk tracking",
        "Data pelanggan tersebar",
        "Follow-up manual dan mudah terlewat",
        "Pekerjaan duplikat antar tim",
      ],
    },
    desklabs: {
      title: "Desklabs",
      items: [
        "Satu konteks pelanggan untuk seluruh tim",
        "Satu communication workspace",
        "Operasional terhubung",
        "Follow-up dibantu otomatisasi dan AI",
        "Visibilitas tim yang shared",
      ],
    },
    outcomes: [
      "Response time lebih konsisten",
      "Follow-up lebih terjaga",
      "Handoff antartim lebih jelas",
      "Data pelanggan lebih lengkap",
      "Operasional lebih mudah diaudit",
    ],
  },
  pricing: {
    title: "Paket yang tumbuh bersama tim Anda.",
    description:
      "Mulai dari workspace yang dibutuhkan sekarang. Berkembang tanpa mengganti sistem.",
    plans: [
      {
        name: "Starter",
        description:
          "Untuk tim kecil yang ingin merapikan komunikasi dan CRM pelanggan.",
        cta: "Mulai Gratis",
      },
      {
        name: "Growth",
        description:
          "Untuk tim operasional yang membutuhkan workflow, finance, dan automasi terhubung.",
        cta: "Hubungi Tim",
      },
      {
        name: "Enterprise",
        description:
          "Untuk organisasi dengan kebutuhan multi-tim, integrasi, dan konfigurasi khusus.",
        cta: "Jadwalkan Demo",
      },
    ],
    disclaimer:
      "Harga dan paket detail akan diumumkan. Hubungi tim kami untuk membahas kebutuhan spesifik.",
  },
  faq: {
    title: "Pertanyaan yang sering diajukan",
    items: [
      {
        question: "Apa itu Desklabs?",
        answer:
          "Desklabs adalah Customer Operations Platform yang membantu bisnis layanan mengelola komunikasi, CRM, operasional, finance, automasi, dan AI dalam satu workspace terhubung.",
      },
      {
        question: "Jenis bisnis apa yang bisa menggunakan Desklabs?",
        answer:
          "Desklabs dirancang untuk bisnis berbasis layanan — travel, education, healthcare, property, agency, dan bisnis customer-facing lainnya yang menangani inquiry, follow-up, dan operasional pelanggan.",
      },
      {
        question: "Apakah Desklabs menggantikan WhatsApp?",
        answer:
          "Tidak. Desklabs menghubungkan channel seperti WhatsApp ke dalam satu workspace sehingga tim dapat membalas, melacak konteks, dan menindaklanjuti tanpa kehilangan riwayat percakapan.",
      },
      {
        question: "Bisakah Desklabs disesuaikan dengan industri berbeda?",
        answer:
          "Ya. Desklabs memiliki core platform yang sama, lalu menyesuaikan workflow, terminologi, dan template operasional untuk setiap industri.",
      },
      {
        question: "Bagaimana Aurora AI bekerja?",
        answer:
          "Aurora membaca konteks pelanggan yang sudah ada, merangkum percakapan, menyarankan balasan, dan merekomendasikan langkah berikutnya. Tim tetap meninjau dan memutuskan setiap tindakan.",
      },
      {
        question: "Bisakah tim kami meminta demo?",
        answer:
          "Ya. Anda dapat menjadwalkan demo melalui halaman demo atau menghubungi tim kami langsung.",
      },
      {
        question: "Apakah Desklabs sudah tersedia?",
        answer:
          "Core platform dan solusi Travel sudah tersedia. Solution pack untuk industri Education, Healthcare, Property, dan Agency sedang dalam pengembangan — hubungi tim kami untuk detail ketersediaan.",
      },
    ],
  },
  finalCta: {
    title: "Satukan setiap operasi pelanggan dalam satu workspace yang tenang.",
    description:
      "Mulai dengan communication workspace, lalu hubungkan CRM, operasional, finance, dan AI sesuai kebutuhan bisnis Anda.",
    reassurance: "Tidak perlu kartu kredit untuk mencoba workspace dasar.",
    primaryCta: "Mulai Gratis",
    secondaryCta: "Lihat Demo",
  },
  footer: {
    statement:
      "Desklabs membantu bisnis layanan mengelola komunikasi, pelanggan, operasional, dan AI dalam satu workspace yang tenang.",
    platform: [
      { label: "Komunikasi", href: platformSubroutes.communication },
      { label: "Pelanggan", href: platformSubroutes.customer },
      { label: "Penjualan", href: platformSubroutes.sales },
      { label: "Keuangan", href: platformSubroutes.finance },
      { label: "Knowledge", href: platformSubroutes.knowledge },
      { label: "Automation", href: platformSubroutes.automation },
      { label: "AI", href: platformSubroutes.ai },
    ],
    industries: [
      { label: "Travel", href: solutionSubroutes.travel },
      { label: "Education", href: "/solutions#education" },
      { label: "Property", href: "/solutions#property" },
      { label: "Healthcare", href: "/solutions#healthcare" },
      { label: "Agency", href: "/solutions#agency" },
    ],
    resources: [
      { label: "FAQ", href: marketingHomeAnchors.faq },
      { label: "Demo", href: "/demo" },
      { label: "Kontak", href: "/contact" },
      { label: "Kebijakan Privasi", href: "/privacy-policy" },
    ],
    company: [
      { label: "Tentang", href: "/company" },
      { label: "Demo", href: "/demo" },
      { label: "Kontak", href: "/contact" },
    ],
    columnTitles: {
      platform: "Platform",
      industries: "Industri",
      resources: "Sumber Daya",
      company: "Perusahaan",
    },
  },
} as const;

export type MarketingContentId = typeof marketingContentId;
