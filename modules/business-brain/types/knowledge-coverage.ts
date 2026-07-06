export const KNOWLEDGE_COVERAGE_CATEGORY_LABELS = [
  "Products",
  "Pricing",
  "Schedule",
  "Itinerary",
  "Visa",
  "Passport",
  "Halal Food",
  "Hotel",
  "Flight",
  "Payment",
  "Refund",
  "Cancellation",
  "Insurance",
  "Private Trip",
  "Group Tour",
  "Umrah",
  "Hajj",
  "Company Information",
  "Terms & Conditions",
  "Complaint Handling",
] as const;

export type KnowledgeCoverageCategoryLabel =
  (typeof KNOWLEDGE_COVERAGE_CATEGORY_LABELS)[number];

export type KnowledgeCoverageStatus = "Excellent" | "Good" | "Fair" | "Poor";

export type KnowledgeCoverageCategoryResult = {
  category: KnowledgeCoverageCategoryLabel;
  coverageScore: number;
  articleCount: number;
  productCount: number;
  documentCount: number;
  status: KnowledgeCoverageStatus;
};

export type KnowledgeCoverageResult = {
  overallCoverage: number;
  categories: KnowledgeCoverageCategoryResult[];
  strongestCategory: KnowledgeCoverageCategoryLabel | null;
  weakestCategory: KnowledgeCoverageCategoryLabel | null;
};

export function knowledgeCoverageStatusFromScore(
  score: number,
): KnowledgeCoverageStatus {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 40) return "Fair";
  return "Poor";
}
