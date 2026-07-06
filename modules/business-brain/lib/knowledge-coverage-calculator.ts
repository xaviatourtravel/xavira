import type { BrainDocumentTrigger } from "@/modules/business-brain/types/documents";
import {
  KNOWLEDGE_COVERAGE_CATEGORY_LABELS,
  knowledgeCoverageStatusFromScore,
  type KnowledgeCoverageCategoryLabel,
  type KnowledgeCoverageCategoryResult,
  type KnowledgeCoverageResult,
} from "@/modules/business-brain/types/knowledge-coverage";

export type KnowledgeCoverageSnapshot = {
  articles: Array<{
    id: string;
    title: string;
    category: string;
    status: string;
    content: string;
    keywords: string[];
  }>;
  products: Array<{
    id: string;
    name: string;
    category: string;
    destination: string;
    description: string;
    status: string;
    highlights: string[];
    pricingCount: number;
    departureCount: number;
    hasItinerary: boolean;
  }>;
  documents: Array<{
    id: string;
    name: string;
    description: string;
    tags: string[];
    triggers: BrainDocumentTrigger[];
  }>;
  identity: {
    companyName: string;
    about: string;
    website: string;
  } | null;
  complaintHandoverEnabled: boolean;
  privateTripHandoverEnabled: boolean;
};

type CategoryMatcher = {
  label: KnowledgeCoverageCategoryLabel;
  matchArticles: (snapshot: KnowledgeCoverageSnapshot) => string[];
  matchProducts: (snapshot: KnowledgeCoverageSnapshot) => string[];
  matchDocuments: (snapshot: KnowledgeCoverageSnapshot) => string[];
  bonusScore?: (snapshot: KnowledgeCoverageSnapshot) => number;
};

