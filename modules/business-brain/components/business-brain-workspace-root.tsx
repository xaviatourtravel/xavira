"use client";

import type { ReactNode } from "react";

import { AiPermissionsPageClient } from "@/modules/business-brain/components/ai-permissions-page";
import { BehaviorsPageClient } from "@/modules/business-brain/components/behaviors-page";
import { BusinessBrainNav } from "@/modules/business-brain/components/business-brain-nav";
import { BusinessBrainPage } from "@/modules/business-brain/components/business-brain-page";
import {
  BusinessBrainWorkspaceProvider,
  useBusinessBrainWorkspace,
} from "@/modules/business-brain/components/business-brain-workspace-context";
import { BusinessBrainWorkspace } from "@/modules/business-brain/components/business-brain-workspace";
import { CompanyDnaPageClient } from "@/modules/business-brain/components/company-dna-page";
import { DocumentsPageClient } from "@/modules/business-brain/components/documents-page";
import { KnowledgePageClient } from "@/modules/business-brain/components/knowledge-page";
import { PlaygroundPageClient } from "@/modules/business-brain/components/playground-page";
import { ProductsPageClient } from "@/modules/business-brain/components/products-page";
import { PublishPageClient } from "@/modules/business-brain/components/publish-page";
import type { BusinessBrainWorkspaceData } from "@/modules/business-brain/services/load-business-brain-workspace-data";
import type { BusinessBrainSectionSlug } from "@/modules/business-brain/types/business-brain-workspace";
import { cn } from "@/lib/utils";

type BusinessBrainWorkspaceRootProps = {
  initialSection: BusinessBrainSectionSlug;
  data: BusinessBrainWorkspaceData;
};

function WorkspacePanel({
  slug,
  active,
  children,
}: {
  slug: BusinessBrainSectionSlug;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <div
      id={`bb-panel-${slug}`}
      className={cn(!active && "hidden")}
      aria-hidden={!active}
      data-bb-panel={slug}
    >
      {children}
    </div>
  );
}

function WorkspacePanels({ data }: { data: BusinessBrainWorkspaceData }) {
  const { section } = useBusinessBrainWorkspace();

  return (
    <>
      <WorkspacePanel slug="overview" active={section === "overview"}>
        <BusinessBrainPage
          overview={data.overview}
          knowledgeCoverage={data.knowledgeCoverage}
        />
      </WorkspacePanel>

      <WorkspacePanel slug="identity" active={section === "identity"}>
        <CompanyDnaPageClient
          initialRecord={data.identity.record}
          canEdit={data.identity.canEdit}
        />
      </WorkspacePanel>

      <WorkspacePanel slug="products" active={section === "products"}>
        <ProductsPageClient
          initialProducts={data.products.products}
          faqOptions={data.products.faqOptions}
          canEdit={data.products.canEdit}
        />
      </WorkspacePanel>

      <WorkspacePanel slug="knowledge" active={section === "knowledge"}>
        <KnowledgePageClient
          initialArticles={data.knowledge.articles}
          productOptions={data.knowledge.productOptions}
          canEdit={data.knowledge.canEdit}
        />
      </WorkspacePanel>

      <WorkspacePanel slug="documents" active={section === "documents"}>
        <DocumentsPageClient
          initialDocuments={data.documents.documents}
          productOptions={data.documents.productOptions}
          articleOptions={data.documents.articleOptions}
          canEdit={data.documents.canEdit}
        />
      </WorkspacePanel>

      <WorkspacePanel slug="behaviors" active={section === "behaviors"}>
        <BehaviorsPageClient
          initialBehaviors={data.behaviors.behaviors}
          canEdit={data.behaviors.canEdit}
        />
      </WorkspacePanel>

      <WorkspacePanel slug="playground" active={section === "playground"}>
        <PlaygroundPageClient
          initialAvailableContext={data.playground.availableContext}
          initialSavedExamples={data.playground.savedExamples}
          initialSavedTestSessions={data.playground.savedTestSessions}
          canEdit={data.playground.canEdit}
          llmConfigured={data.playground.llmConfigured}
          health={data.overview.health}
          knowledgeCoverage={data.knowledgeCoverage}
        />
      </WorkspacePanel>

      <WorkspacePanel slug="publish" active={section === "publish"}>
        <PublishPageClient
          initialStatus={data.publish.status}
          initialDraftSummary={data.publish.draftSummary}
          initialVersions={data.publish.versions}
          canPublish={data.publish.canPublish}
        />
      </WorkspacePanel>

      <WorkspacePanel slug="ai-permissions" active={section === "ai-permissions"}>
        <AiPermissionsPageClient
          initialPermissions={data.permissions.permissions}
          canEdit={data.permissions.canEdit}
        />
      </WorkspacePanel>
    </>
  );
}

export function BusinessBrainWorkspaceRoot({
  initialSection,
  data,
}: BusinessBrainWorkspaceRootProps) {
  return (
    <BusinessBrainWorkspaceProvider initialSection={initialSection}>
      <BusinessBrainWorkspace tabs={<BusinessBrainNav />}>
        <WorkspacePanels data={data} />
      </BusinessBrainWorkspace>
    </BusinessBrainWorkspaceProvider>
  );
}
