"use server";

import { revalidatePath } from "next/cache";

import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { createBrainProductFileSignedUrl, removeBrainProductFile, uploadBrainProductFile } from "@/modules/business-brain/lib/product-storage";
import { validateProductDocumentUploadServer } from "@/modules/business-brain/lib/validate-product-document-server";
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
      const buffer = Buffer.from(await file.arrayBuffer());
      const validation = validateProductDocumentUploadServer({
        fileName: file.name,
        browserMime: file.type,
        buffer,
        documentType: documentType as "itinerary" | "brochure" | "gallery" | "video",
      });

      logProductUploadStep("Selected file", {
        name: file.name,
        size: file.size,
        browserType: file.type || "(empty)",
        resolvedMimeType: validation.ok ? validation.mimeType : null,
        validation,
      });

      if (!validation.ok) {
        return uploadFailure(validation.code, validation.message);
      }

      const mimeType = validation.mimeType;
      logProductUploadStep("Upload result", {
        bufferByteLength: buffer.byteLength,
        bucket: "brain-product-files",
      });

      let uploadedFilePath: string | null = null;
      try {
        const uploaded = await uploadBrainProductFile({
          organizationId,
          productId,
          buffer,
          fileName: file.name,
          mimeType,
        });
        uploadedFilePath = uploaded.filePath;

        const document = await insertProductDocumentWithServiceRole({
          productId,
          documentType: documentType as "itinerary" | "brochure" | "gallery" | "video",
          fileName: file.name,
          filePath: uploaded.filePath,
          mimeType,
        });

        logProductUploadStep("Upload result", {
          filePath: uploaded.filePath,
          documentId: document.id,
        });
      } catch (error) {
        if (uploadedFilePath) {
          try {
            await removeBrainProductFile(uploadedFilePath);
            logProductUploadStep("Rolled back storage object", { filePath: uploadedFilePath });
          } catch (rollbackError) {
            logProductUploadError(rollbackError);
          }
        }

        const message = error instanceof Error ? error.message : "Failed to upload document.";
        return uploadFailure(inferServerUploadErrorCode(message), message);
      }

      const product = await getProduct(organizationId, productId);
      revalidateProducts();
      logProductUploadStep("Returned JSON", {
        ok: true,
        productId: product?.id,
        documentCount: product?.documents.length,
      });
      return { ok: true as const, product };
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
