import {
  canonicalProductDocumentMimeType,
  isCanonicalImageMimeType,
  isCanonicalVideoMimeType,
  isPdfExtension,
  PRODUCT_DOCUMENT_CATEGORY_MAX_BYTES,
} from "@/modules/business-brain/lib/product-document-upload-config";
import type { ProductDocumentUploadServerErrorCode } from "@/modules/business-brain/lib/product-document-upload-errors";
import {
  isProductDocumentStoragePathScoped,
  validateProductDocumentPrepareMetadata,
} from "@/modules/business-brain/lib/product-document-upload-path";
import {
  getBrainProductStoredObjectInfo,
  verifyBrainProductPdfHeader,
} from "@/modules/business-brain/lib/product-storage";
import type { ProductDocumentType } from "@/modules/business-brain/types/products";

/**
 * Finalize verifies an object that already exists in Storage after the browser upload.
 * Prepare/finalize metadata alone never creates Storage bytes; orphans occur when upload
 * succeeds but finalize is abandoned or fails before rollback/cleanup completes.
 */

export type FinalizeStoredObjectVerificationResult =
  | { ok: true; mimeType: string; size: number }
  | { ok: false; code: ProductDocumentUploadServerErrorCode; message: string };

export async function verifyStoredProductDocumentObject(input: {
  storagePath: string;
  organizationId: string;
  productId: string;
  documentType: ProductDocumentType;
  originalFilename: string;
}): Promise<FinalizeStoredObjectVerificationResult> {
  if (
    !isProductDocumentStoragePathScoped(input.storagePath, input.organizationId, input.productId)
  ) {
    return {
      ok: false,
      code: "UPLOAD_PATH_MISMATCH",
      message: "Storage path does not match the authenticated product.",
    };
  }

  const objectInfo = await getBrainProductStoredObjectInfo(input.storagePath);
  if (!objectInfo) {
    return {
      ok: false,
      code: "UPLOADED_OBJECT_NOT_FOUND",
      message: "Uploaded object was not found in storage.",
    };
  }

  if (objectInfo.size <= 0) {
    return {
      ok: false,
      code: "UPLOADED_OBJECT_INVALID",
      message: "Uploaded object is empty.",
    };
  }

  const maxBytes = PRODUCT_DOCUMENT_CATEGORY_MAX_BYTES[input.documentType];
  if (objectInfo.size > maxBytes) {
    return {
      ok: false,
      code: "FILE_TOO_LARGE",
      message: "Uploaded object exceeds upload size limit.",
    };
  }

  const mimeType =
    canonicalProductDocumentMimeType(input.originalFilename, objectInfo.mimeType ?? "") ??
    canonicalProductDocumentMimeType(input.originalFilename, "");

  if (!mimeType) {
    return {
      ok: false,
      code: "UPLOADED_OBJECT_INVALID",
      message: "Uploaded object has an unsupported content type.",
    };
  }

  if (input.documentType === "gallery" && !isCanonicalImageMimeType(mimeType)) {
    return {
      ok: false,
      code: "UPLOADED_OBJECT_INVALID",
      message: "Uploaded object is not a supported gallery image.",
    };
  }

  if (input.documentType === "video" && !isCanonicalVideoMimeType(mimeType)) {
    return {
      ok: false,
      code: "UPLOADED_OBJECT_INVALID",
      message: "Uploaded object is not a supported video format.",
    };
  }

  if (input.documentType === "itinerary" || input.documentType === "brochure") {
    if (isCanonicalImageMimeType(mimeType)) {
      return { ok: true, mimeType, size: objectInfo.size };
    }

    if (mimeType === "application/pdf" || isPdfExtension(input.originalFilename)) {
      const readable = await verifyBrainProductPdfHeader(input.storagePath);
      if (!readable) {
        return {
          ok: false,
          code: "UPLOADED_OBJECT_INVALID",
          message: "Uploaded PDF header is invalid or unreadable.",
        };
      }
      return { ok: true, mimeType: "application/pdf", size: objectInfo.size };
    }

    return {
      ok: false,
      code: "UPLOADED_OBJECT_INVALID",
      message: "Uploaded object is not valid for this document slot.",
    };
  }

  return {
    ok: false,
    code: "INVALID_DOCUMENT_CATEGORY",
    message: "Invalid document category.",
  };
}

export { validateProductDocumentPrepareMetadata };
