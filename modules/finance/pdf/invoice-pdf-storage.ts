import { createAdminClient } from "@/utils/supabase/admin";

export const INVOICE_PDF_BUCKET = "invoice-pdfs";

export function buildInvoicePdfStoragePath(params: {
  organizationId: string;
  invoiceId: string;
  templateVersion: number;
}): string {
  const version = Math.max(1, Math.floor(params.templateVersion));
  return `${params.organizationId}/${params.invoiceId}/${version}/invoice.pdf`;
}

export function buildInvoiceLogoAssetPath(params: {
  organizationId: string;
  invoiceId: string;
  contentHash: string;
  mimeType: "image/png" | "image/jpeg";
}): string {
  const ext = params.mimeType === "image/jpeg" ? "jpg" : "png";
  const hash = params.contentHash.toLowerCase();
  return `${params.organizationId}/${params.invoiceId}/assets/logo-${hash}.${ext}`;
}

export function assertOrganizationScopedStoragePath(
  storagePath: string,
  organizationId: string,
  invoiceId?: string,
): boolean {
  if (!storagePath.startsWith(`${organizationId}/`)) return false;
  if (storagePath.includes("..") || storagePath.includes("\\")) return false;
  if (invoiceId) {
    const second = storagePath.split("/")[1];
    if (second !== invoiceId) return false;
  }
  return true;
}

export async function uploadInvoicePdfToStorage(params: {
  organizationId: string;
  invoiceId: string;
  templateVersion: number;
  buffer: Buffer;
}): Promise<string> {
  const admin = createAdminClient();
  const path = buildInvoicePdfStoragePath(params);

  if (
    !assertOrganizationScopedStoragePath(
      path,
      params.organizationId,
      params.invoiceId,
    )
  ) {
    throw new Error("Invalid PDF storage path");
  }

  // Full buffer already in memory — upload only after successful render.
  // Temporary object names are unused because a failed claim never marks ready.
  const { error } = await admin.storage.from(INVOICE_PDF_BUCKET).upload(path, params.buffer, {
    contentType: "application/pdf",
    upsert: true,
  });

  if (error) {
    throw new Error("Failed to store invoice PDF");
  }

  return path;
}

export async function uploadInvoiceLogoAsset(params: {
  path: string;
  buffer: Buffer;
  contentType: "image/png" | "image/jpeg";
}): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.storage
    .from(INVOICE_PDF_BUCKET)
    .upload(params.path, params.buffer, {
      contentType: params.contentType,
      upsert: false,
    });

  // Identical hash path may already exist from a prior attempt — treat as success.
  if (error && !/already exists|Duplicate|409/i.test(error.message)) {
    throw new Error("Failed to store invoice logo asset");
  }
}

export async function downloadInvoicePdfFromStorage(
  storagePath: string,
  organizationId: string,
): Promise<Buffer | null> {
  if (!assertOrganizationScopedStoragePath(storagePath, organizationId)) {
    return null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(INVOICE_PDF_BUCKET)
    .download(storagePath);

  if (error || !data) {
    return null;
  }

  return Buffer.from(await data.arrayBuffer());
}

/**
 * Best-effort cleanup of draft PDF/logo objects after hard delete.
 * Never throws — DB delete already committed; orphan objects may be retried later.
 */
export async function cleanupDraftInvoiceStorageAssets(params: {
  organizationId: string;
  invoiceId: string;
  pdfStoragePath: string | null;
  logoAssetPath: string | null;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    const paths = [params.pdfStoragePath, params.logoAssetPath].filter(
      (path): path is string =>
        typeof path === "string" &&
        path.length > 0 &&
        assertOrganizationScopedStoragePath(
          path,
          params.organizationId,
          params.invoiceId,
        ),
    );

    if (paths.length === 0) return;

    await admin.storage.from(INVOICE_PDF_BUCKET).remove(paths);
  } catch {
    // Orphan cleanup may be retried; must not corrupt DB state.
  }
}
