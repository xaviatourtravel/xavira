import type { ProductDocumentUploadServerErrorCode } from "@/modules/business-brain/lib/product-document-upload-errors";

export class ProductDocumentInsertError extends Error {
  readonly uploadCode: ProductDocumentUploadServerErrorCode;

  constructor(uploadCode: ProductDocumentUploadServerErrorCode, message: string) {
    super(message);
    this.name = "ProductDocumentInsertError";
    this.uploadCode = uploadCode;
  }
}

export function isProductDocumentUniqueViolation(error: unknown): boolean {
  if (error instanceof ProductDocumentInsertError) {
    return error.uploadCode === "DUPLICATE_UPLOAD_FINALIZATION";
  }

  if (error && typeof error === "object") {
    const record = error as { code?: string; message?: string };
    if (record.code === "23505") {
      return true;
    }
    const message = record.message?.toLowerCase() ?? "";
    if (
      /duplicate key|unique constraint|product_documents_file_path_unique/.test(message)
    ) {
      return true;
    }
  }

  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return /duplicate key|unique constraint|product_documents_file_path_unique/.test(message);
}

export function resolveProductDocumentInsertError(
  error: unknown,
): ProductDocumentUploadServerErrorCode {
  if (error instanceof ProductDocumentInsertError) {
    return error.uploadCode;
  }

  if (isProductDocumentUniqueViolation(error)) {
    return "DUPLICATE_UPLOAD_FINALIZATION";
  }

  return "DATABASE_SAVE_FAILED";
}

/**
 * Simulates concurrent finalize attempts against a single-use insert gate.
 * Used in tests to prove only one row can win per storage path.
 */
export async function raceFinalizeInsert<T>(
  storagePath: string,
  insert: (path: string) => Promise<T>,
): Promise<{ winners: T[]; duplicateFailures: number }> {
  const gate = new Map<string, Promise<T>>();

  const run = () => {
    const existing = gate.get(storagePath);
    if (existing) {
      return existing.then(
        () => Promise.reject(new ProductDocumentInsertError("DUPLICATE_UPLOAD_FINALIZATION", "duplicate")),
        () => Promise.reject(new ProductDocumentInsertError("DUPLICATE_UPLOAD_FINALIZATION", "duplicate")),
      );
    }

    const attempt = insert(storagePath);
    gate.set(storagePath, attempt);
    return attempt;
  };

  const results = await Promise.allSettled([run(), run()]);

  const winners: T[] = [];
  let duplicateFailures = 0;

  for (const result of results) {
    if (result.status === "fulfilled") {
      winners.push(result.value);
      continue;
    }

    if (isProductDocumentUniqueViolation(result.reason)) {
      duplicateFailures += 1;
      continue;
    }

    throw result.reason;
  }

  return { winners, duplicateFailures };
}
