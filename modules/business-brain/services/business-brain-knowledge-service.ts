import {
  ensureBusinessBrain,
  findBusinessBrainByOrganizationId,
} from "@/modules/business-brain/repositories/business-brain-repository";
import {
  createBrainArticle,
  deleteBrainArticle,
  findBrainArticleById,
  listBrainArticles,
  mapBrainArticleFormValues,
  mapBrainArticleListItem,
  updateBrainArticle,
  updateBrainArticleStatus,
} from "@/modules/business-brain/repositories/brain-article-repository";
import {
  listArticleProductLinks,
  replaceArticleProductLinks,
} from "@/modules/business-brain/repositories/brain-article-product-repository";
import {
  brainArticleFormSchema,
  type BrainArticleFormInput,
} from "@/modules/business-brain/schemas/knowledge";
import type {
  BrainArticleDetail,
  BrainArticleListItem,
  BrainArticleSearchFilters,
} from "@/modules/business-brain/types/knowledge";

async function getBusinessBrainIdForOrg(organizationId: string) {
  const brain = await ensureBusinessBrain(organizationId);
  return brain.id;
}

async function assertArticleInOrg(organizationId: string, articleId: string) {
  const businessBrain = await findBusinessBrainByOrganizationId(organizationId);
  if (!businessBrain) {
    throw new Error("Article not found.");
  }

  const article = await findBrainArticleById(articleId);
  if (!article || article.business_brain_id !== businessBrain.id) {
    throw new Error("Article not found.");
  }

  return article;
}

function matchesSearch(
  article: BrainArticleListItem,
  content: string,
  keywords: string[],
  filters: BrainArticleSearchFilters,
): boolean {
  const query = filters.query?.trim().toLowerCase() ?? "";
  const categoryMatch =
    !filters.category || filters.category === "all"
      ? true
      : article.category === filters.category;
  const statusMatch =
    !filters.status || filters.status === "all"
      ? true
      : article.status === filters.status;

  if (!categoryMatch || !statusMatch) {
    return false;
  }

  if (!query) {
    return true;
  }

  const haystack = [
    article.title,
    content,
    ...keywords,
    article.category,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export async function getArticles(
  organizationId: string,
): Promise<BrainArticleListItem[]> {
  const businessBrain = await findBusinessBrainByOrganizationId(organizationId);
  if (!businessBrain) {
    return [];
  }

  const rows = await listBrainArticles(businessBrain.id);
  return rows.map(mapBrainArticleListItem);
}

export async function getArticle(
  organizationId: string,
  articleId: string,
): Promise<BrainArticleDetail | null> {
  const article = await assertArticleInOrg(organizationId, articleId);
  const relatedProducts = await listArticleProductLinks(articleId);
  const formValues = mapBrainArticleFormValues(article);

  return {
    id: article.id,
    businessBrainId: article.business_brain_id,
    createdAt: article.created_at,
    updatedAt: article.updated_at,
    ...formValues,
    relatedProductIds: relatedProducts.map((item) => item.productId),
    relatedProducts,
    aiMetadata: formValues.aiMetadata,
  };
}

export async function create(organizationId: string): Promise<BrainArticleDetail> {
  const businessBrainId = await getBusinessBrainIdForOrg(organizationId);
  const row = await createBrainArticle(businessBrainId);
  return (await getArticle(organizationId, row.id))!;
}

export async function update(
  organizationId: string,
  articleId: string,
  input: BrainArticleFormInput,
): Promise<BrainArticleDetail> {
  await assertArticleInOrg(organizationId, articleId);
  const parsed = brainArticleFormSchema.parse(input);
  const values = {
    title: parsed.title,
    category: parsed.category,
    content: parsed.content,
    keywords: parsed.keywords,
    visibility: parsed.visibility,
    status: parsed.status,
    relatedProductIds: parsed.relatedProductIds,
    aiMetadata: parsed.aiMetadata ?? {
      confidenceWeight: null,
      priority: null,
      relatedDocuments: [],
    },
  };

  await updateBrainArticle(articleId, values);
  await replaceArticleProductLinks(articleId, values.relatedProductIds);
  return (await getArticle(organizationId, articleId))!;
}

export async function deleteArticle(
  organizationId: string,
  articleId: string,
): Promise<void> {
  await assertArticleInOrg(organizationId, articleId);
  await deleteBrainArticle(articleId);
}

export async function publish(
  organizationId: string,
  articleId: string,
): Promise<BrainArticleDetail> {
  const article = await assertArticleInOrg(organizationId, articleId);
  const formValues = mapBrainArticleFormValues(article);
  const relatedProducts = await listArticleProductLinks(articleId);

  brainArticleFormSchema.parse({
    ...formValues,
    relatedProductIds: relatedProducts.map((item) => item.productId),
    aiMetadata: formValues.aiMetadata,
  });

  await updateBrainArticleStatus(articleId, "published");
  return (await getArticle(organizationId, articleId))!;
}

export async function search(
  organizationId: string,
  filters: BrainArticleSearchFilters = {},
): Promise<BrainArticleListItem[]> {
  const businessBrain = await findBusinessBrainByOrganizationId(organizationId);
  if (!businessBrain) {
    return [];
  }

  const rows = await listBrainArticles(businessBrain.id);
  return rows
    .filter((row) => {
      const listItem = mapBrainArticleListItem(row);
      const keywords = Array.isArray(row.keywords)
        ? row.keywords.filter((item): item is string => typeof item === "string")
        : [];
      return matchesSearch(listItem, row.content, keywords, filters);
    })
    .map(mapBrainArticleListItem);
}
