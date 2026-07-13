import {
  canonicalProductDocumentMimeType,
  getFileExtension,
  isPdfExtension,
  PRODUCT_DOCUMENT_CATEGORY_MAX_BYTES,
  PRODUCT_DOCUMENT_MAX_BYTES,
} from "@/modules/business-brain/lib/product-document-upload-config";
import {
  inferServerUploadErrorCode,
  mapServerUploadErrorToUi,
  type ProductDocumentUploadServerErrorCode,
} from "@/modules/business-brain/lib/product-document-upload-errors";
import type { ProductDocumentType } from "@/modules/business-brain/types/products";

export { PRODUCT_DOCUMENT_MAX_BYTES };

export type ProductDocumentUploadErrorCode =
  | "unsupported"
  | "too_large"
  | "corrupted_pdf"
  | "storage"
  | "permission"
  | "network"
  | "unknown";

const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const VIDEO_MIME_TYPES = new Set(["video/mp4", "video/quicktime"]);

export { getFileExtension };

export function isPdfFile(file: File): boolean {
  const mime = canonicalProductDocumentMimeType(file.name, file.type);
  return mime === "application/pdf" || isPdfExtension(file.name);
}

function isImageFile(file: File): boolean {
  const mime = canonicalProductDocumentMimeType(file.name, file.type);
  return mime !== null && IMAGE_MIME_TYPES.has(mime);
}

function isVideoFile(file: File): boolean {
  const mime = canonicalProductDocumentMimeType(file.name, file.type);
  return mime !== null && VIDEO_MIME_TYPES.has(mime);
}

export async function validatePdfReadable(file: File): Promise<boolean> {
  try {
    const buffer = await file.slice(0, 5).arrayBuffer();
    const header = new TextDecoder().decode(buffer);
    return header.startsWith("%PDF");
  } catch {
    return false;
  }
}

export type ProductDocumentValidationResult =
  | { ok: true; mimeType: string }
  | { ok: false; code: ProductDocumentUploadErrorCode };

export async function validateProductDocumentFile(
  file: File,
  documentType: ProductDocumentType,
): Promise<ProductDocumentValidationResult> {
  if (!file || file.size <= 0) {
    return { ok: false, code: "unsupported" };
  }

  const maxBytes = PRODUCT_DOCUMENT_CATEGORY_MAX_BYTES[documentType];
  if (file.size > maxBytes) {
    return { ok: false, code: "too_large" };
  }

  const mimeType = canonicalProductDocumentMimeType(file.name, file.type);
  if (!mimeType) {
    return { ok: false, code: "unsupported" };
  }

  if (documentType === "gallery") {
    if (!isImageFile(file)) {
      return { ok: false, code: "unsupported" };
    }
    return { ok: true, mimeType };
  }

  if (documentType === "video") {
    if (!isVideoFile(file)) {
      return { ok: false, code: "unsupported" };
    }
    return { ok: true, mimeType };
  }

  if (documentType === "itinerary" || documentType === "brochure") {
    if (isImageFile(file)) {
      return { ok: true, mimeType };
    }

    if (isPdfFile(file)) {
      const readable = await validatePdfReadable(file);
      if (!readable) {
        return { ok: false, code: "corrupted_pdf" };
      }
      return { ok: true, mimeType: "application/pdf" };
    }

    return { ok: false, code: "unsupported" };
  }

  return { ok: false, code: "unsupported" };
}

export function classifyProductUploadError(
  message: string | null | undefined,
  serverCode?: ProductDocumentUploadServerErrorCode | null,
): ProductDocumentUploadErrorCode {
  if (serverCode) {
    return mapServerUploadErrorToUi(serverCode);
  }

  const normalized = message?.trim().toLowerCase() ?? "";
  if (/network|fetch failed|failed to fetch|timeout|connection|unexpected response/.test(normalized)) {
    return "network";
  }

  if (/bucket not found|mime type|mimetype|not allowed|object not found|storage/.test(normalized)) {
    return "storage";
  }

  if (/pdf|corrupt|cannot be read|unreadable|invalid or unreadable/.test(normalized)) {
    return "corrupted_pdf";
  }

  return mapServerUploadErrorToUi(inferServerUploadErrorCode(message ?? ""));
}
