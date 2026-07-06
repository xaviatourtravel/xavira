"use server";

import { requireProfile } from "@/lib/auth/session";
import {
  buildBusinessBrainTimeline,
  emptyBusinessBrainTimelineResult,
} from "@/modules/business-brain/lib/build-business-brain-timeline";
import { listBrainArticles } from "@/modules/business-brain/repositories/brain-article-repository";
import { listBrainBehaviors } from "@/modules/business-brain/repositories/brain-behavior-repository";
import { listBrainDocuments } from "@/modules/business-brain/repositories/brain-document-repository";
import { listBrainProducts } from "@/modules/business-brain/repositories/brain-product-repository";
import { listBrainVersions } from "@/modules/business-brain/repositories/brain-version-repository";
import { findBusinessBrainByOrganizationId } from "@/modules/business-brain/repositories/business-brain-repository";
import { findCompanyDnaByBusinessBrainId } from "@/modules/business-brain/repositories/company-dna-repository";

export async function loadBusinessBrainTimelineAction() {
  const { profile } = await requireProfile();
  const organizationId = profile.organization_id?.trim() ?? "";
  if (!organizationId) {
    return emptyBusinessBrainTimelineResult();
  }

  const brain = await findBusinessBrainByOrganizationId(organizationId);
  if (!brain) {
    return emptyBusinessBrainTimelineResult();
  }

  const [companyDnaRow, products, knowledge, documents, behaviors, versions] =
    await Promise.all([
      findCompanyDnaByBusinessBrainId(brain.id),
      listBrainProducts(brain.id),
      listBrainArticles(brain.id),
      listBrainDocuments(brain.id),
      listBrainBehaviors(brain.id),
      listBrainVersions(brain.id),
    ]);

  return buildBusinessBrainTimeline({
    brain: {
      id: brain.id,
      published_at: brain.published_at,
    },
    companyDna: companyDnaRow
      ? { id: companyDnaRow.id, updated_at: companyDnaRow.updated_at }
      : null,
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      status: product.status,
      created_at: product.created_at,
      updated_at: product.updated_at,
    })),
    knowledge: knowledge.map((article) => ({
      id: article.id,
      title: article.title,
      status: article.status,
      created_at: article.created_at,
      updated_at: article.updated_at,
    })),
    documents: documents.map((document) => ({
      id: document.id,
      name: document.name,
      status: document.status,
      created_at: document.created_at,
      updated_at: document.updated_at,
    })),
    behaviors: behaviors.map((behavior) => ({
      id: behavior.id,
      name: behavior.name,
      created_at: behavior.created_at,
      updated_at: behavior.updated_at,
    })),
    versions: versions.map((version) => ({
      id: version.id,
      version_number: version.version_number,
      published_at: version.published_at,
      status: version.status,
    })),
  });
}
