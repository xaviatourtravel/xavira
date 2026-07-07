import type { ProductDocumentType } from "@/modules/business-brain/types/products";
import { resolveProductUploadMimeType } from "@/modules/business-brain/lib/product-upload-debug";

export const PRODUCT_DOCUMENT_MAX_BYTES = 50 * 1024 * 1024;

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

export function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

export function isPdfFile(file: File): boolean {
  const mime = resolveProductUploadMimeType(file);
  return mime === "application/pdf" || getFileExtension(file.name) === "pdf";
}

function isImageFile(file: File): boolean {
  const mime = resolveProductUploadMimeType(file);
  return IMAGE_MIME_TYPES.has(mime);
}

function isVideoFile(file: File): boolean {
  const mime = resolveProductUploadMimeType(file);
  return VIDEO_MIME_TYPES.has(mime);
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

  if (file.size > PRODUCT_DOCUMENT_MAX_BYTES) {
    return { ok: false, code: "too_large" };
  }

  const mimeType = resolveProductUploadMimeType(file);

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

export function classifyProductUploadError(message: string | null | undefined): ProductDocumentUploadErrorCode {
  const normalized = message?.trim().toLowerCase() ?? "";

  if (!normalized) return "unknown";

  if (/permission denied|not authorized|forbidden/.test(normalized)) {
    return "permission";
  }

  if (/exceeds 50mb|too large|body exceeded|413|size limit/.test(normalized)) {
    return "too_large";
  }

  if (/bucket not found|storage|mime type|not allowed|object not found/.test(normalized)) {
    return "storage";
  }

  if (/network|fetch failed|failed to fetch|timeout|connection|unexpected response/.test(normalized)) {
    return "network";
  }

  if (/pdf|corrupt|cannot be read|unreadable/.test(normalized)) {
    return "corrupted_pdf";
  }

  if (/unsupported|invalid document|file or video/.test(normalized)) {
    return "unsupported";
  }

  return "unknown";
}
