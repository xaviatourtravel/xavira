import type { ProductDocumentType } from "@/modules/business-brain/types/products";

/** Max upload size per document category (bytes). Matches `brain-product-files` bucket limit. */
export const PRODUCT_DOCUMENT_CATEGORY_MAX_BYTES: Record<ProductDocumentType, number> = {
  itinerary: 50 * 1024 * 1024,
  brochure: 50 * 1024 * 1024,
  gallery: 50 * 1024 * 1024,
  video: 50 * 1024 * 1024,
};

export const PRODUCT_DOCUMENT_MAX_BYTES = PRODUCT_DOCUMENT_CATEGORY_MAX_BYTES.itinerary;

/** Browser PDF MIME aliases that must normalize to `application/pdf` for Storage. */
export const PRODUCT_DOCUMENT_PDF_MIME_ALIASES = [
  "application/pdf",
  "application/vnd.adobe.pdf",
  "application/x-pdf",
] as const;

export const PRODUCT_DOCUMENT_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const PRODUCT_DOCUMENT_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/quicktime",
] as const;

export const PRODUCT_DOCUMENT_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;
export const PRODUCT_DOCUMENT_VIDEO_EXTENSIONS = ["mp4", "mov"] as const;
export const PRODUCT_DOCUMENT_PDF_EXTENSION = "pdf";

const PDF_MIME_ALIASES = new Set<string>(PRODUCT_DOCUMENT_PDF_MIME_ALIASES);
const IMAGE_MIME_TYPES = new Set<string>(PRODUCT_DOCUMENT_IMAGE_MIME_TYPES);
const VIDEO_MIME_TYPES = new Set<string>(PRODUCT_DOCUMENT_VIDEO_MIME_TYPES);

export function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

export function isPdfExtension(fileName: string): boolean {
  return getFileExtension(fileName) === PRODUCT_DOCUMENT_PDF_EXTENSION;
}

/** Normalize browser/extension hints to a bucket-allowed MIME type. */
export function canonicalProductDocumentMimeType(
  fileName: string,
  browserMime = "",
): string | null {
  const mime = browserMime.trim().toLowerCase();
  const extension = getFileExtension(fileName);

  if (PDF_MIME_ALIASES.has(mime) || isPdfExtension(fileName)) {
    return "application/pdf";
  }

  if (IMAGE_MIME_TYPES.has(mime)) {
    return mime;
  }

  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "mp4":
      return "video/mp4";
    case "mov":
      return "video/quicktime";
    default:
      break;
  }

  return mime || null;
}

export function isCanonicalImageMimeType(mimeType: string): boolean {
  return IMAGE_MIME_TYPES.has(mimeType);
}

export function isCanonicalVideoMimeType(mimeType: string): boolean {
  return VIDEO_MIME_TYPES.has(mimeType);
}
