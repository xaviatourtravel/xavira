"use server";

import { revalidatePath } from "next/cache";

import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import {
  brainArticleFormSchema,
} from "@/modules/business-brain/schemas/knowledge";
import {
  create,
  deleteArticle,
  getArticle,
  getArticles,
  publish,
  search,
  update,
} from "@/modules/business-brain/services/business-brain-knowledge-service";
import { getProducts } from "@/modules/business-brain/services/business-brain-product-service";
import type {
  BrainArticleCategory,
  BrainArticleSearchFilters,
  BrainArticleStatus,
} from "@/modules/business-brain/types/knowledge";

const KNOWLEDGE_PATH = "/business-brain/knowledge";

function revalidateKnowledge() {
  revalidatePath(KNOWLEDGE_PATH);
}

function requireOrgId(profile: { organization_id: string | null }) {
  if (!profile.organization_id) {
    throw new Error("Organization is required.");
  }
  return profile.organization_id;
}

export async function loadBrainArticlesAction() {
  const { profile } = await requireProfile();
  const organizationId = requireOrgId(profile);
  const [articles, products] = await Promise.all([
    getArticles(organizationId),
    getProducts(organizationId),
  ]);

  return {
    articles,
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
    })),
    canEdit: isAdminOrOwner(profile),
  };
}

export async function loadBrainArticleAction(articleId: string) {
  const { profile } = await requireProfile();
  const organizationId = requireOrgId(profile);
  const article = await getArticle(organizationId, articleId);
  return { article, canEdit: isAdminOrOwner(profile) };
}

export async function searchBrainArticlesAction(filters: {
  query?: string;
  category?: BrainArticleCategory | "all";
  status?: BrainArticleStatus | "all";
}) {
  const { profile } = await requireProfile();
  const organizationId = requireOrgId(profile);
  const searchFilters: BrainArticleSearchFilters = {
    query: filters.query,
    category: filters.category,
    status: filters.status,
  };
  const articles = await search(organizationId, searchFilters);
  return { articles };
}

export async function createBrainArticleAction() {
  const { profile } = await requireProfile();
  if (!isAdminOrOwner(profile)) {
    return { ok: false as const, error: "Permission denied." };
  }

  try {
    const organizationId = requireOrgId(profile);
    const article = await create(organizationId);
    revalidateKnowledge();
    return { ok: true as const, article };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to create article.",
    };
  }
}

export async function updateBrainArticleAction(articleId: string, input: unknown) {
  const { profile } = await requireProfile();
  if (!isAdminOrOwner(profile)) {
    return { ok: false as const, error: "Permission denied." };
  }

  const parsed = brainArticleFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid article data.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const organizationId = requireOrgId(profile);
    const article = await update(organizationId, articleId, parsed.data);
    revalidateKnowledge();
    return { ok: true as const, article };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to update article.",
    };
  }
}

export async function publishBrainArticleAction(articleId: string) {
  const { profile } = await requireProfile();
  if (!isAdminOrOwner(profile)) {
    return { ok: false as const, error: "Permission denied." };
  }

  try {
    const organizationId = requireOrgId(profile);
    const article = await publish(organizationId, articleId);
    revalidateKnowledge();
    return { ok: true as const, article };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to publish article.",
    };
  }
}

export async function deleteBrainArticleAction(articleId: string) {
  const { profile } = await requireProfile();
  if (!isAdminOrOwner(profile)) {
    return { ok: false as const, error: "Permission denied." };
  }

  try {
    const organizationId = requireOrgId(profile);
    await deleteArticle(organizationId, articleId);
    revalidateKnowledge();
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to delete article.",
    };
  }
}
