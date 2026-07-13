"use server";

import { revalidatePath } from "next/cache";

import { randomUUID } from "crypto";

import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import {
  BRAIN_PRODUCT_BUCKET,
  createBrainProductSignedUploadUrl,
  createBrainProductFileSignedUrl,
  removeBrainProductFile,
} from "@/modules/business-brain/lib/product-storage";
import {
  validateProductDocumentPrepareMetadata,
  verifyStoredProductDocumentObject,
} from "@/modules/business-brain/lib/product-document-finalize";
import { buildProductDocumentStoragePath } from "@/modules/business-brain/lib/product-document-upload-path";
import {
  inferServerUploadErrorCode,
  type ProductDocumentUploadServerErrorCode,
} from "@/modules/business-brain/lib/product-document-upload-errors";
import {
  beginProductUploadDebug,
  endProductUploadDebug,
  logProductUploadError,
  logProductUploadStep,
} from "@/modules/business-brain/lib/product-upload-debug";
import {
  createProductFaqSchema,
  brainProductFormSchema,
} from "@/modules/business-brain/schemas/products";
import { normalizeFaqQuestion } from "@/modules/business-brain/lib/parse-faq-import-text";
import type { FaqImportApplyItem, FaqImportApplyResult } from "@/modules/business-brain/types/faq-import";
import {
  deleteProductDocument,
  findProductDocumentByFilePath,
  findProductDocumentById,
  insertProductDocumentWithServiceRole,
} from "@/modules/business-brain/repositories/product-document-repository";
import {
  deleteProductFaqLink,
  insertProductFaqLink,
} from "@/modules/business-brain/repositories/product-faq-link-repository";
import {
  archive,
  create,
  getProduct,
  getProducts,
  publish,
  update,
} from "@/modules/business-brain/services/business-brain-product-service";
import { createClient } from "@/utils/supabase/server";
import { loadKnowledgeEntries } from "@/lib/knowledge/queries";

const PRODUCTS_PATH = "/business-brain/products";

function revalidateProducts() {
  revalidatePath(PRODUCTS_PATH);
}

function requireOrgId(profile: { organization_id: string | null }) {
  if (!profile.organization_id) {
    throw new Error("Organization is required.");
  }
  return profile.organization_id;
}

export async function loadBrainProductsAction() {
  const { profile } = await requireProfile();
  const organizationId = requireOrgId(profile);
  const products = await getProducts(organizationId);
  return { products, canEdit: isAdminOrOwner(profile) };
}

export async function loadBrainProductAction(productId: string) {
  const { profile } = await requireProfile();
  const organizationId = requireOrgId(profile);
  const product = await getProduct(organizationId, productId);
  return { product, canEdit: isAdminOrOwner(profile) };
}

export async function loadProductFaqOptionsAction() {
  const { profile } = await requireProfile();
  const organizationId = requireOrgId(profile);
  const supabase = await createClient();
  const entries = await loadKnowledgeEntries(supabase, organizationId, {
    category: null,
    tag: null,
    query: null,
  });
  return entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    category: entry.category,
  }));
}

export async function createBrainProductAction() {
  const { profile } = await requireProfile();
  if (!isAdminOrOwner(profile)) {
    return { ok: false as const, error: "Permission denied." };
  }

  try {
    const organizationId = requireOrgId(profile);
    const product = await create(organizationId);
    revalidateProducts();
    return { ok: true as const, product };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to create product.",
    };
  }
}

export async function updateBrainProductAction(productId: string, input: unknown) {
  const { profile } = await requireProfile();
  if (!isAdminOrOwner(profile)) {
    return { ok: false as const, error: "Permission denied." };
  }

  const parsed = brainProductFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid product data.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const organizationId = requireOrgId(profile);
    const product = await update(organizationId, productId, parsed.data);
    revalidateProducts();
    return { ok: true as const, product };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to update product.",
    };
  }
}

export async function publishBrainProductAction(productId: string) {
  const { profile } = await requireProfile();
  if (!isAdminOrOwner(profile)) {
    return { ok: false as const, error: "Permission denied." };
  }

  try {
    const organizationId = requireOrgId(profile);
    const product = await publish(organizationId, productId);
    revalidateProducts();
    return { ok: true as const, product };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to publish product.",
    };
  }
}

export async function archiveBrainProductAction(productId: string) {
  const { profile } = await requireProfile();
  if (!isAdminOrOwner(profile)) {
    return { ok: false as const, error: "Permission denied." };
  }

  try {
    const organizationId = requireOrgId(profile);
    const product = await archive(organizationId, productId);
    revalidateProducts();
    return { ok: true as const, product };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to archive product.",
    };
  }
}

