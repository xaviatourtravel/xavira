import type { BusinessBrainSectionSlug, BusinessBrainWorkspaceTabId } from "@/modules/business-brain/types/business-brain-workspace";
import type { TranslateFn } from "@/lib/i18n/dictionary";

const TAB_LABEL_KEYS: Record<BusinessBrainWorkspaceTabId, string> = {
  overview: "businessBrain.overview",
  identity: "businessBrain.identity",
  products: "businessBrain.products",
  knowledge: "businessBrain.knowledge",
  documents: "businessBrain.documents",
  behaviors: "businessBrain.rules",
  playground: "businessBrain.testAi",
  publish: "businessBrain.publish",
};

const SECTION_DESCRIPTION_KEYS: Partial<Record<BusinessBrainSectionSlug, string>> = {
  overview: "businessBrain.overviewDescription",
  identity: "businessBrain.identityDescription",
  products: "businessBrain.productsDescription",
  knowledge: "businessBrain.knowledgeDescription",
  documents: "businessBrain.documentsDescription",
  behaviors: "businessBrain.rulesDescription",
  playground: "businessBrain.testAiDescription",
  publish: "businessBrain.publishDescription",
  "ai-permissions": "businessBrain.aiPermissionsDescription",
};

const SECTION_TITLE_KEYS: Partial<Record<BusinessBrainSectionSlug, string>> = {
  overview: "businessBrain.overview",
  identity: "businessBrain.identity",
  products: "businessBrain.products",
  knowledge: "businessBrain.knowledge",
  documents: "businessBrain.documents",
  behaviors: "businessBrain.rules",
  playground: "businessBrain.testAi",
  publish: "businessBrain.publishPageTitle",
  "ai-permissions": "businessBrain.aiPermissions",
};

export function translateBusinessBrainTabLabel(
  t: TranslateFn,
  tabId: BusinessBrainWorkspaceTabId,
): string {
  const key = TAB_LABEL_KEYS[tabId];
  return key ? t(key) : tabId;
}

export function translateBusinessBrainSectionTitle(
  t: TranslateFn,
  slug: BusinessBrainSectionSlug,
): string {
  const key = SECTION_TITLE_KEYS[slug];
  return key ? t(key) : slug;
}

export function translateBusinessBrainSectionDescription(
  t: TranslateFn,
  slug: BusinessBrainSectionSlug,
): string | undefined {
  const key = SECTION_DESCRIPTION_KEYS[slug];
  return key ? t(key) : undefined;
}
