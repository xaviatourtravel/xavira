import type { ProductDocumentType } from "@/modules/business-brain/types/products";

import {
  canonicalProductDocumentMimeType,
  isCanonicalImageMimeType,
  isCanonicalVideoMimeType,
  isPdfExtension,
  PRODUCT_DOCUMENT_CATEGORY_MAX_BYTES,
} from "@/modules/business-brain/lib/product-document-upload-config";
import type { ProductDocumentUploadServerErrorCode } from "@/modules/business-brain/lib/product-document-upload-errors";

export function sanitizeProductDocumentFileName(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  const stem = lastDot > 0 ? fileName.slice(0, lastDot) : fileName;
  const extension = lastDot > 0 ? fileName.slice(lastDot + 1) : "";

  const normalizedStem = stem
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const normalizedExtension = extension.toLowerCase().replace(/[^a-z0-9]+/g, "");

  if (!normalizedStem && !normalizedExtension) {
    return "document";
  }

  if (!normalizedExtension) {
    return normalizedStem || "document";
  }

  return `${normalizedStem || "document"}.${normalizedExtension}`;
}

export function isSafeOriginalFilename(fileName: string): boolean {
  const trimmed = fileName.trim();
  if (!trimmed) return false;
  if (trimmed.includes("/") || trimmed.includes("\\")) return false;
  if (trimmed.includes("..")) return false;
  return true;
}

export function buildProductDocumentStoragePath(
  organizationId: string,
  productId: string,
  uploadId: string,
  originalFilename: string,
): string {
  return `${organizationId}/${productId}/${uploadId}-${sanitizeProductDocumentFileName(originalFilename)}`;
}

export function getProductDocumentStoragePrefix(organizationId: string, productId: string): string {
  return `${organizationId}/${productId}/`;
}

export function isProductDocumentStoragePathScoped(
  storagePath: string,
  organizationId: string,
  productId: string,
): boolean {
  const prefix = getProductDocumentStoragePrefix(organizationId, productId);
  if (!storagePath.startsWith(prefix)) return false;
  const remainder = storagePath.slice(prefix.length);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-.+$/i.test(
    remainder,
  );
}

export type ProductDocumentPrepareMetadataResult =
  | { ok: true; mimeType: string }
  | { ok: false; code: ProductDocumentUploadServerErrorCode; message: string };

export function validateProductDocumentPrepareMetadata(input: {
  originalFilename: string;
  declaredMimeType: string;
  declaredSize: number;
  documentType: ProductDocumentType;
}): ProductDocumentPrepareMetadataResult {
  const { originalFilename, declaredSize, documentType } = input;
  const declaredMimeType = input.declaredMimeType.trim();

  if (!isSafeOriginalFilename(originalFilename)) {
    return {
      ok: false,
      code: "INVALID_FILE_TYPE",
      message: "Filename is invalid.",
    };
  }

  if (declaredSize <= 0) {
    return {
      ok: false,
      code: "EMPTY_FILE",
      message: "File is empty.",
    };
  }

  const maxBytes = PRODUCT_DOCUMENT_CATEGORY_MAX_BYTES[documentType];
  if (declaredSize > maxBytes) {
    return {
      ok: false,
      code: "FILE_TOO_LARGE",
      message: "File exceeds upload size limit.",
    };
  }

  const mimeType = canonicalProductDocumentMimeType(originalFilename, declaredMimeType);
  if (!mimeType) {
    return {
      ok: false,
      code: "INVALID_FILE_TYPE",
      message: "Unsupported file type.",
    };
  }

  if (documentType === "gallery" && !isCanonicalImageMimeType(mimeType)) {
    return {
      ok: false,
      code: "INVALID_FILE_TYPE",
      message: "Gallery accepts JPEG, PNG, or WebP images only.",
    };
  }

  if (documentType === "video" && !isCanonicalVideoMimeType(mimeType)) {
    return {
      ok: false,
      code: "INVALID_FILE_TYPE",
      message: "Video accepts MP4 or MOV only.",
    };
  }

  if (documentType === "itinerary" || documentType === "brochure") {
    if (isCanonicalImageMimeType(mimeType)) {
      return { ok: true, mimeType };
    }

    if (mimeType === "application/pdf" || isPdfExtension(originalFilename)) {
      return { ok: true, mimeType: "application/pdf" };
    }

    return {
      ok: false,
      code: "INVALID_FILE_TYPE",
      message: "Unsupported file type for this document slot.",
    };
  }

  return {
    ok: false,
    code: "INVALID_DOCUMENT_CATEGORY",
    message: "Invalid document category.",
  };
}

export function isPdfBuffer(buffer: Buffer): boolean {
  return buffer.subarray(0, 5).toString("utf8").startsWith("%PDF");
}
