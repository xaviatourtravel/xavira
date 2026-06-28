export const solutionSubroutes = {
  travel: "/solutions/travel",
} as const;

export type SolutionIndustryId =
  | "travel"
  | "education"
  | "property"
  | "healthcare"
  | "agency"
  | "retail";

export const corePlatformLayers = [
  "Communication",
  "Customer",
  "Task",
  "Sales",
  "Finance",
  "Knowledge",
  "Automation",
  "AI",
] as const;

export const industryPackLabels = [
  "Travel",
  "Education",
  "Property",
  "Healthcare",
  "Agency",
  "Retail",
] as const;

export const solutionIndustries: Array<{
  id: SolutionIndustryId;
  name: string;
  shortDescription: string;
  workflows: string[];
  status: "available" | "coming_soon";
  exploreHref?: string;
  exploreLabel?: string;
  detailHeadline: string;
  detailDescription: string;
}> = [
  {
    id: "travel",
    name: "Travel Operations",
    shortDescription:
      "Kelola inquiry, booking, peserta, pembayaran, dan follow-up perjalanan dalam satu workspace.",
    workflows: [
      "Package management",
      "Customer inquiry",
      "Booking",
      "Participants",
      "Payment tracking",
      "Follow-up",
      "Knowledge hub",
    ],
    status: "available",
    exploreHref: solutionSubroutes.travel,
    exploreLabel: "Explore Travel Solution",
    detailHeadline: "Operasional travel yang terhubung dari inquiry hingga keberangkatan",
    detailDescription:
      "Solution pack pertama yang sudah tersedia—dirancang untuk tim travel yang menangani inquiry cepat, booking kompleks, dan pembayaran bertahap.",
  },
  {
    id: "education",
    name: "Education Operations",
    shortDescription:
      "Admission, komunikasi orang tua, pembayaran, dan follow-up kelas dalam alur yang rapi.",
    workflows: [
      "Student inquiry",
      "Admission pipeline",
      "Parent communication",
      "Payment tracking",
      "Class follow-up",
      "Knowledge base",
    ],
    status: "coming_soon",
    exploreLabel: "Coming Soon",
    detailHeadline: "Admission dan komunikasi orang tua tanpa spreadsheet",
    detailDescription:
      "Petakan perjalanan calon siswa dari inquiry pertama hingga enrollment—dengan komunikasi orang tua dan pembayaran terpantau.",
  },
  {
    id: "property",
    name: "Property Operations",
    shortDescription:
      "Lead properti, site visit, deal pipeline, dan milestone pembayaran untuk tim sales properti.",
    workflows: [
      "Lead inquiry",
      "Unit interest",
      "Site visit",
      "Deal pipeline",
      "Payment milestones",
      "Agent assignment",
    ],
    status: "coming_soon",
    exploreLabel: "Coming Soon",
    detailHeadline: "Pipeline properti dari lead hingga closing unit",
    detailDescription:
      "Kelola minat unit, jadwal site visit, dan milestone pembayaran dengan konteks customer yang selalu tersedia untuk agent.",
  },
  {
    id: "healthcare",
    name: "Healthcare Operations",
    shortDescription:
      "Inquiry pasien, follow-up appointment, paket treatment, dan komunikasi dalam satu alur.",
    workflows: [
      "Patient inquiry",
      "Appointment follow-up",
      "Treatment packages",
      "Payment tracking",
      "Patient communication",
    ],
    status: "coming_soon",
    exploreLabel: "Coming Soon",
    detailHeadline: "Perjalanan pasien yang terstruktur tanpa kehilangan konteks",
    detailDescription:
      "Dari inquiry pertama hingga follow-up treatment—tim front office dan care coordinator bekerja dari workspace yang sama.",
  },
  {
    id: "agency",
    name: "Agency Operations",
    shortDescription:
      "Client inquiry, proposal, onboarding proyek, dan komunikasi klien dalam satu platform.",
    workflows: [
      "Client inquiry",
      "Proposal pipeline",
      "Project onboarding",
      "Payment tracking",
      "Client communication",
    ],
    status: "coming_soon",
    exploreLabel: "Coming Soon",
    detailHeadline: "Dari pitch deck hingga delivery—klien tetap terhubung",
    detailDescription:
      "Agency service business membutuhkan alur proposal, onboarding, dan komunikasi yang konsisten. Desklabs memetakannya ke workflow operasional.",
  },
  {
    id: "retail",
    name: "Retail Operations",
    shortDescription:
      "Inquiry customer, order support, histori pembelian, dan follow-up repeat purchase.",
    workflows: [
      "Customer inquiry",
      "Order support",
      "Customer history",
      "Payment tracking",
      "Repeat purchase follow-up",
    ],
    status: "coming_soon",
    exploreLabel: "Coming Soon",
    detailHeadline: "Retail customer journey yang personal dan terpantau",
    detailDescription:
      "Support order, histori pembelian, dan follow-up repeat purchase—semua terhubung ke profil customer yang sama.",
  },
];
