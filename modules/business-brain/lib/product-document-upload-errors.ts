/** Server-authoritative upload error codes for Product documents. */
export type ProductDocumentUploadServerErrorCode =
  | "EMPTY_FILE"
  | "INVALID_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "INVALID_DOCUMENT_CATEGORY"
  | "UNAUTHORIZED"
  | "PRODUCT_NOT_FOUND"
  | "WORKSPACE_NOT_FOUND"
  | "STORAGE_UPLOAD_FAILED"
  | "DATABASE_SAVE_FAILED"
  | "FILE_ACCESS_FAILED"
  | "UNKNOWN_UPLOAD_ERROR";

/** Client-facing upload error buckets mapped to BB UI copy. */
export type ProductDocumentUploadUiErrorCode =
  | "unsupported"
  | "too_large"
  | "corrupted_pdf"
  | "storage"
  | "permission"
  | "network"
  | "unknown";

export function mapServerUploadErrorToUi(
  code: ProductDocumentUploadServerErrorCode | null | undefined,
): ProductDocumentUploadUiErrorCode {
  switch (code) {
    case "EMPTY_FILE":
    case "INVALID_FILE_TYPE":
    case "INVALID_DOCUMENT_CATEGORY":
      return "unsupported";
    case "FILE_TOO_LARGE":
      return "too_large";
    case "UNAUTHORIZED":
      return "permission";
    case "STORAGE_UPLOAD_FAILED":
    case "FILE_ACCESS_FAILED":
      return "storage";
    case "DATABASE_SAVE_FAILED":
    case "PRODUCT_NOT_FOUND":
    case "WORKSPACE_NOT_FOUND":
    case "UNKNOWN_UPLOAD_ERROR":
    default:
      return "unknown";
  }
}

export function inferServerUploadErrorCode(message: string): ProductDocumentUploadServerErrorCode {
  const normalized = message.trim().toLowerCase();

  if (!normalized) return "UNKNOWN_UPLOAD_ERROR";

  if (/permission denied|not authorized|forbidden|unauthorized/.test(normalized)) {
    return "UNAUTHORIZED";
  }

  if (/organization is required|workspace/.test(normalized)) {
    return "WORKSPACE_NOT_FOUND";
  }

  if (/product not found/.test(normalized)) {
    return "PRODUCT_NOT_FOUND";
  }

  if (/exceeds|too large|body exceeded|413|size limit|file_too_large/.test(normalized)) {
    return "FILE_TOO_LARGE";
  }

  if (
    /bucket not found|storage|mime type|mimetype|not allowed|object not found|invalidrequest/.test(
      normalized,
    )
  ) {
    return "STORAGE_UPLOAD_FAILED";
  }

  if (
    /row-level security|rls|database|insert|duplicate key|violates/.test(normalized)
  ) {
    return "DATABASE_SAVE_FAILED";
  }

  if (/network|fetch failed|failed to fetch|timeout|connection|unexpected response/.test(normalized)) {
    return "UNKNOWN_UPLOAD_ERROR";
  }

  if (/pdf|corrupt|cannot be read|unreadable/.test(normalized)) {
    return "INVALID_FILE_TYPE";
  }

  if (/unsupported|invalid document|invalid file|file or video/.test(normalized)) {
    return "INVALID_FILE_TYPE";
  }

  if (/missing supabase_service_role_key/.test(normalized)) {
    return "STORAGE_UPLOAD_FAILED";
  }

  return "UNKNOWN_UPLOAD_ERROR";
}
