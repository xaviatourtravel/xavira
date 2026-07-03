import { createBusinessBrainDocumentSignedUrl } from "@/modules/business-brain/lib/document-storage";
import {
  ensureBusinessBrain,
  findBusinessBrainByOrganizationId,
} from "@/modules/business-brain/repositories/business-brain-repository";
import {
  countDocumentProductsByDocumentIds,
  deleteBrainDocument,
  findBrainDocumentById,
  insertBrainDocument,
  listBrainDocuments,
  listDocumentTriggers,
  mapBrainDocumentListFields,
  replaceDocumentTriggers,
  updateBrainDocument,
  updateBrainDocumentStatus,
} from "@/modules/business-brain/repositories/brain-document-repository";
import {
  listDocumentArticleLinks,
  listDocumentProductLinks,
  replaceDocumentArticleLinks,
  replaceDocumentProductLinks,
} from "@/modules/business-brain/repositories/brain-document-relations-repository";
import {
  brainDocumentFormSchema,
  type BrainDocumentFormInput,
} from "@/modules/business-brain/schemas/documents";
import type {
  BrainDocumentDetail,
  BrainDocumentListItem,
  BrainDocumentType,
} from "@/modules/business-brain/types/documents";
import { inferDocumentTypeFromMime } from "@/modules/business-brain/types/documents";

async function getBusinessBrainIdForOrg(organizationId: string) {
  const brain = await ensureBusinessBrain(organizationId);
  return brain.id;
}

async function assertDocumentInOrg(organizationId: string, documentId: string) {
  const businessBrain = await findBusinessBrainByOrganizationId(organizationId);
  if (!businessBrain) {
    throw new Error("Document not found.");
  }

  const document = await findBrainDocumentById(documentId);
  if (!document || document.business_brain_id !== businessBrain.id) {
    throw new Error("Document not found.");
  }

  return document;
}

async function buildDocumentDetail(
  row: NonNullable<Awaited<ReturnType<typeof findBrainDocumentById>>>,
): Promise<BrainDocumentDetail> {
  const [triggers, relatedProducts, relatedArticles] = await Promise.all([
    listDocumentTriggers(row.id),
    listDocumentProductLinks(row.id),
    listDocumentArticleLinks(row.id),
  ]);

  const mapped = mapBrainDocumentListFields(row);
  const previewUrl = row.storage_path
    ? await createBusinessBrainDocumentSignedUrl(row.storage_path, 600)
    : row.public_url;

  return {
    id: row.id,
    businessBrainId: row.business_brain_id,
    name: mapped.name,
    description: mapped.description,
    documentType: mapped.documentType,
    tags: mapped.tags,
    relatedProductIds: relatedProducts.map((item) => item.productId),
    relatedArticleIds: relatedArticles.map((item) => item.articleId),
    autoSendEnabled: row.auto_send_enabled,
    triggers,
    aiNotes: mapped.aiNotes,
    status: mapped.status,
    storagePath: row.storage_path,
    publicUrl: row.public_url,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    previewUrl,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    relatedProducts,
    relatedArticles,
  };
}

export async function getDocuments(
  organizationId: string,
): Promise<BrainDocumentListItem[]> {
  const businessBrain = await findBusinessBrainByOrganizationId(organizationId);
  if (!businessBrain) {
    return [];
  }

  const rows = await listBrainDocuments(businessBrain.id);
  const documentIds = rows.map((row) => row.id);
  const productCounts = await countDocumentProductsByDocumentIds(documentIds);

  return rows.map((row) => {
    const mapped = mapBrainDocumentListFields(row);
    return {
      id: mapped.id,
      name: mapped.name,
      documentType: mapped.documentType,
      status: mapped.status,
      autoSendEnabled: mapped.autoSendEnabled,
      linkedProductCount: productCounts.get(row.id) ?? 0,
      updatedAt: mapped.updatedAt,
      createdAt: mapped.createdAt,
    };
  });
}

export async function getDocument(
  organizationId: string,
  documentId: string,
): Promise<BrainDocumentDetail | null> {
  const document = await assertDocumentInOrg(organizationId, documentId);
  return buildDocumentDetail(document);
}

export async function upload(input: {
  organizationId: string;
  name: string;
  description?: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  documentType?: BrainDocumentType;
  tags?: string[];
}): Promise<BrainDocumentDetail> {
  const businessBrainId = await getBusinessBrainIdForOrg(input.organizationId);
  const documentType =
    input.documentType ?? inferDocumentTypeFromMime(input.mimeType);

  const row = await insertBrainDocument({
    businessBrainId,
    name: input.name,
    description: input.description,
    storagePath: input.storagePath,
    mimeType: input.mimeType,
    fileSize: input.fileSize,
    documentType,
    tags: input.tags,
  });

  return (await buildDocumentDetail(row))!;
}

export async function uploadUrl(input: {
  organizationId: string;
  name: string;
  publicUrl: string;
  description?: string;
}): Promise<BrainDocumentDetail> {
  const businessBrainId = await getBusinessBrainIdForOrg(input.organizationId);

  const row = await insertBrainDocument({
    businessBrainId,
    name: input.name,
    description: input.description,
    publicUrl: input.publicUrl,
    documentType: "url",
  });

  return (await buildDocumentDetail(row))!;
}

export async function update(
  organizationId: string,
  documentId: string,
  input: BrainDocumentFormInput,
): Promise<BrainDocumentDetail> {
  await assertDocumentInOrg(organizationId, documentId);
  const parsed = brainDocumentFormSchema.parse(input);

  await updateBrainDocument(documentId, {
    name: parsed.name,
    description: parsed.description,
    documentType: parsed.documentType,
    tags: parsed.tags,
    autoSendEnabled: parsed.autoSendEnabled,
    aiNotes: parsed.aiNotes,
    status: parsed.status,
  });

  await Promise.all([
    replaceDocumentTriggers(documentId, parsed.triggers),
    replaceDocumentProductLinks(documentId, parsed.relatedProductIds),
    replaceDocumentArticleLinks(documentId, parsed.relatedArticleIds),
  ]);

  return (await getDocument(organizationId, documentId))!;
}

export async function publish(
  organizationId: string,
  documentId: string,
): Promise<BrainDocumentDetail> {
  const document = await assertDocumentInOrg(organizationId, documentId);
  const detail = await buildDocumentDetail(document);

  brainDocumentFormSchema.parse({
    name: detail.name,
    description: detail.description,
    documentType: detail.documentType,
    tags: detail.tags,
    relatedProductIds: detail.relatedProductIds,
    relatedArticleIds: detail.relatedArticleIds,
    autoSendEnabled: detail.autoSendEnabled,
    triggers: detail.triggers,
    aiNotes: detail.aiNotes,
    status: detail.status,
  });

  await updateBrainDocumentStatus(documentId, "published");
  return (await getDocument(organizationId, documentId))!;
}

export async function deleteDocument(
  organizationId: string,
  documentId: string,
): Promise<{ storagePath: string | null }> {
  const document = await assertDocumentInOrg(organizationId, documentId);
  const storagePath = document.storage_path;
  await deleteBrainDocument(documentId);
  return { storagePath };
}