function parseKeywords(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function parseDocumentTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function textBlob(parts: string[]): string {
  return parts.join(" ").toLowerCase();
}

function matchesPattern(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function articleHaystack(article: KnowledgeCoverageSnapshot["articles"][number]): string {
  return textBlob([article.title, article.content, article.category, ...article.keywords]);
}

function productHaystack(product: KnowledgeCoverageSnapshot["products"][number]): string {
  return textBlob([
    product.name,
    product.category,
    product.destination,
    product.description,
    ...product.highlights,
  ]);
}

function documentHaystack(document: KnowledgeCoverageSnapshot["documents"][number]): string {
  return textBlob([document.name, document.description, ...document.tags]);
}

function articlesByCategory(snapshot: KnowledgeCoverageSnapshot, categories: string[]): string[] {
  const normalized = new Set(categories.map((item) => item.toLowerCase()));
  return snapshot.articles
    .filter((article) => normalized.has(article.category.toLowerCase()))
    .map((article) => article.id);
}

function articlesByPattern(snapshot: KnowledgeCoverageSnapshot, patterns: RegExp[]): string[] {
  return snapshot.articles
    .filter((article) => matchesPattern(articleHaystack(article), patterns))
    .map((article) => article.id);
}

function productsByPattern(snapshot: KnowledgeCoverageSnapshot, patterns: RegExp[]): string[] {
  return snapshot.products
    .filter((product) => product.status !== "archived")
    .filter((product) => matchesPattern(productHaystack(product), patterns))
    .map((product) => product.id);
}

function productsByCategory(snapshot: KnowledgeCoverageSnapshot, categories: string[]): string[] {
  const normalized = new Set(categories.map((item) => item.toLowerCase()));
  return snapshot.products
    .filter((product) => product.status !== "archived")
    .filter((product) => normalized.has(product.category.toLowerCase()))
    .map((product) => product.id);
}

function documentsByTrigger(
  snapshot: KnowledgeCoverageSnapshot,
  triggers: BrainDocumentTrigger[],
): string[] {
  const triggerSet = new Set(triggers);
  return snapshot.documents
    .filter((document) => document.triggers.some((trigger) => triggerSet.has(trigger)))
    .map((document) => document.id);
}

function documentsByPattern(snapshot: KnowledgeCoverageSnapshot, patterns: RegExp[]): string[] {
  return snapshot.documents
    .filter((document) => matchesPattern(documentHaystack(document), patterns))
    .map((document) => document.id);
}

function uniqueCount(ids: string[]): number {
  return new Set(ids).size;
}

function scoreCategory(
  articleCount: number,
  productCount: number,
  documentCount: number,
  bonus = 0,
): number {
  let score = bonus;

  if (articleCount > 0) {
    score += 35 + Math.min(15, (articleCount - 1) * 5);
  }
  if (productCount > 0) {
    score += 30 + Math.min(15, (productCount - 1) * 5);
  }
  if (documentCount > 0) {
    score += 20 + Math.min(10, (documentCount - 1) * 5);
  }

  return Math.max(0, Math.min(100, score));
}

const CATEGORY_MATCHERS: CategoryMatcher[] = [
  {
    label: "Products",
    matchArticles: () => [],
    matchProducts: (snapshot) =>
      snapshot.products
        .filter((product) => product.status !== "archived" && product.name.trim().length > 0)
        .map((product) => product.id),
    matchDocuments: () => [],
  },
  {
    label: "Pricing",
    matchArticles: (snapshot) =>
      articlesByCategory(snapshot, ["payment", "faq"]).concat(
        articlesByPattern(snapshot, [/price|pricing|harga|tarif|biaya|cost/i]),
      ),
    matchProducts: (snapshot) =>
      snapshot.products
        .filter((product) => product.status !== "archived" && product.pricingCount > 0)
        .map((product) => product.id),
    matchDocuments: (snapshot) =>
      documentsByTrigger(snapshot, ["customer_asks_payment"]).concat(
        documentsByPattern(snapshot, [/price|pricing|harga|rate/i]),
      ),
  },
  {
    label: "Schedule",
    matchArticles: (snapshot) =>
      articlesByPattern(snapshot, [/schedule|jadwal|departure|keberangkatan|tanggal/i]),
    matchProducts: (snapshot) =>
      snapshot.products
        .filter((product) => product.status !== "archived" && product.departureCount > 0)
        .map((product) => product.id),
    matchDocuments: () => [],
  },
  {
    label: "Itinerary",
    matchArticles: (snapshot) =>
      articlesByPattern(snapshot, [/itinerary|itinerari|rundown|rencana perjalanan/i]),
    matchProducts: (snapshot) =>
      snapshot.products
        .filter((product) => product.status !== "archived" && product.hasItinerary)
        .map((product) => product.id),
    matchDocuments: (snapshot) =>
      documentsByTrigger(snapshot, ["customer_asks_itinerary"]).concat(
        documentsByPattern(snapshot, [/itinerary|itinerari|rundown/i]),
      ),
  },
  {
    label: "Visa",
    matchArticles: (snapshot) =>
      articlesByCategory(snapshot, ["visa"]).concat(
        articlesByPattern(snapshot, [/visa/i]),
      ),
    matchProducts: (snapshot) => productsByPattern(snapshot, [/visa/i]),
    matchDocuments: (snapshot) => documentsByTrigger(snapshot, ["customer_asks_visa"]),
  },
  {
    label: "Passport",
    matchArticles: (snapshot) =>
      articlesByPattern(snapshot, [/passport|paspor|travel document/i]),
    matchProducts: (snapshot) => productsByPattern(snapshot, [/passport|paspor/i]),
    matchDocuments: (snapshot) => documentsByPattern(snapshot, [/passport|paspor/i]),
  },
  {
    label: "Halal Food",
    matchArticles: (snapshot) =>
      articlesByCategory(snapshot, ["halal"]).concat(
        articlesByPattern(snapshot, [/halal|makanan halal|muslim friendly/i]),
      ),
    matchProducts: (snapshot) =>
      productsByPattern(snapshot, [/halal|muslim friendly|makanan halal/i]),
    matchDocuments: (snapshot) => documentsByPattern(snapshot, [/halal|makanan halal/i]),
  },
  {
    label: "Hotel",
    matchArticles: (snapshot) =>
      articlesByPattern(snapshot, [/hotel|penginapan|akomodasi|accommodation/i]),
    matchProducts: (snapshot) =>
      productsByPattern(snapshot, [/hotel|penginapan|akomodasi|accommodation|star/i]),
    matchDocuments: (snapshot) => documentsByPattern(snapshot, [/hotel|penginapan/i]),
  },
  {
    label: "Flight",
    matchArticles: (snapshot) =>
      articlesByPattern(snapshot, [/flight|penerbangan|tiket pesawat|airline/i]),
    matchProducts: (snapshot) =>
      productsByPattern(snapshot, [/flight|penerbangan|direct flight|tiket pesawat/i]),
    matchDocuments: (snapshot) => documentsByPattern(snapshot, [/flight|penerbangan/i]),
  },
  {
    label: "Payment",
    matchArticles: (snapshot) =>
      articlesByCategory(snapshot, ["payment"]).concat(
        articlesByPattern(snapshot, [/payment|pembayaran|transfer|dp|down payment/i]),
      ),
    matchProducts: () => [],
    matchDocuments: (snapshot) => documentsByTrigger(snapshot, ["customer_asks_payment"]),
  },
  {
    label: "Refund",
    matchArticles: (snapshot) =>
      articlesByCategory(snapshot, ["refund"]).concat(
        articlesByPattern(snapshot, [/refund|pengembalian dana|money back/i]),
      ),
    matchProducts: () => [],
    matchDocuments: (snapshot) => documentsByPattern(snapshot, [/refund|pengembalian/i]),
  },
  {
    label: "Cancellation",
    matchArticles: (snapshot) =>
      articlesByPattern(snapshot, [/cancel|cancellation|pembatalan|batal/i]),
    matchProducts: () => [],
    matchDocuments: (snapshot) => documentsByPattern(snapshot, [/cancel|pembatalan/i]),
  },
  {
    label: "Insurance",
    matchArticles: (snapshot) =>
      articlesByCategory(snapshot, ["insurance"]).concat(
        articlesByPattern(snapshot, [/insurance|asuransi|travel protection/i]),
      ),
    matchProducts: (snapshot) => productsByPattern(snapshot, [/insurance|asuransi/i]),
    matchDocuments: (snapshot) => documentsByPattern(snapshot, [/insurance|asuransi/i]),
  },
  {
    label: "Private Trip",
    matchArticles: (snapshot) =>
      articlesByPattern(snapshot, [/private trip|private tour|custom trip|trip pribadi/i]),
    matchProducts: (snapshot) =>
      productsByCategory(snapshot, ["Custom Package"]).concat(
        productsByPattern(snapshot, [/private|custom trip|trip pribadi/i]),
      ),
    matchDocuments: () => [],
    bonusScore: (snapshot) => (snapshot.privateTripHandoverEnabled ? 20 : 0),
  },
  {
    label: "Group Tour",
    matchArticles: (snapshot) =>
      articlesByPattern(snapshot, [/group tour|group trip|open trip|grup tour/i]),
    matchProducts: (snapshot) =>
      productsByCategory(snapshot, ["Tour Package", "Domestic Tour", "International Tour"]).concat(
        productsByPattern(snapshot, [/group tour|open trip|grup/i]),
      ),
    matchDocuments: () => [],
  },
  {
    label: "Umrah",
    matchArticles: (snapshot) =>
      articlesByPattern(snapshot, [/umrah|umroh/i]),
    matchProducts: (snapshot) =>
      productsByCategory(snapshot, ["Umrah Package"]).concat(
        productsByPattern(snapshot, [/umrah|umroh/i]),
      ),
    matchDocuments: (snapshot) => documentsByPattern(snapshot, [/umrah|umroh/i]),
  },
  {
    label: "Hajj",
    matchArticles: (snapshot) =>
      articlesByPattern(snapshot, [/hajj|haji/i]),
    matchProducts: (snapshot) =>
      productsByCategory(snapshot, ["Hajj Package"]).concat(
        productsByPattern(snapshot, [/hajj|haji/i]),
      ),
    matchDocuments: (snapshot) => documentsByPattern(snapshot, [/hajj|haji/i]),
  },
  {
    label: "Company Information",
    matchArticles: (snapshot) =>
      articlesByPattern(snapshot, [/company profile|tentang kami|about us|profil perusahaan/i]),
    matchProducts: () => [],
    matchDocuments: (snapshot) =>
      documentsByTrigger(snapshot, ["customer_asks_company_profile"]).concat(
        documentsByPattern(snapshot, [/company profile|profil perusahaan/i]),
      ),
    bonusScore: (snapshot) => {
      if (!snapshot.identity) return 0;
      let bonus = 0;
      if (snapshot.identity.companyName.trim()) bonus += 10;
      if (snapshot.identity.about.trim().length >= 20) bonus += 15;
      if (snapshot.identity.website.trim()) bonus += 5;
      return bonus;
    },
  },
  {
    label: "Terms & Conditions",
    matchArticles: (snapshot) =>
      articlesByCategory(snapshot, ["terms"]).concat(
        articlesByPattern(snapshot, [/terms|syarat|ketentuan|conditions/i]),
      ),
    matchProducts: () => [],
    matchDocuments: (snapshot) => documentsByPattern(snapshot, [/terms|syarat|ketentuan/i]),
  },
  {
    label: "Complaint Handling",
    matchArticles: (snapshot) =>
      articlesByPattern(snapshot, [/complaint|komplain|keluhan|handover/i]),
    matchProducts: () => [],
    matchDocuments: () => [],
    bonusScore: (snapshot) => (snapshot.complaintHandoverEnabled ? 45 : 0),
  },
];

function evaluateCategory(
  matcher: CategoryMatcher,
  snapshot: KnowledgeCoverageSnapshot,
): KnowledgeCoverageCategoryResult {
  const articleIds = matcher.matchArticles(snapshot);
  const productIds = matcher.matchProducts(snapshot);
  const documentIds = matcher.matchDocuments(snapshot);

  const articleCount = uniqueCount(articleIds);
  const productCount = uniqueCount(productIds);
  const documentCount = uniqueCount(documentIds);
  const bonus = matcher.bonusScore?.(snapshot) ?? 0;

  const coverageScore = scoreCategory(articleCount, productCount, documentCount, bonus);

  return {
    category: matcher.label,
    coverageScore,
    articleCount,
    productCount,
    documentCount,
    status: knowledgeCoverageStatusFromScore(coverageScore),
  };
}

export function emptyKnowledgeCoverageResult(): KnowledgeCoverageResult {
  const categories = KNOWLEDGE_COVERAGE_CATEGORY_LABELS.map((label) => ({
    category: label,
    coverageScore: 0,
    articleCount: 0,
    productCount: 0,
    documentCount: 0,
    status: knowledgeCoverageStatusFromScore(0),
  }));

  return {
    overallCoverage: 0,
    categories,
    strongestCategory: null,
    weakestCategory: null,
  };
}

function pickStrongestCategory(
  categories: KnowledgeCoverageCategoryResult[],
): KnowledgeCoverageCategoryLabel | null {
  if (categories.length === 0) return null;

  return [...categories].sort((a, b) => {
    if (b.coverageScore !== a.coverageScore) {
      return b.coverageScore - a.coverageScore;
    }
    return a.category.localeCompare(b.category);
  })[0]?.category ?? null;
}

function pickWeakestCategory(
  categories: KnowledgeCoverageCategoryResult[],
): KnowledgeCoverageCategoryLabel | null {
  if (categories.length === 0) return null;

  return [...categories].sort((a, b) => {
    if (a.coverageScore !== b.coverageScore) {
      return a.coverageScore - b.coverageScore;
    }
    return a.category.localeCompare(b.category);
  })[0]?.category ?? null;
}

export function computeKnowledgeCoverageFromSnapshot(
  snapshot: KnowledgeCoverageSnapshot,
): KnowledgeCoverageResult {
  const categories = CATEGORY_MATCHERS.map((matcher) => evaluateCategory(matcher, snapshot));

  const overallCoverage = Math.round(
    categories.reduce((sum, category) => sum + category.coverageScore, 0) /
      categories.length,
  );

  return {
    overallCoverage,
    categories,
    strongestCategory: pickStrongestCategory(categories),
    weakestCategory: pickWeakestCategory(categories),
  };
}

export function getWeakestCoverageCategories(
  categories: KnowledgeCoverageCategoryResult[],
  limit = 3,
): KnowledgeCoverageCategoryResult[] {
  return [...categories]
    .sort((a, b) => {
      if (a.coverageScore !== b.coverageScore) {
        return a.coverageScore - b.coverageScore;
      }
      return a.category.localeCompare(b.category);
    })
    .slice(0, limit);
}

export function coverageScoreIndicator(score: number): "green" | "yellow" | "red" {
  if (score >= 70) return "green";
  if (score >= 40) return "yellow";
  return "red";
}
