import {
  parsePackageStructure,
  type ParsedPackageStructure,
} from "@/lib/packages/parse-package-structure";

export type PackageContentSource = {
  id: string;
  name: string;
  destination: string | null;
  departure_date: string | null;
  duration_days: number | null;
  price_idr: number | null;
  quota: number | null;
  status: string;
};

export type PackageCategory = "umroh" | "halal_tour" | "travel";

export type AiContentMarketingContext = {
  targetAudience: string[];
  positioning: string;
  painPoints: string[];
  gainPoints: string[];
  packageHighlights: string[];
  halalAdvantages: string[];
};

export type PackageContentContext = {
  packageId: string;
  rawTitle: string;
  structured: ParsedPackageStructure & {
    highlights: string[];
    halalSellingPoints: string[];
  };
  marketing: AiContentMarketingContext;
  packageCategory: PackageCategory;
  priceLabel: string | null;
  quotaLabel: string | null;
  status: string;
};

function formatOptionalCurrency(value: number | null) {
  if (value == null) {
    return null;
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function inferPackageCategory(
  packageName: string,
  destinations: string[],
): PackageCategory {
  const combined = `${packageName} ${destinations.join(" ")}`.toLowerCase();

  if (/umroh|umrah|haji|makkah|madinah|mekah|medina/i.test(combined)) {
    return "umroh";
  }

  if (/halal|muslim|islam/i.test(combined)) {
    return "halal_tour";
  }

  return "travel";
}

function buildPackageHighlights(
  structured: ParsedPackageStructure,
  category: PackageCategory,
  durationDays: number | null,
): string[] {
  const highlights: string[] = [];

  if (structured.destinations.length > 1) {
    highlights.push(
      `Rute multi-kota: ${structured.destinations.join(" → ")}`,
    );
  } else if (structured.destinations.length === 1) {
    highlights.push(`Fokus eksplorasi ${structured.destinations[0]}`);
  }

  if (structured.duration) {
    highlights.push(`Durasi ${structured.duration}`);
  } else if (durationDays) {
    highlights.push(`Program ${durationDays} hari`);
  }

  if (structured.departureMonth) {
    highlights.push(`Keberangkatan ${structured.departureMonth}`);
  }

  if (category === "umroh") {
    highlights.push("Rangkaian ibadah dan ziarah terstruktur");
    highlights.push("Pendampingan jamaah dari keberangkatan hingga pulang");
  } else if (category === "halal_tour") {
    highlights.push("Itinerary dirancang untuk traveler Muslim");
    highlights.push("Kombinasi wisata, kuliner halal, dan pengalaman lokal");
  } else if (structured.destinations.length > 0) {
    highlights.push(
      `Pengalaman curated di ${structured.destinations.join(", ")}`,
    );
  }

  return highlights.slice(0, 6);
}

function buildHalalSellingPoints(
  structured: ParsedPackageStructure,
  category: PackageCategory,
): string[] {
  if (category === "umroh") {
    return [
      "Perjalanan ibadah dengan fokus kenyamanan dan ketenangan jamaah",
      "Pendampingan spiritual selama di tanah suci",
      structured.destinations.length > 0
        ? `Ziarah terarah di ${structured.destinations.join(", ")}`
        : "Manajemen ibadah yang terencana",
    ];
  }

  if (category === "halal_tour") {
    return [
      "Standar makanan halal dan aktivitas ramah Muslim",
      "Cocok untuk keluarga yang ingin liburan tanpa kompromi prinsip",
      structured.destinations.length > 0
        ? `Pengalaman halal autentik di ${structured.destinations.join(", ")}`
        : "Itinerary halal-first dari awal perencanaan",
    ];
  }

  return [
    "Positioning travel premium untuk audiens Muslim",
    structured.destinations.length > 0
      ? `Nuansa destinasi ${structured.destinations.join(", ")} yang relevan untuk traveler halal`
      : "Pendekatan travel yang mindful dan terpercaya",
  ];
}

function buildMarketingContext(
  structured: ParsedPackageStructure,
  category: PackageCategory,
  quota: number | null,
  packageHighlights: string[],
  halalAdvantages: string[],
): AiContentMarketingContext {
  const destinationLabel =
    structured.destinations.length > 0
      ? structured.destinations.join(", ")
      : "destinasi paket";

  if (category === "umroh") {
    return {
      targetAudience: [
        "Jamaah Umroh pertama kali yang butuh pendampingan jelas",
        "Keluarga Muslim yang ingin ibadah tanpa repot logistik",
        "Profesional Muslim yang mengutamakan kenyamanan dan kepercayaan",
      ],
      positioning: `Perjalanan ibadah ${structured.packageName} dengan nuansa premium, terstruktur, dan menenangkan.`,
      painPoints: [
        "Takut salah langkah atau kewalahan saat pertama kali Umroh",
        "Khawatir itinerary berantakan dan jamaah kelelahan",
        "Bingung memilih travel yang benar-benar peduli kenyamanan ibadah",
      ],
      gainPoints: [
        "Itinerary jelas sehingga fokus ke ibadah, bukan mikir logistik",
        "Pendampingan yang memberi rasa aman dari awal sampai pulang",
        "Pengalaman spiritual yang terasa tenang, bukan terburu-buru",
      ],
      packageHighlights,
      halalAdvantages,
    };
  }

  if (category === "halal_tour") {
    return {
      targetAudience: [
        "Keluarga Muslim yang ingin liburan halal tanpa kompromi",
        "Pasangan atau young professional Muslim yang suka travel premium",
        "Traveler Muslim yang bosan paket wisata generic tanpa sentuhan halal",
      ],
      positioning: `${structured.packageName} sebagai halal travel premium ke ${destinationLabel} — curated, nyaman, dan relevan untuk gaya hidup Muslim.`,
      painPoints: [
        "Ragu soal makanan halal dan aktivitas yang aman di luar negeri",
        "Bosen konten wisata generic yang tidak speak to kebutuhan Muslim",
        "Takut itinerary melelahkan dan tidak cocok untuk keluarga",
      ],
      gainPoints: [
        `Eksplorasi ${destinationLabel} dengan standar halal yang jelas`,
        "Pengalaman travel yang terasa premium, bukan paket murah generic",
        "Konten dan perjalanan yang relevan untuk lifestyle Muslim modern",
      ],
      packageHighlights,
      halalAdvantages,
    };
  }

  return {
    targetAudience: [
      "Muslim travelers yang mencari pengalaman travel berkualitas",
      "Keluarga dan pasangan yang ingin liburan memorable",
      "Audiens Instagram yang suka storytelling travel autentik",
    ],
    positioning: `${structured.packageName} sebagai travel experience premium ke ${destinationLabel}.`,
    painPoints: [
      "Muak dengan copy travel yang klise dan tidak spesifik",
      "Ingin liburan yang terasa curated, bukan paket asal-asalan",
      quota != null
        ? "Opportunity seat terbatas bikin galau mau booking atau nunda"
        : "Sulit menemukan travel brand yang terasa trustworthy",
    ],
    gainPoints: [
      `Highlight destinasi spesifik: ${destinationLabel}`,
      structured.duration
        ? `Durasi pas untuk explore tanpa terburu-buru (${structured.duration})`
        : "Durasi perjalanan yang seimbang antara explore dan istirahat",
      "Brand voice yang hangat, premium, dan siap publish di Reels/Carousel",
    ],
    packageHighlights,
    halalAdvantages,
  };
}

function list(items: string[]) {
  return items.length > 0
    ? items.map((item) => `- ${item}`).join("\n")
    : "- Tidak ada data";
}

export function buildPackageContentContext(
  pkg: PackageContentSource,
): PackageContentContext {
  const structuredBase = parsePackageStructure({
    rawName: pkg.name,
    destination: pkg.destination,
    departureDate: pkg.departure_date,
    durationDays: pkg.duration_days,
  });

  const packageCategory = inferPackageCategory(
    structuredBase.packageName,
    structuredBase.destinations,
  );

  const highlights = buildPackageHighlights(
    structuredBase,
    packageCategory,
    pkg.duration_days,
  );
  const halalSellingPoints = buildHalalSellingPoints(
    structuredBase,
    packageCategory,
  );

  const structured = {
    ...structuredBase,
    highlights,
    halalSellingPoints,
  };

  return {
    packageId: pkg.id,
    rawTitle: pkg.name,
    structured,
    marketing: buildMarketingContext(
      structuredBase,
      packageCategory,
      pkg.quota,
      highlights,
      halalSellingPoints,
    ),
    packageCategory,
    priceLabel: formatOptionalCurrency(pkg.price_idr),
    quotaLabel: pkg.quota != null ? `${pkg.quota} seat` : null,
    status: pkg.status,
  };
}

export function formatPackageContentContextForPrompt(
  context: PackageContentContext,
) {
  const { structured, marketing } = context;
  const destinations =
    structured.destinations.length > 0
      ? structured.destinations.join(", ")
      : "TIDAK TERSEDIA — jangan mengarang destinasi";

  return `
STRUKTUR PAKET (internal — jangan copy-paste judul mentah ke konten):
- package_name: ${structured.packageName}
- duration: ${structured.duration ?? "TIDAK TERSEDIA"}
- departure_month: ${structured.departureMonth ?? "TIDAK TERSEDIA — jangan mengarang jadwal"}
- destinations: ${destinations}

Judul database (HANYA referensi internal, DILARANG dipakai verbatim di konten):
"${context.rawTitle}"

Highlight paket:
${list(structured.highlights)}

Halal selling points:
${list(structured.halalSellingPoints)}

Data operasional:
- Harga: ${context.priceLabel ?? "TIDAK TERSEDIA — jangan mengarang harga"}
- Kuota: ${context.quotaLabel ?? "TIDAK TERSEDIA — jangan mengarang ketersediaan seat"}
- Status: ${context.status}
- Kategori: ${context.packageCategory}

AI CONTENT CONTEXT:
Target audience:
${list(marketing.targetAudience)}

Positioning:
${marketing.positioning}

Pain points:
${list(marketing.painPoints)}

Gain points:
${list(marketing.gainPoints)}

Package highlights:
${list(marketing.packageHighlights)}

Halal advantages:
${list(marketing.halalAdvantages)}
`.trim();
}
