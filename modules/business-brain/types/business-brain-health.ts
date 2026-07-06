export type BusinessBrainHealthRecommendationPriority = "high" | "medium" | "low";

export type BusinessBrainHealthRecommendation = {
  id: string;
  title: string;
  description: string;
  impact: string;
  targetPage: string;
  targetLabel: string;
  priority: BusinessBrainHealthRecommendationPriority;
};

export type BusinessBrainHealth = {
  overallScore: number;
  identityScore: number;
  productScore: number;
  knowledgeScore: number;
  documentScore: number;
  behaviorScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: BusinessBrainHealthRecommendation[];
  estimatedAiAccuracy: number;
};

export type BusinessBrainHealthIdentityInput = {
  companyName: string;
  industry: string;
  about: string;
  brandPersonality: string[];
  aiGoals: string[];
  neverRules: string[];
};

export type BusinessBrainHealthProductInput = {
  id: string;
  name: string;
  status: string;
  description: string;
  pricingCount: number;
  hasItinerary: boolean;
};

export type BusinessBrainHealthKnowledgeInput = {
  id: string;
  title: string;
  category: string;
  status: string;
  content: string;
  keywords: string[];
};

export type BusinessBrainHealthDocumentInput = {
  id: string;
  name: string;
  status: string;
  autoSendEnabled: boolean;
  triggers: string[];
};

export type BusinessBrainHealthBehaviorInput = {
  type: string;
  enabled: boolean;
  name: string;
  triggerIntent?: string;
};

export type BusinessBrainHealthInput = {
  identity: BusinessBrainHealthIdentityInput | null;
  products: BusinessBrainHealthProductInput[];
  knowledge: BusinessBrainHealthKnowledgeInput[];
  documents: BusinessBrainHealthDocumentInput[];
  behaviors: BusinessBrainHealthBehaviorInput[];
  isPublished: boolean;
};

const PRIORITY_ORDER: Record<BusinessBrainHealthRecommendationPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function sortBusinessBrainRecommendations(
  recommendations: BusinessBrainHealthRecommendation[],
): BusinessBrainHealthRecommendation[] {
  return [...recommendations].sort((a, b) => {
    const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    const impactA = parseInt(a.impact.replace(/\D/g, ""), 10) || 0;
    const impactB = parseInt(b.impact.replace(/\D/g, ""), 10) || 0;
    return impactB - impactA;
  });
}

export function topBusinessBrainQuickFixes(
  recommendations: BusinessBrainHealthRecommendation[],
  limit = 3,
): BusinessBrainHealthRecommendation[] {
  return sortBusinessBrainRecommendations(recommendations).slice(0, limit);
}
