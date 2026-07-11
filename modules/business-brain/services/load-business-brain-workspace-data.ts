import { loadBrainActionPermissionsAction } from "@/modules/business-brain/actions/action-permission-actions";
import { loadBrainBehaviorsAction } from "@/modules/business-brain/actions/behavior-actions";
import {
  loadBrainArticlesAction,
  loadBrainDocumentsAction,
  loadBrainProductsAction,
  loadCompanyDnaAction,
  loadPlaygroundAction,
  loadProductFaqOptionsAction,
  loadPublishPageAction,
} from "@/modules/business-brain/actions";
import { getBusinessBrainOverview } from "@/modules/business-brain/services/business-brain-overview-service";
import { calculateKnowledgeCoverage } from "@/modules/business-brain/services/knowledge-coverage-engine";
import type { BrainActionPermissionRecord } from "@/modules/business-brain/types/action-permissions";
import type { CompanyDnaRecord } from "@/modules/business-brain/types/company-dna";
import type { BrainBehaviorRecord } from "@/modules/business-brain/types/behaviors";
import type { BrainArticleListItem } from "@/modules/business-brain/types/knowledge";
import type { BrainDocumentListItem } from "@/modules/business-brain/types/documents";
import type { BrainProductListItem } from "@/modules/business-brain/types/products";
import type {
  BrainDraftSummary,
  BrainPublishStatusView,
  BrainVersionListItem,
} from "@/modules/business-brain/types/publish";
import type {
  PlaygroundAvailableContext,
  PlaygroundSavedExample,
  PlaygroundTestResult,
} from "@/modules/business-brain/types/playground";
import type { BrainTestSessionRecord } from "@/modules/business-brain/types/brain-test-session";
import type { BusinessBrainOverviewSummary } from "@/modules/business-brain/types";
import type { KnowledgeCoverageResult } from "@/modules/business-brain/types/knowledge-coverage";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";

export type BusinessBrainWorkspaceData = {
  overview: BusinessBrainOverviewSummary;
  knowledgeCoverage: KnowledgeCoverageResult;
  identity: {
    record: CompanyDnaRecord | null;
    canEdit: boolean;
  };
  products: {
    products: BrainProductListItem[];
    faqOptions: { id: string; title: string; category: string }[];
    canEdit: boolean;
  };
  knowledge: {
    articles: BrainArticleListItem[];
    productOptions: { id: string; name: string }[];
    canEdit: boolean;
  };
  documents: {
    documents: BrainDocumentListItem[];
    productOptions: { id: string; name: string }[];
    articleOptions: { id: string; title: string }[];
    canEdit: boolean;
  };
  behaviors: {
    behaviors: BrainBehaviorRecord[];
    canEdit: boolean;
  };
  playground: {
    availableContext: PlaygroundAvailableContext;
    savedExamples: PlaygroundSavedExample[];
    savedTestSessions: BrainTestSessionRecord[];
    activeSessionId: string | null;
    activeSession: {
      id: string;
      conversation: import("@/modules/business-brain/types/playground-simulator").SimulatorChatMessage[];
      inspector: PlaygroundTestResult | null;
    } | null;
    canEdit: boolean;
    llmConfigured: boolean;
  };
  publish: {
    status: BrainPublishStatusView;
    draftSummary: BrainDraftSummary;
    versions: BrainVersionListItem[];
    canPublish: boolean;
  };
  permissions: {
    permissions: BrainActionPermissionRecord[];
    canEdit: boolean;
  };
};

export async function loadBusinessBrainWorkspaceData(): Promise<BusinessBrainWorkspaceData> {
  const { profile } = await requireProfile();
  const organizationId = profile.organization_id ?? "";
  const canEditAdmin = isAdminOrOwner(profile);

  const [
    overview,
    knowledgeCoverage,
    companyDna,
    productsResult,
    faqOptions,
    articlesResult,
    documentsResult,
    behaviorsResult,
    playgroundResult,
    publishResult,
    permissionsResult,
  ] = await Promise.all([
    getBusinessBrainOverview(organizationId),
    calculateKnowledgeCoverage({ workspaceId: organizationId }),
    loadCompanyDnaAction(),
    loadBrainProductsAction(),
    loadProductFaqOptionsAction(),
    loadBrainArticlesAction(),
    loadBrainDocumentsAction(),
    loadBrainBehaviorsAction(),
    loadPlaygroundAction(),
    loadPublishPageAction(),
    loadBrainActionPermissionsAction(),
  ]);

  return {
    overview,
    knowledgeCoverage,
    identity: {
      record: companyDna.record,
      canEdit: canEditAdmin,
    },
    products: {
      products: productsResult.products,
      faqOptions,
      canEdit: productsResult.canEdit,
    },
    knowledge: {
      articles: articlesResult.articles,
      productOptions: articlesResult.products,
      canEdit: articlesResult.canEdit,
    },
    documents: {
      documents: documentsResult.documents,
      productOptions: documentsResult.products,
      articleOptions: documentsResult.articles,
      canEdit: documentsResult.canEdit,
    },
    behaviors: {
      behaviors: behaviorsResult.behaviors,
      canEdit: behaviorsResult.canEdit,
    },
    playground: {
      availableContext: playgroundResult.availableContext,
      savedExamples: playgroundResult.savedExamples,
      savedTestSessions: playgroundResult.savedTestSessions,
      activeSessionId: playgroundResult.activeSessionId,
      activeSession: playgroundResult.activeSession ?? null,
      canEdit: playgroundResult.canEdit,
      llmConfigured: playgroundResult.llmConfigured,
    },
    publish: {
      status: publishResult.status,
      draftSummary: publishResult.draftSummary,
      versions: publishResult.versions,
      canPublish: publishResult.canPublish,
    },
    permissions: {
      permissions: permissionsResult.permissions,
      canEdit: permissionsResult.canEdit,
    },
  };
}