export async function linkProductFaqAction(productId: string, knowledgeEntryId: string) {
  const { profile } = await requireProfile();
  if (!isAdminOrOwner(profile)) {
    return { ok: false as const, error: "Permission denied." };
  }

  try {
    const organizationId = requireOrgId(profile);
    await getProduct(organizationId, productId);
    await insertProductFaqLink(productId, knowledgeEntryId);
    const product = await getProduct(organizationId, productId);
    revalidateProducts();
    return { ok: true as const, product };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to link FAQ.",
    };
  }
}

export async function unlinkProductFaqAction(productId: string, linkId: string) {
  const { profile } = await requireProfile();
  if (!isAdminOrOwner(profile)) {
    return { ok: false as const, error: "Permission denied." };
  }

  try {
    const organizationId = requireOrgId(profile);
    await getProduct(organizationId, productId);
    await deleteProductFaqLink(linkId);
    const product = await getProduct(organizationId, productId);
    revalidateProducts();
    return { ok: true as const, product };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to unlink FAQ.",
    };
  }
}

export async function createAndLinkProductFaqAction(
  productId: string,
  input: unknown,
) {
  const { profile } = await requireProfile();
  if (!isAdminOrOwner(profile)) {
    return { ok: false as const, error: "Permission denied." };
  }

  const parsed = createProductFaqSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid FAQ data.",
    };
  }

  try {
    const organizationId = requireOrgId(profile);
    await getProduct(organizationId, productId);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("knowledge_entries")
      .insert({
        organization_id: organizationId,
        created_by: profile.id,
        title: parsed.data.title,
        category: "faq",
        content: parsed.data.content,
        tags: ["product-faq"],
        source_type: "manual",
        ai_status: "pending",
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create FAQ.");
    }

    await insertProductFaqLink(productId, data.id);
    const product = await getProduct(organizationId, productId);
    revalidateProducts();
    return { ok: true as const, product };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to create FAQ.",
    };
  }
}

export async function importProductFaqsAction(
  productId: string,
  items: FaqImportApplyItem[],
) {
  const { profile } = await requireProfile();
  if (!isAdminOrOwner(profile)) {
    return { ok: false as const, error: "Permission denied." };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return {
      ok: false as const,
      error: "No FAQ entries to import.",
    };
  }

  try {
    const organizationId = requireOrgId(profile);
    const product = await getProduct(organizationId, productId);
    if (!product) {
      return { ok: false as const, error: "Product not found." };
    }
    const supabase = await createClient();

    const existingQuestions = new Set(
      product.faqLinks.map((link) => normalizeFaqQuestion(link.knowledgeTitle)),
    );
    const batchQuestions = new Set<string>();

    const result: FaqImportApplyResult = {
      created: 0,
      skippedDuplicates: 0,
      skippedInvalid: 0,
      duplicateQuestions: [],
    };

    for (const item of items) {
      const title = item.question?.trim() ?? "";
      const content = item.content?.trim() ?? "";

      if (!title || !content) {
        result.skippedInvalid += 1;
        continue;
      }

      const normalized = normalizeFaqQuestion(title);
      if (existingQuestions.has(normalized) || batchQuestions.has(normalized)) {
        result.skippedDuplicates += 1;
        result.duplicateQuestions.push(title);
        continue;
      }

      const { data, error } = await supabase
        .from("knowledge_entries")
        .insert({
          organization_id: organizationId,
          created_by: profile.id,
          title,
          category: "faq",
          content,
          tags: ["product-faq"],
          source_type: "manual",
          ai_status: "pending",
        })
        .select("id")
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? "Failed to create FAQ.");
      }

      await insertProductFaqLink(productId, data.id);
      existingQuestions.add(normalized);
      batchQuestions.add(normalized);
      result.created += 1;
    }

    const refreshedProduct = await getProduct(organizationId, productId);
    revalidateProducts();
    return { ok: true as const, product: refreshedProduct, result };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to import FAQ entries.",
    };
  }
}

type UploadProductDocumentFailure = {
  ok: false;
  error: string;
  errorCode: ProductDocumentUploadServerErrorCode;
};

function uploadFailure(
  errorCode: ProductDocumentUploadServerErrorCode,
  error: string,
): UploadProductDocumentFailure {
  logProductUploadStep("Returned JSON", { ok: false, errorCode, error });
  return { ok: false as const, error, errorCode };
}

