"use server";

import { revalidatePath } from "next/cache";

import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import {
  createBusinessBrainDocumentSignedUrl,
  removeBusinessBrainDocument,
  uploadBusinessBrainDocument,
} from "@/modules/business-brain/lib/document-storage";
import {
  brainDocumentFormSchema,
  brainDocumentUrlSchema,
} from "@/modules/business-brain/schemas/documents";
import {
  deleteDocument,
  getDocument,
  getDocuments,
  publish,
  update,
  upload,
  uploadUrl,
} from "@/modules/business-brain/services/business-brain-document-service";
import { getArticles } from "@/modules/business-brain/services/business-brain-knowledge-service";
import { getProducts } from "@/modules/business-brain/services/business-brain-product-service";

const DOCUMENTS_PATH = "/business-brain/documents";
const MAX_FILE_BYTES = 50 * 1024 * 1024;

function revalidateDocuments() {
  revalidatePath(DOCUMENTS_PATH);
}

function requireOrgId(profile: { organization_id: string | null }) {
  if (!profile.organization_id) {
    throw new Error("Organization is required.");
  }
  return profile.organization_id;
}

export async function loadBrainDocumentsAction() {
  const { profile } = await requireProfile();
  const organizationId = requireOrgId(profile);

  const [documents, products, articles] = await Promise.all([
    getDocuments(organizationId),
    getProducts(organizationId),
    getArticles(organizationId),
  ]);

  return {
    documents,
    products: products.map((product) => ({ id: product.id, name: product.name })),
    articles: articles.map((article) => ({ id: article.id, title: article.title })),
    canEdit: isAdminOrOwner(profile),
  };
}

export async function loadBrainDocumentAction(documentId: string) {
  const { profile } = await requireProfile();
  const organizationId = requireOrgId(profile);
  const document = await getDocument(organizationId, documentId);
  return { document, canEdit: isAdminOrOwner(profile) };
}

export async function uploadBrainDocumentAction(formData: FormData) {
  const { profile } = await requireProfile();
  if (!isAdminOrOwner(profile)) {
    return { ok: false as const, error: "Permission denied." };
  }

  const file = formData.get("file");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: "File is required." };
  }

  if (file.size > MAX_FILE_BYTES) {
    return { ok: false as const, error: "File exceeds 50MB limit." };
  }

  try {
    const organizationId = requireOrgId(profile);
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadBusinessBrainDocument({
      organizationId,
      buffer,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
    });

    const document = await upload({
      organizationId,
      name: name || file.name,
      description,
      storagePath: uploaded.storagePath,
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size,
    });

    revalidateDocuments();
    return { ok: true as const, document };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to upload document.",
    };
  }
}

export async function uploadBrainDocumentUrlAction(input: unknown) {
  const { profile } = await requireProfile();
  if (!isAdminOrOwner(profile)) {
    return { ok: false as const, error: "Permission denied." };
  }

  const parsed = brainDocumentUrlSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid URL document.",
    };
  }

  try {
    const organizationId = requireOrgId(profile);
    const document = await uploadUrl({
      organizationId,
      name: parsed.data.name,
      publicUrl: parsed.data.publicUrl,
      description: parsed.data.description,
    });

    revalidateDocuments();
    return { ok: true as const, document };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to add URL document.",
    };
  }
}

export async function updateBrainDocumentAction(documentId: string, input: unknown) {
  const { profile } = await requireProfile();
  if (!isAdminOrOwner(profile)) {
    return { ok: false as const, error: "Permission denied." };
  }

  const parsed = brainDocumentFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid document data.",
    };
  }

  try {
    const organizationId = requireOrgId(profile);
    const document = await update(organizationId, documentId, parsed.data);
    revalidateDocuments();
    return { ok: true as const, document };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to update document.",
    };
  }
}

export async function publishBrainDocumentAction(documentId: string) {
  const { profile } = await requireProfile();
  if (!isAdminOrOwner(profile)) {
    return { ok: false as const, error: "Permission denied." };
  }

  try {
    const organizationId = requireOrgId(profile);
    const saveInput = await getDocument(organizationId, documentId);
    if (!saveInput) {
      return { ok: false as const, error: "Document not found." };
    }

    const document = await publish(organizationId, documentId);
    revalidateDocuments();
    return { ok: true as const, document };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to publish document.",
    };
  }
}

export async function deleteBrainDocumentAction(documentId: string) {
  const { profile } = await requireProfile();
  if (!isAdminOrOwner(profile)) {
    return { ok: false as const, error: "Permission denied." };
  }

  try {
    const organizationId = requireOrgId(profile);
    const { storagePath } = await deleteDocument(organizationId, documentId);

    if (storagePath) {
      await removeBusinessBrainDocument(storagePath);
    }

    revalidateDocuments();
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to delete document.",
    };
  }
}

export async function refreshBrainDocumentPreviewAction(documentId: string) {
  const { profile } = await requireProfile();
  const organizationId = requireOrgId(profile);
  const document = await getDocument(organizationId, documentId);

  if (!document) {
    return { ok: false as const, error: "Document not found." };
  }

  if (document.publicUrl) {
    return { ok: true as const, previewUrl: document.publicUrl };
  }

  if (!document.storagePath) {
    return { ok: false as const, error: "No preview available." };
  }

  const previewUrl = await createBusinessBrainDocumentSignedUrl(document.storagePath, 600);
  if (!previewUrl) {
    return { ok: false as const, error: "Could not generate preview URL." };
  }

  return { ok: true as const, previewUrl };
}
