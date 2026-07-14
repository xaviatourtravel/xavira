import type { ProductDocumentUploadServerErrorCode } from "@/modules/business-brain/lib/product-document-upload-errors";
import {
  canonicalProductDocumentMimeType,
  isCanonicalImageMimeType,
  isCanonicalVideoMimeType,
  isPdfExtension,
  PRODUCT_DOCUMENT_CATEGORY_MAX_BYTES,
} from "@/modules/business-brain/lib/product-document-upload-config";
import type { ProductDocumentType } from "@/modules/business-brain/types/products";

export type ProductDocumentServerValidationResult =
  | { ok: true; mimeType: string }
  | { ok: false; code: ProductDocumentUploadServerErrorCode; message: string };

function isPdfBuffer(buffer: Buffer): boolean {
  return buffer.subarray(0, 5).toString("utf8").startsWith("%PDF");
}

export function validateProductDocumentUploadServer(input: {
  fileName: string;
  browserMime?: string;
  buffer: Buffer;
  documentType: ProductDocumentType;
}): ProductDocumentServerValidationResult {
  const { fileName, buffer, documentType } = input;
  const browserMime = input.browserMime?.trim() ?? "";

  if (!buffer.byteLength) {
    return {
      ok: false,
      code: "EMPTY_FILE",
      message: "File is empty.",
    };
  }

  const maxBytes = PRODUCT_DOCUMENT_CATEGORY_MAX_BYTES[documentType];
  if (buffer.byteLength > maxBytes) {
    return {
      ok: false,
      code: "FILE_TOO_LARGE",
      message: `File exceeds ${Math.round(maxBytes / (1024 * 1024))}MB limit.`,
    };
  }

  const mimeType = canonicalProductDocumentMimeType(fileName, browserMime);
  if (!mimeType) {
    return {
      ok: false,
      code: "INVALID_FILE_TYPE",
      message: "Unsupported file type.",
    };
  }

  if (documentType === "gallery") {
    if (!isCanonicalImageMimeType(mimeType)) {
      return {
        ok: false,
        code: "INVALID_FILE_TYPE",
        message: "Gallery accepts JPEG, PNG, or WebP images only.",
      };
    }
    return { ok: true, mimeType };
  }

  if (documentType === "video") {
    if (!isCanonicalVideoMimeType(mimeType)) {
      return {
        ok: false,
        code: "INVALID_FILE_TYPE",
        message: "Video accepts MP4 or MOV only.",
      };
    }
    return { ok: true, mimeType };
  }

  if (documentType === "itinerary" || documentType === "brochure") {
    if (isCanonicalImageMimeType(mimeType)) {
      return { ok: true, mimeType };
    }

    if (mimeType === "application/pdf" || isPdfExtension(fileName)) {
      if (!isPdfBuffer(buffer)) {
        return {
          ok: false,
          code: "INVALID_FILE_TYPE",
          message: "PDF file header is invalid or unreadable.",
        };
      }
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
