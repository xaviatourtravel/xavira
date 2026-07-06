import type { KnowledgeCoverageCategoryLabel } from "@/modules/business-brain/types/knowledge-coverage";

export type KnowledgeCoverageNavTarget = {
  targetPage: string;
  quickAddLabel: string;
};

export const KNOWLEDGE_COVERAGE_CATEGORY_NAV: Record<
  KnowledgeCoverageCategoryLabel,
  KnowledgeCoverageNavTarget
> = {
  Products: {
    targetPage: "/business-brain/products",
    quickAddLabel: "Add Product",
  },
  Pricing: {
    targetPage: "/business-brain/products",
    quickAddLabel: "Add Pricing",
  },
  Schedule: {
    targetPage: "/business-brain/products",
    quickAddLabel: "Add Schedule",
  },
  Itinerary: {
    targetPage: "/business-brain/products",
    quickAddLabel: "Add Itinerary",
  },
  Visa: {
    targetPage: "/business-brain/knowledge?category=visa",
    quickAddLabel: "Add Visa Article",
  },
  Passport: {
    targetPage: "/business-brain/knowledge",
    quickAddLabel: "Add Passport Info",
  },
  "Halal Food": {
    targetPage: "/business-brain/knowledge?category=halal",
    quickAddLabel: "Add Halal Article",
  },
  Hotel: {
    targetPage: "/business-brain/knowledge",
    quickAddLabel: "Add Hotel Info",
  },
  Flight: {
    targetPage: "/business-brain/knowledge",
    quickAddLabel: "Add Flight Info",
  },
  Payment: {
    targetPage: "/business-brain/knowledge?category=payment",
    quickAddLabel: "Add Payment Policy",
  },
  Refund: {
    targetPage: "/business-brain/knowledge?category=refund",
    quickAddLabel: "Create Refund Policy",
  },
  Cancellation: {
    targetPage: "/business-brain/knowledge",
    quickAddLabel: "Add Cancellation Policy",
  },
  Insurance: {
    targetPage: "/business-brain/knowledge?category=insurance",
    quickAddLabel: "Add Insurance Article",
  },
  "Private Trip": {
    targetPage: "/business-brain/behaviors",
    quickAddLabel: "Add Private Trip Rule",
  },
  "Group Tour": {
    targetPage: "/business-brain/products",
    quickAddLabel: "Add Group Tour",
  },
  Umrah: {
    targetPage: "/business-brain/products",
    quickAddLabel: "Add Umrah Package",
  },
  Hajj: {
    targetPage: "/business-brain/products",
    quickAddLabel: "Add Hajj Package",
  },
  "Company Information": {
    targetPage: "/business-brain/identity",
    quickAddLabel: "Complete Identity",
  },
  "Terms & Conditions": {
    targetPage: "/business-brain/knowledge?category=terms",
    quickAddLabel: "Add Terms",
  },
  "Complaint Handling": {
    targetPage: "/business-brain/behaviors",
    quickAddLabel: "Add Handover Rule",
  },
};

const KNOWLEDGE_COVERAGE_CATEGORY_SHORT_LABELS: Partial<
  Record<KnowledgeCoverageCategoryLabel, string>
> = {
  "Complaint Handling": "Complaint",
  "Terms & Conditions": "Terms",
  "Company Information": "Company",
};

export function knowledgeCoverageCategoryDisplayName(
  label: KnowledgeCoverageCategoryLabel,
): string {
  return KNOWLEDGE_COVERAGE_CATEGORY_SHORT_LABELS[label] ?? label;
}

export function getKnowledgeCoverageNavTarget(
  label: KnowledgeCoverageCategoryLabel,
): KnowledgeCoverageNavTarget {
  return KNOWLEDGE_COVERAGE_CATEGORY_NAV[label];
}