async function requireAuthorizedProductContext(productId: string) {
  const { profile } = await requireProfile();
  if (!isAdminOrOwner(profile)) {
    return {
      ok: false as const,
      failure: uploadFailure("UNAUTHORIZED", "Permission denied."),
    };
  }

  if (!productId) {
    return {
      ok: false as const,
      failure: uploadFailure("PRODUCT_NOT_FOUND", "Product is required."),
    };
  }

  try {
    const organizationId = requireOrgId(profile);
    await getProduct(organizationId, productId);
    return { ok: true as const, profile, organizationId, productId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Product not found.";
    const errorCode =
      message.toLowerCase().includes("organization") ? "WORKSPACE_NOT_FOUND" : "PRODUCT_NOT_FOUND";
    return {
      ok: false as const,
      failure: uploadFailure(errorCode, message),
    };
  }
}

function isValidDocumentType(
  documentType: string,
): documentType is "itinerary" | "brochure" | "gallery" | "video" {
  return (
    documentType === "itinerary" ||
    documentType === "brochure" ||
    documentType === "gallery" ||
    documentType === "video"
  );
}

export async function prepareProductDocumentUploadAction(input: {
  productId: string;
  documentType: string;
  originalFilename: string;
  declaredMimeType: string;
  declaredSize: number;
}) {
  beginProductUploadDebug();

  try {
    const context = await requireAuthorizedProductContext(input.productId);
    if (!context.ok) {
      return context.failure;
    }

    const { organizationId, productId } = context;

    if (!isValidDocumentType(input.documentType)) {
      return uploadFailure("INVALID_DOCUMENT_CATEGORY", "Invalid document type.");
    }

    const validation = validateProductDocumentPrepareMetadata({
      originalFilename: input.originalFilename,
      declaredMimeType: input.declaredMimeType,
      declaredSize: input.declaredSize,
      documentType: input.documentType,
    });

    if (!validation.ok) {
      return uploadFailure(validation.code, validation.message);
    }

    const uploadId = randomUUID();
    const storagePath = buildProductDocumentStoragePath(
      organizationId,
      productId,
      uploadId,
      input.originalFilename,
    );

    let signedUpload;
    try {
      signedUpload = await createBrainProductSignedUploadUrl(storagePath);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to prepare upload.";
      return uploadFailure("SIGNED_UPLOAD_FAILED", message);
    }

    logProductUploadStep("Prepared direct upload", {
      bucket: BRAIN_PRODUCT_BUCKET,
      storagePath,
      mimeType: validation.mimeType,
      declaredSize: input.declaredSize,
    });

    return {
      ok: true as const,
      bucket: BRAIN_PRODUCT_BUCKET,
      storagePath,
      token: signedUpload.token,
      mimeType: validation.mimeType,
    };
  } catch (error) {
    logProductUploadError(error);
    const message = error instanceof Error ? error.message : "Failed to prepare upload.";
    return uploadFailure("UPLOAD_PREPARATION_FAILED", message);
  } finally {
    endProductUploadDebug();
  }
}

export async function finalizeProductDocumentUploadAction(input: {
  productId: string;
  documentType: string;
  storagePath: string;
  originalFilename: string;
}) {
  beginProductUploadDebug();

  try {
    const context = await requireAuthorizedProductContext(input.productId);
    if (!context.ok) {
      return context.failure;
    }

    const { organizationId, productId } = context;

    if (!isValidDocumentType(input.documentType)) {
      return uploadFailure("INVALID_DOCUMENT_CATEGORY", "Invalid document type.");
    }

    const existing = await findProductDocumentByFilePath(input.storagePath);
    if (existing) {
      return uploadFailure(
        "DUPLICATE_UPLOAD_FINALIZATION",
        "This upload has already been finalized.",
      );
    }

    const verification = await verifyStoredProductDocumentObject({
      storagePath: input.storagePath,
      organizationId,
      productId,
      documentType: input.documentType,
      originalFilename: input.originalFilename,
    });

    if (!verification.ok) {
      try {
        await removeBrainProductFile(input.storagePath);
        logProductUploadStep("Rolled back invalid uploaded object", {
          filePath: input.storagePath,
        });
      } catch (rollbackError) {
        logProductUploadError(rollbackError);
      }
      return uploadFailure(verification.code, verification.message);
    }

    try {
      await insertProductDocumentWithServiceRole({
        productId,
        documentType: input.documentType,
        fileName: input.originalFilename,
        filePath: input.storagePath,
        mimeType: verification.mimeType,
      });
    } catch (error) {
      try {
        await removeBrainProductFile(input.storagePath);
        logProductUploadStep("Rolled back storage object after DB failure", {
          filePath: input.storagePath,
        });
      } catch (rollbackError) {
        logProductUploadError(rollbackError);
      }

      const message = error instanceof Error ? error.message : "Failed to save document.";
      return uploadFailure(inferServerUploadErrorCode(message), message);
    }

    const product = await getProduct(organizationId, productId);
    revalidateProducts();
    logProductUploadStep("Finalized direct upload", {
      storagePath: input.storagePath,
      productId: product?.id,
      documentCount: product?.documents.length,
    });
    return { ok: true as const, product };
  } catch (error) {
    logProductUploadError(error);
    const message = error instanceof Error ? error.message : "Failed to finalize upload.";
    return uploadFailure("UPLOAD_FINALIZATION_FAILED", message);
  } finally {
    endProductUploadDebug();
  }
}

export async function uploadProductDocumentAction(formData: FormData) {
  beginProductUploadDebug();

  try {
    const { profile } = await requireProfile();
    if (!isAdminOrOwner(profile)) {
      return uploadFailure("UNAUTHORIZED", "Permission denied.");
    }

    const productId = String(formData.get("productId") ?? "");
    const documentType = String(formData.get("documentType") ?? "");
    const fileUrl = String(formData.get("fileUrl") ?? "").trim();
    const file = formData.get("file");

    logProductUploadStep("Request payload", {
      productId,
      documentType,
      fileUrl: fileUrl || null,
      file:
        file instanceof File
          ? {
              name: file.name,
              size: file.size,
              type: file.type || "(empty)",
            }
          : null,
    });

    if (!productId) {
      return uploadFailure("PRODUCT_NOT_FOUND", "Product is required.");
    }

    if (
      documentType !== "itinerary" &&
      documentType !== "brochure" &&
      documentType !== "gallery" &&
      documentType !== "video"
    ) {
      return uploadFailure("INVALID_DOCUMENT_CATEGORY", "Invalid document type.");
    }

    let organizationId: string;
    try {
      organizationId = requireOrgId(profile);
      await getProduct(organizationId, productId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Product not found.";
      const errorCode =
        message.toLowerCase().includes("organization") ? "WORKSPACE_NOT_FOUND" : "PRODUCT_NOT_FOUND";
      return uploadFailure(errorCode, message);
    }

    if (documentType === "video" && fileUrl) {
      const document = await insertProductDocumentWithServiceRole({
        productId,
        documentType: "video",
        fileUrl,
        fileName: "Video link",
      });
      logProductUploadStep("Upload result", { mode: "video-url", documentId: document.id });

      const product = await getProduct(organizationId, productId);
      revalidateProducts();
      logProductUploadStep("Returned JSON", { ok: true, productId: product?.id, documentCount: product?.documents.length });
      return { ok: true as const, product };
    }

    if (file instanceof File && file.size > 0) {
      return uploadFailure(
        "UPLOAD_PREPARATION_FAILED",
        "File uploads must use the direct Storage upload flow.",
      );
    }

    return uploadFailure("EMPTY_FILE", "File or video URL is required.");
  } catch (error) {
    logProductUploadError(error);
    const message = error instanceof Error ? error.message : "Failed to upload document.";
    return uploadFailure(inferServerUploadErrorCode(message), message);
  } finally {
    endProductUploadDebug();
  }
}

export async function deleteProductDocumentAction(
  productId: string,
  documentId: string,
) {
  const { profile } = await requireProfile();
  if (!isAdminOrOwner(profile)) {
    return { ok: false as const, error: "Permission denied." };
  }

  try {
    const organizationId = requireOrgId(profile);
    await getProduct(organizationId, productId);
    const document = await findProductDocumentById(documentId);

    if (!document || document.product_id !== productId) {
      return { ok: false as const, error: "Document not found." };
    }

    if (document.file_path) {
      await removeBrainProductFile(document.file_path);
    }

    await deleteProductDocument(documentId);
    const product = await getProduct(organizationId, productId);
    revalidateProducts();
    return { ok: true as const, product };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to delete document.",
    };
  }
}

export async function getProductDocumentUrlAction(documentId: string) {
  const { profile } = await requireProfile();
  requireOrgId(profile);

  const document = await findProductDocumentById(documentId);
  if (!document?.file_path) {
    return { ok: false as const, error: "Document not found." };
  }

  const url = await createBrainProductFileSignedUrl(document.file_path);
  if (!url) {
    return { ok: false as const, error: "Could not generate download URL." };
  }

  return { ok: true as const, url };
}
