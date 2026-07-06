export type BusinessBrainCoachCategory =
  | "identity"
  | "products"
  | "knowledge"
  | "documents"
  | "rules"
  | "publish";

export type BusinessBrainCoachDifficulty = "easy" | "medium" | "advanced";

export type BusinessBrainCoachEstimatedTime = "2 min" | "5 min" | "10 min" | "15 min";

export type BusinessBrainCoachPriority = "critical" | "recommended" | "optional";

export type BusinessBrainCoachRecommendation = {
  id: string;
  category: BusinessBrainCoachCategory;
  title: string;
  description: string;
  impact: string;
  /** Numeric impact for sorting (higher = more impact). */
  impactValue: number;
  difficulty: BusinessBrainCoachDifficulty;
  estimatedTime: BusinessBrainCoachEstimatedTime;
  priority: BusinessBrainCoachPriority;
  targetPage: string;
  cta: string;
};

export type BusinessBrainCoachProgressItem = {
  id: BusinessBrainCoachCategory;
  label: string;
  complete: boolean;
};

export type BusinessBrainCoachResult = {
  isReady: boolean;
  completedAreas: BusinessBrainCoachProgressItem[];
  missingAreas: BusinessBrainCoachProgressItem[];
  recommendations: BusinessBrainCoachRecommendation[];
};

export const BUSINESS_BRAIN_COACH_PROGRESS_ORDER: BusinessBrainCoachCategory[] = [
  "identity",
  "products",
  "knowledge",
  "documents",
  "rules",
  "publish",
];

export const BUSINESS_BRAIN_COACH_CATEGORY_LABELS: Record<
  BusinessBrainCoachCategory,
  string
> = {
  identity: "Identity",
  products: "Products",
  knowledge: "Knowledge",
  documents: "Documents",
  rules: "Rules",
  publish: "Publish",
};

const PRIORITY_ORDER: Record<BusinessBrainCoachPriority, number> = {
  critical: 0,
  recommended: 1,
  optional: 2,
};

export function sortBusinessBrainCoachRecommendations(
  recommendations: BusinessBrainCoachRecommendation[],
): BusinessBrainCoachRecommendation[] {
  return [...recommendations].sort((a, b) => {
    const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.impactValue - a.impactValue;
  });
}

export function businessBrainCoachDifficultyLabel(
  difficulty: BusinessBrainCoachDifficulty,
): string {
  if (difficulty === "easy") return "Easy";
  if (difficulty === "medium") return "Medium";
  return "Advanced";
}
