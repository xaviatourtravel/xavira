import { calculateProductKnowledgeScore } from "@/modules/business-brain/lib/product-knowledge-score";
import {
  ensureBusinessBrain,
  findBusinessBrainByOrganizationId,
} from "@/modules/business-brain/repositories/business-brain-repository";
import {
  countProductDocumentsByProductIds,
  countProductFaqLinksByProductIds,
  createBrainProduct,
  findBrainProductById,
  listBrainProducts,
  mapBrainProductFormValues,
  mapBrainProductRowToListItem,
  updateBrainProduct,
  updateBrainProductStatus,
} from "@/modules/business-brain/repositories/brain-product-repository";
import { listProductDocuments } from "@/modules/business-brain/repositories/product-document-repository";
import { listProductFaqLinks } from "@/modules/business-brain/repositories/product-faq-link-repository";
import { brainProductFormSchema, type BrainProductFormInput } from "@/modules/business-brain/schemas/products";
import type {
  BrainProductDetail,
  BrainProductListItem,
} from "@/modules/business-brain/types/products";

async function getBusinessBrainIdForOrg(organizationId: string) {
  const brain = await ensureBusinessBrain(organizationId);
  return brain.id;
}

async function assertProductInOrg(organizationId: string, productId: string) {
  const businessBrain = await findBusinessBrainByOrganizationId(organizationId);
  if (!businessBrain) {
    throw new Error("Product not found.");
  }

  const product = await findBrainProductById(productId);

  if (!product || product.business_brain_id !== businessBrain.id) {
    throw new Error("Product not found.");
  }

  return product;
}

export async function getProducts(
  organizationId: string,
): Promise<BrainProductListItem[]> {
  const businessBrain = await findBusinessBrainByOrganizationId(organizationId);
  if (!businessBrain) {
    return [];
  }

  const rows = await listBrainProducts(businessBrain.id);
  const productIds = rows.map((row) => row.id);
  const [documentCounts, faqCounts] = await Promise.all([
    countProductDocumentsByProductIds(productIds),
    countProductFaqLinksByProductIds(productIds),
  ]);

  return rows.map((row) =>
    mapBrainProductRowToListItem(row, {
      documentCount: documentCounts.get(row.id) ?? 0,
      faqCount: faqCounts.get(row.id) ?? 0,
    }),
  );
}

export async function getProduct(
  organizationId: string,
  productId: string,
): Promise<BrainProductDetail | null> {
  const product = await assertProductInOrg(organizationId, productId);
  const [documents, faqLinks] = await Promise.all([
    listProductDocuments(productId),
    listProductFaqLinks(productId),
  ]);

  const formValues = mapBrainProductFormValues(product);

  return {
    id: product.id,
    businessBrainId: product.business_brain_id,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
    ...formValues,
    documents,
    faqLinks,
    knowledgeScore: calculateProductKnowledgeScore({
      ...formValues,
      documentCount: documents.length,
      faqCount: faqLinks.length,
    }),
  };
}

export async function create(
  organizationId: string,
): Promise<BrainProductDetail> {
  const businessBrainId = await getBusinessBrainIdForOrg(organizationId);
  const row = await createBrainProduct(businessBrainId);
  return (await getProduct(organizationId, row.id))!;
}

export async function update(
  organizationId: string,
  productId: string,
  input: BrainProductFormInput,
): Promise<BrainProductDetail> {
  await assertProductInOrg(organizationId, productId);
  const parsed = brainProductFormSchema.parse(input);
  const values = {
    ...parsed,
    aiNotes: parsed.aiNotes,
  };
  await updateBrainProduct(productId, values);
  return (await getProduct(organizationId, productId))!;
}

export async function publish(
  organizationId: string,
  productId: string,
): Promise<BrainProductDetail> {
  const product = await assertProductInOrg(organizationId, productId);
  const formValues = mapBrainProductFormValues(product);
  brainProductFormSchema.parse(formValues);
  await updateBrainProductStatus(productId, "published");
  return (await getProduct(organizationId, productId))!;
}

export async function archive(
  organizationId: string,
  productId: string,
): Promise<BrainProductDetail> {
  await assertProductInOrg(organizationId, productId);
  await updateBrainProductStatus(productId, "archived");
  return (await getProduct(organizationId, productId))!;
}
